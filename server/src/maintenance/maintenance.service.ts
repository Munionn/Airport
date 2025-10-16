import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  MaintenanceResponseDto,
  SearchMaintenanceDto,
  MaintenanceStatisticsDto,
  MaintenanceStatisticsResponseDto,
  CompleteMaintenanceDto,
} from './dto/maintenance.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';
import { MaintenanceType, MaintenanceStatus } from '../shared/enums';

@Injectable()
export class MaintenanceService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create/schedule new maintenance
   */
  async create(createMaintenanceDto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
    const { aircraft_id, type, scheduled_date } = createMaintenanceDto;

    // Check if aircraft exists
    const aircraftCheck = await this.databaseService.query(
      'SELECT aircraft_id FROM aircraft WHERE aircraft_id = $1',
      [aircraft_id],
    );

    if (aircraftCheck.rows.length === 0) {
      throw new NotFoundException('Aircraft not found');
    }

    // Check if aircraft is available for maintenance
    if (scheduled_date) {
      const flightCheck = await this.databaseService.query(
        `
        SELECT COUNT(*) as count FROM flights 
        WHERE aircraft_id = $1 
        AND status IN ('scheduled', 'boarding', 'departed')
        AND scheduled_departure BETWEEN $2::date AND $2::date + INTERVAL '1 day'
      `,
        [aircraft_id, scheduled_date],
      );

      if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
        throw new ConflictException('Aircraft has flights scheduled on this date');
      }
    }

    // Check if technician exists (if provided)
    if (createMaintenanceDto.technician_id) {
      const technicianCheck = await this.databaseService.query(
        'SELECT user_id FROM users WHERE user_id = $1',
        [createMaintenanceDto.technician_id],
      );

      if (technicianCheck.rows.length === 0) {
        throw new NotFoundException('Technician not found');
      }
    }

    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      INSERT INTO maintenance (
        aircraft_id, type, description, estimated_duration_hours, estimated_cost,
        scheduled_date, notes, parts_required, technician_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        aircraft_id,
        type,
        createMaintenanceDto.description,
        createMaintenanceDto.estimated_duration_hours,
        createMaintenanceDto.estimated_cost,
        scheduled_date ? new Date(scheduled_date) : null,
        createMaintenanceDto.notes,
        createMaintenanceDto.parts_required,
        createMaintenanceDto.technician_id,
        MaintenanceStatus.SCHEDULED,
      ],
    );

    return await this.findById(result.rows[0].maintenance_id);
  }

  /**
   * Get all maintenance records with pagination and filtering
   */
  async findAll(
    searchDto: SearchMaintenanceDto,
  ): Promise<PaginatedResponse<MaintenanceResponseDto>> {
    const {
      page = 1,
      limit = 10,
      aircraft_id,
      type,
      status,
      technician_id,
      scheduled_date_from,
      scheduled_date_to,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (aircraft_id) {
      conditions.push(`m.aircraft_id = $${paramIndex}`);
      params.push(aircraft_id);
      paramIndex++;
    }

    if (type) {
      conditions.push(`m.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (status) {
      conditions.push(`m.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (technician_id) {
      conditions.push(`m.technician_id = $${paramIndex}`);
      params.push(technician_id);
      paramIndex++;
    }

    if (scheduled_date_from) {
      conditions.push(`m.scheduled_date >= $${paramIndex}`);
      params.push(scheduled_date_from);
      paramIndex++;
    }

    if (scheduled_date_to) {
      conditions.push(`m.scheduled_date <= $${paramIndex}`);
      params.push(scheduled_date_to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM maintenance m ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      SELECT 
        m.*,
        a.registration_number,
        am.model_name,
        u.first_name || ' ' || u.last_name as technician_name
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      ${whereClause}
      ORDER BY m.scheduled_date DESC, m.created_at DESC
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
   * Get maintenance record by ID
   */
  async findById(maintenance_id: number): Promise<MaintenanceResponseDto> {
    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      SELECT 
        m.*,
        a.registration_number,
        am.model_name,
        u.first_name || ' ' || u.last_name as technician_name
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      WHERE m.maintenance_id = $1
    `,
      [maintenance_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Maintenance record not found');
    }

    return result.rows[0];
  }

  /**
   * Update maintenance record
   */
  async update(
    maintenance_id: number,
    updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<MaintenanceResponseDto> {
    const existingMaintenance = await this.findById(maintenance_id);

    // Check if maintenance can be updated
    if (existingMaintenance.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed maintenance record');
    }

    // Check aircraft availability if rescheduling
    if (
      updateMaintenanceDto.scheduled_date &&
      new Date(updateMaintenanceDto.scheduled_date).getTime() !==
        existingMaintenance.scheduled_date?.getTime()
    ) {
      const flightCheck = await this.databaseService.query(
        `
        SELECT COUNT(*) as count FROM flights 
        WHERE aircraft_id = $1 
        AND status IN ('scheduled', 'boarding', 'departed')
        AND scheduled_departure BETWEEN $2::date AND $2::date + INTERVAL '1 day'
      `,
        [existingMaintenance.aircraft_id, updateMaintenanceDto.scheduled_date],
      );

      if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
        throw new ConflictException('Aircraft has flights scheduled on this date');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateMaintenanceDto).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'scheduled_date' || key === 'start_date' || key === 'completion_date') {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(new Date(value as string));
        } else {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingMaintenance;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(maintenance_id);

    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      UPDATE maintenance 
      SET ${updateFields.join(', ')}
      WHERE maintenance_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].maintenance_id);
  }

  /**
   * Start maintenance
   */
  async startMaintenance(maintenance_id: number): Promise<MaintenanceResponseDto> {
    const maintenance = await this.findById(maintenance_id);

    if (maintenance.status !== MaintenanceStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled maintenance can be started');
    }

    await this.databaseService.query(
      `
      UPDATE maintenance 
      SET 
        status = $1,
        start_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = $2
    `,
      [MaintenanceStatus.IN_PROGRESS, maintenance_id],
    );

    // Update aircraft status
    await this.databaseService.query(
      'UPDATE aircraft SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE aircraft_id = $2',
      ['maintenance', maintenance.aircraft_id],
    );

    return await this.findById(maintenance_id);
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(completeDto: CompleteMaintenanceDto): Promise<MaintenanceResponseDto> {
    const { maintenance_id, actual_duration_hours, actual_cost, completion_notes, parts_used } =
      completeDto;

    const maintenance = await this.findById(maintenance_id);

    if (maintenance.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress maintenance can be completed');
    }

    await this.databaseService.query(
      `
      UPDATE maintenance 
      SET 
        status = $1,
        actual_duration_hours = $2,
        actual_cost = $3,
        completion_date = CURRENT_TIMESTAMP,
        notes = COALESCE($4, notes),
        parts_required = COALESCE($5, parts_required),
        updated_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = $6
    `,
      [
        MaintenanceStatus.COMPLETED,
        actual_duration_hours,
        actual_cost,
        completion_notes,
        parts_used,
        maintenance_id,
      ],
    );

    // Update aircraft status back to active
    await this.databaseService.query(
      'UPDATE aircraft SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE aircraft_id = $2',
      ['active', maintenance.aircraft_id],
    );

    // Update aircraft maintenance dates
    await this.databaseService.query(
      `
      UPDATE aircraft 
      SET 
        last_maintenance = CURRENT_DATE,
        next_maintenance = CURRENT_DATE + INTERVAL '6 months',
        updated_at = CURRENT_TIMESTAMP
      WHERE aircraft_id = $1
    `,
      [maintenance.aircraft_id],
    );

    return await this.findById(maintenance_id);
  }

  /**
   * Cancel maintenance
   */
  async cancelMaintenance(
    maintenance_id: number,
    reason?: string,
  ): Promise<MaintenanceResponseDto> {
    const maintenance = await this.findById(maintenance_id);

    if (maintenance.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed maintenance');
    }

    await this.databaseService.query(
      `
      UPDATE maintenance 
      SET 
        status = $1,
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE maintenance_id = $3
    `,
      [MaintenanceStatus.CANCELLED, reason, maintenance_id],
    );

    // Update aircraft status back to active if it was in maintenance
    if (maintenance.status === MaintenanceStatus.IN_PROGRESS) {
      await this.databaseService.query(
        'UPDATE aircraft SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE aircraft_id = $2',
        ['active', maintenance.aircraft_id],
      );
    }

    return await this.findById(maintenance_id);
  }

  /**
   * Delete maintenance record
   */
  async remove(maintenance_id: number): Promise<void> {
    const existingMaintenance = await this.findById(maintenance_id);

    if (existingMaintenance.status === MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete in-progress maintenance record');
    }

    await this.databaseService.query('DELETE FROM maintenance WHERE maintenance_id = $1', [
      maintenance_id,
    ]);
  }

  /**
   * Get maintenance for specific aircraft
   */
  async getMaintenanceForAircraft(aircraft_id: number): Promise<MaintenanceResponseDto[]> {
    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      SELECT 
        m.*,
        a.registration_number,
        am.model_name,
        u.first_name || ' ' || u.last_name as technician_name
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      WHERE m.aircraft_id = $1
      ORDER BY m.scheduled_date DESC
    `,
      [aircraft_id],
    );

    return result.rows;
  }

  /**
   * Get upcoming maintenance
   */
  async getUpcomingMaintenance(days: number = 30): Promise<MaintenanceResponseDto[]> {
    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      SELECT 
        m.*,
        a.registration_number,
        am.model_name,
        u.first_name || ' ' || u.last_name as technician_name
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      WHERE m.status = 'scheduled'
      AND m.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      ORDER BY m.scheduled_date ASC
    `,
    );

    return result.rows;
  }

  /**
   * Get overdue maintenance
   */
  async getOverdueMaintenance(): Promise<MaintenanceResponseDto[]> {
    const result = await this.databaseService.query<MaintenanceResponseDto>(
      `
      SELECT 
        m.*,
        a.registration_number,
        am.model_name,
        u.first_name || ' ' || u.last_name as technician_name
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      WHERE m.status = 'scheduled'
      AND m.scheduled_date < CURRENT_DATE
      ORDER BY m.scheduled_date ASC
    `,
    );

    return result.rows;
  }

  /**
   * Get maintenance statistics
   */
  async getStatistics(
    statisticsDto: MaintenanceStatisticsDto,
  ): Promise<MaintenanceStatisticsResponseDto> {
    const { aircraft_id, type, status, period = 'all_time' } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (aircraft_id) {
      conditions.push(`m.aircraft_id = $${paramIndex}`);
      params.push(aircraft_id);
      paramIndex++;
    }

    if (type) {
      conditions.push(`m.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (status) {
      conditions.push(`m.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(*) as total_maintenance,
        COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_maintenance,
        COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as scheduled_maintenance,
        COUNT(CASE WHEN m.status = 'in_progress' THEN 1 END) as in_progress_maintenance,
        COUNT(CASE WHEN m.status = 'cancelled' THEN 1 END) as cancelled_maintenance,
        COALESCE(SUM(m.actual_cost), 0) as total_cost,
        COALESCE(AVG(m.actual_duration_hours), 0) as average_duration_hours
      FROM maintenance m
      ${whereClause}
    `,
      params,
    );

    const stats = statsResult.rows[0] as {
      total_maintenance: string;
      completed_maintenance: string;
      scheduled_maintenance: string;
      in_progress_maintenance: string;
      cancelled_maintenance: string;
      total_cost: string;
      average_duration_hours: string;
    };

    // Get maintenance by type
    const typeResult = await this.databaseService.query(
      `
      SELECT 
        m.type,
        COUNT(*) as count
      FROM maintenance m
      ${whereClause}
      GROUP BY m.type
    `,
      params,
    );

    const maintenanceByType: Record<MaintenanceType, number> = {
      [MaintenanceType.ROUTINE]: 0,
      [MaintenanceType.REPAIR]: 0,
      [MaintenanceType.INSPECTION]: 0,
      [MaintenanceType.OVERHAUL]: 0,
    };

    typeResult.rows.forEach((row: { type: MaintenanceType; count: string }) => {
      maintenanceByType[row.type] = parseInt(row.count);
    });

    // Get maintenance by status
    const statusResult = await this.databaseService.query(
      `
      SELECT 
        m.status,
        COUNT(*) as count
      FROM maintenance m
      ${whereClause}
      GROUP BY m.status
    `,
      params,
    );

    const maintenanceByStatus: Record<MaintenanceStatus, number> = {
      [MaintenanceStatus.SCHEDULED]: 0,
      [MaintenanceStatus.IN_PROGRESS]: 0,
      [MaintenanceStatus.COMPLETED]: 0,
      [MaintenanceStatus.CANCELLED]: 0,
    };

    statusResult.rows.forEach((row: { status: MaintenanceStatus; count: string }) => {
      maintenanceByStatus[row.status] = parseInt(row.count);
    });

    // Get upcoming maintenance
    const upcomingResult = await this.databaseService.query(
      `
      SELECT 
        m.maintenance_id,
        m.aircraft_id,
        a.registration_number,
        m.type,
        m.scheduled_date,
        EXTRACT(DAYS FROM (m.scheduled_date - CURRENT_DATE)) as days_until_due
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      WHERE m.status = 'scheduled'
      AND m.scheduled_date >= CURRENT_DATE
      ORDER BY m.scheduled_date ASC
      LIMIT 10
    `,
    );

    // Get overdue maintenance
    const overdueResult = await this.databaseService.query(
      `
      SELECT 
        m.maintenance_id,
        m.aircraft_id,
        a.registration_number,
        m.type,
        m.scheduled_date,
        EXTRACT(DAYS FROM (CURRENT_DATE - m.scheduled_date)) as days_overdue
      FROM maintenance m
      JOIN aircraft a ON m.aircraft_id = a.aircraft_id
      WHERE m.status = 'scheduled'
      AND m.scheduled_date < CURRENT_DATE
      ORDER BY m.scheduled_date ASC
      LIMIT 10
    `,
    );

    return {
      period,
      total_maintenance: parseInt(stats.total_maintenance),
      completed_maintenance: parseInt(stats.completed_maintenance),
      scheduled_maintenance: parseInt(stats.scheduled_maintenance),
      in_progress_maintenance: parseInt(stats.in_progress_maintenance),
      cancelled_maintenance: parseInt(stats.cancelled_maintenance),
      total_cost: parseFloat(stats.total_cost || '0'),
      average_duration_hours: parseFloat(stats.average_duration_hours || '0'),
      maintenance_by_type: maintenanceByType,
      maintenance_by_status: maintenanceByStatus,
      upcoming_maintenance: upcomingResult.rows.map(
        (row: {
          maintenance_id: number;
          aircraft_id: number;
          registration_number: string;
          type: MaintenanceType;
          scheduled_date: Date;
          days_until_due: string;
        }) => ({
          maintenance_id: row.maintenance_id,
          aircraft_id: row.aircraft_id,
          registration_number: row.registration_number,
          type: row.type,
          scheduled_date: row.scheduled_date,
          days_until_due: parseInt(row.days_until_due),
        }),
      ),
      overdue_maintenance: overdueResult.rows.map(
        (row: {
          maintenance_id: number;
          aircraft_id: number;
          registration_number: string;
          type: MaintenanceType;
          scheduled_date: Date;
          days_overdue: string;
        }) => ({
          maintenance_id: row.maintenance_id,
          aircraft_id: row.aircraft_id,
          registration_number: row.registration_number,
          type: row.type,
          scheduled_date: row.scheduled_date,
          days_overdue: parseInt(row.days_overdue),
        }),
      ),
    };
  }
}
