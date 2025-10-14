import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAircraftDto,
  UpdateAircraftDto,
  AircraftResponseDto,
  SearchAircraftDto,
  AircraftStatisticsDto,
  AircraftStatisticsResponseDto,
  AircraftEfficiencyDto,
  AircraftEfficiencyResponseDto,
  MaintenanceScheduleDto,
  MaintenanceScheduleResponseDto,
} from './dto/aircraft.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';
import { AircraftStatus } from '../shared/enums';

@Injectable()
export class AircraftService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new aircraft
   */
  async create(createAircraftDto: CreateAircraftDto): Promise<AircraftResponseDto> {
    const { registration_number } = createAircraftDto;

    // Check if registration number already exists
    const existingAircraft = await this.databaseService.query(
      'SELECT aircraft_id FROM aircraft WHERE registration_number = $1',
      [registration_number],
    );

    if (existingAircraft.rows.length > 0) {
      throw new ConflictException('Aircraft with this registration number already exists');
    }

    // Verify aircraft model exists
    const modelCheck = await this.databaseService.query(
      'SELECT model_id FROM aircraft_models WHERE model_id = $1',
      [createAircraftDto.model_id],
    );

    if (modelCheck.rows.length === 0) {
      throw new NotFoundException('Aircraft model not found');
    }

    const result = await this.databaseService.query<AircraftResponseDto>(
      `
      INSERT INTO aircraft (
        registration_number, model_id, status, purchase_date,
        last_maintenance, next_maintenance, notes, total_flight_hours, total_cycles
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        registration_number,
        createAircraftDto.model_id,
        createAircraftDto.status,
        createAircraftDto.purchase_date,
        createAircraftDto.last_maintenance,
        createAircraftDto.next_maintenance,
        createAircraftDto.notes,
        createAircraftDto.total_flight_hours || 0,
        createAircraftDto.total_cycles || 0,
      ],
    );

    return await this.findById(result.rows[0].aircraft_id);
  }

  /**
   * Get all aircraft with pagination and filtering
   */
  async findAll(searchDto: SearchAircraftDto): Promise<PaginatedResponse<AircraftResponseDto>> {
    const {
      page = 1,
      limit = 10,
      registration_number,
      manufacturer,
      model_name,
      status,
      model_id,
      purchase_date_from,
      purchase_date_to,
      maintenance_due_from,
      maintenance_due_to,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (registration_number) {
      conditions.push(`a.registration_number ILIKE $${paramIndex}`);
      params.push(`%${registration_number}%`);
      paramIndex++;
    }

    if (manufacturer) {
      conditions.push(`am.manufacturer ILIKE $${paramIndex}`);
      params.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (model_name) {
      conditions.push(`am.model_name ILIKE $${paramIndex}`);
      params.push(`%${model_name}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (model_id) {
      conditions.push(`a.model_id = $${paramIndex}`);
      params.push(model_id);
      paramIndex++;
    }

    if (purchase_date_from) {
      conditions.push(`a.purchase_date >= $${paramIndex}`);
      params.push(purchase_date_from);
      paramIndex++;
    }

    if (purchase_date_to) {
      conditions.push(`a.purchase_date <= $${paramIndex}`);
      params.push(purchase_date_to);
      paramIndex++;
    }

    if (maintenance_due_from) {
      conditions.push(`a.next_maintenance >= $${paramIndex}`);
      params.push(maintenance_due_from);
      paramIndex++;
    }

    if (maintenance_due_to) {
      conditions.push(`a.next_maintenance <= $${paramIndex}`);
      params.push(maintenance_due_to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<AircraftResponseDto>(
      `
      SELECT 
        a.*,
        am.model_name,
        am.manufacturer,
        am.capacity,
        am.max_range
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      ${whereClause}
      ORDER BY a.registration_number
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset],
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Get aircraft by ID
   */
  async findById(aircraft_id: number): Promise<AircraftResponseDto> {
    const result = await this.databaseService.query<AircraftResponseDto>(
      `
      SELECT 
        a.*,
        am.model_name,
        am.manufacturer,
        am.capacity,
        am.max_range
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      WHERE a.aircraft_id = $1
    `,
      [aircraft_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Aircraft not found');
    }

    return result.rows[0];
  }

  /**
   * Update aircraft
   */
  async update(
    aircraft_id: number,
    updateAircraftDto: UpdateAircraftDto,
  ): Promise<AircraftResponseDto> {
    const existingAircraft = await this.findById(aircraft_id);

    // Check for conflicts if updating registration number
    if (updateAircraftDto.registration_number) {
      const conflictCheck = await this.databaseService.query(
        'SELECT aircraft_id FROM aircraft WHERE registration_number = $1 AND aircraft_id != $2',
        [updateAircraftDto.registration_number, aircraft_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Aircraft with this registration number already exists');
      }
    }

    // Verify aircraft model exists if updating
    if (updateAircraftDto.model_id) {
      const modelCheck = await this.databaseService.query(
        'SELECT model_id FROM aircraft_models WHERE model_id = $1',
        [updateAircraftDto.model_id],
      );

      if (modelCheck.rows.length === 0) {
        throw new NotFoundException('Aircraft model not found');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateAircraftDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingAircraft;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(aircraft_id);

    const result = await this.databaseService.query<AircraftResponseDto>(
      `
      UPDATE aircraft 
      SET ${updateFields.join(', ')}
      WHERE aircraft_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].aircraft_id);
  }

  /**
   * Delete aircraft
   */
  async remove(aircraft_id: number): Promise<void> {
    await this.findById(aircraft_id);

    // Check if aircraft is assigned to any flights
    const flightCheck = await this.databaseService.query(
      'SELECT COUNT(*) as count FROM flights WHERE aircraft_id = $1',
      [aircraft_id],
    );

    if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete aircraft that is assigned to flights');
    }

    await this.databaseService.query('DELETE FROM aircraft WHERE aircraft_id = $1', [aircraft_id]);
  }

  /**
   * Get aircraft statistics
   */
  async getStatistics(
    statisticsDto: AircraftStatisticsDto,
  ): Promise<AircraftStatisticsResponseDto> {
    const { manufacturer, status, from_date, to_date } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (manufacturer) {
      conditions.push(`am.manufacturer = $${paramIndex}`);
      params.push(manufacturer);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const dateFilter =
      from_date && to_date
        ? `AND f.scheduled_departure BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        : '';
    if (dateFilter) {
      params.push(from_date, to_date);
    }

    const result = await this.databaseService.query<AircraftStatisticsResponseDto>(
      `
      SELECT 
        COUNT(DISTINCT a.aircraft_id) as total_aircraft,
        COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.aircraft_id END) as active_aircraft,
        COUNT(DISTINCT CASE WHEN a.next_maintenance <= CURRENT_DATE + INTERVAL '30 days' THEN a.aircraft_id END) as maintenance_due,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date))) as average_age_years,
        SUM(a.total_flight_hours) as total_flight_hours,
        AVG(
          CASE 
            WHEN COUNT(f.flight_id) > 0 
            THEN (COUNT(f.flight_id)::float / EXTRACT(DAYS FROM AGE(CURRENT_DATE, a.purchase_date)))::float
            ELSE 0 
          END
        ) as average_utilization,
        (
          SELECT json_build_object(
            'aircraft_id', a2.aircraft_id,
            'registration_number', a2.registration_number,
            'flight_count', COUNT(f2.flight_id)
          )
          FROM aircraft a2
          LEFT JOIN flights f2 ON a2.aircraft_id = f2.aircraft_id ${dateFilter}
          GROUP BY a2.aircraft_id, a2.registration_number
          ORDER BY COUNT(f2.flight_id) DESC
          LIMIT 1
        ) as most_used_aircraft,
        (
          SELECT json_agg(
            json_build_object(
              'manufacturer', am2.manufacturer,
              'count', COUNT(a3.aircraft_id),
              'percentage', ROUND((COUNT(a3.aircraft_id)::float / (SELECT COUNT(*) FROM aircraft)::float) * 100, 2)
            )
          )
          FROM aircraft_models am2
          JOIN aircraft a3 ON am2.model_id = a3.model_id
          GROUP BY am2.manufacturer
        ) as manufacturer_breakdown
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN flights f ON a.aircraft_id = f.aircraft_id ${dateFilter}
      ${whereClause}
      GROUP BY a.aircraft_id
    `,
      params,
    );

    return result.rows[0];
  }

  /**
   * Get aircraft efficiency analysis
   */
  async getEfficiencyAnalysis(
    efficiencyDto: AircraftEfficiencyDto,
  ): Promise<AircraftEfficiencyResponseDto[]> {
    const { manufacturer, from_date, to_date } = efficiencyDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (manufacturer) {
      conditions.push(`am.manufacturer = $${paramIndex}`);
      params.push(manufacturer);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const dateFilter =
      from_date && to_date
        ? `AND f.scheduled_departure BETWEEN $${paramIndex} AND $${paramIndex + 1}`
        : '';
    if (dateFilter) {
      params.push(from_date, to_date);
    }

    const result = await this.databaseService.query<AircraftEfficiencyResponseDto>(
      `
      SELECT 
        a.aircraft_id,
        a.registration_number,
        am.model_name,
        am.manufacturer,
        COUNT(f.flight_id) as total_flights,
        COALESCE(SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600), 0) as total_hours,
        COALESCE(SUM(
          (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
        ), 0) as total_passengers,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND((COUNT(f.flight_id)::float / EXTRACT(DAYS FROM AGE(CURRENT_DATE, a.purchase_date)))::float * 100, 2)
          ELSE 0 
        END as utilization_rate,
        CASE 
          WHEN COUNT(f.flight_id) > 0 AND COALESCE(SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600), 0) > 0
          THEN ROUND(
            (COALESCE(SUM(
              (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
            ), 0)::float / 
            (am.capacity * COUNT(f.flight_id))::float) * 100, 2
          )
          ELSE 0 
        END as efficiency_score,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND(
            (COALESCE(SUM(
              (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
            ), 0)::float / 
            (am.capacity * COUNT(f.flight_id))::float) * 100, 2
          )
          ELSE 0 
        END as average_load_factor,
        CASE 
          WHEN COALESCE(SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600), 0) > 0
          THEN ROUND(
            COALESCE(SUM(
              (SELECT SUM(t.price) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
            ), 0) / 
            COALESCE(SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600), 1), 2
          )
          ELSE 0 
        END as revenue_per_hour
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN flights f ON a.aircraft_id = f.aircraft_id ${dateFilter}
      ${whereClause}
      GROUP BY a.aircraft_id, a.registration_number, am.model_name, am.manufacturer, am.capacity, a.purchase_date
      ORDER BY efficiency_score DESC, utilization_rate DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Get maintenance schedule
   */
  async getMaintenanceSchedule(
    scheduleDto: MaintenanceScheduleDto,
  ): Promise<MaintenanceScheduleResponseDto[]> {
    const { from_date, to_date, status } = scheduleDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`a.next_maintenance >= $${paramIndex}`);
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      conditions.push(`a.next_maintenance <= $${paramIndex}`);
      params.push(to_date);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<MaintenanceScheduleResponseDto>(
      `
      SELECT 
        a.aircraft_id,
        a.registration_number,
        am.model_name,
        a.last_maintenance,
        a.next_maintenance,
        EXTRACT(DAYS FROM (a.next_maintenance - CURRENT_DATE)) as days_until_maintenance,
        a.status,
        CASE 
          WHEN EXTRACT(DAYS FROM (a.next_maintenance - CURRENT_DATE)) <= 7 THEN 'Emergency'
          WHEN EXTRACT(DAYS FROM (a.next_maintenance - CURRENT_DATE)) <= 30 THEN 'Scheduled'
          ELSE 'Routine'
        END as maintenance_type,
        CASE 
          WHEN EXTRACT(DAYS FROM (a.next_maintenance - CURRENT_DATE)) <= 7 THEN 24
          WHEN EXTRACT(DAYS FROM (a.next_maintenance - CURRENT_DATE)) <= 30 THEN 8
          ELSE 4
        END as estimated_duration_hours
      FROM aircraft a
      JOIN aircraft_models am ON a.model_id = am.model_id
      ${whereClause}
      ORDER BY a.next_maintenance ASC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Update aircraft status
   */
  async updateStatus(aircraft_id: number, status: AircraftStatus): Promise<AircraftResponseDto> {
    await this.findById(aircraft_id);

    await this.databaseService.query(
      'UPDATE aircraft SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE aircraft_id = $2',
      [status, aircraft_id],
    );

    return await this.findById(aircraft_id);
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    aircraft_id: number,
    maintenance_date: Date,
    notes?: string,
  ): Promise<AircraftResponseDto> {
    await this.findById(aircraft_id);

    await this.databaseService.query(
      `
      UPDATE aircraft 
      SET 
        last_maintenance = CURRENT_DATE,
        next_maintenance = $1,
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE aircraft_id = $3
    `,
      [maintenance_date, notes, aircraft_id],
    );

    return await this.findById(aircraft_id);
  }
}
