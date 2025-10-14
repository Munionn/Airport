import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAircraftModelDto,
  UpdateAircraftModelDto,
  AircraftModelResponseDto,
  SearchAircraftModelsDto,
  AircraftModelStatisticsDto,
  AircraftModelStatisticsResponseDto,
} from './dto/aircraft-model.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class AircraftModelsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new aircraft model
   */
  async create(createAircraftModelDto: CreateAircraftModelDto): Promise<AircraftModelResponseDto> {
    const { model_name, manufacturer } = createAircraftModelDto;

    // Check if model already exists
    const existingModel = await this.databaseService.query(
      `
      SELECT model_id FROM aircraft_models 
      WHERE model_name = $1 AND manufacturer = $2
    `,
      [model_name, manufacturer],
    );

    if (existingModel.rows.length > 0) {
      throw new ConflictException('Aircraft model with this name and manufacturer already exists');
    }

    const result = await this.databaseService.query<AircraftModelResponseDto>(
      `
      INSERT INTO aircraft_models (
        model_name, manufacturer, capacity, max_range, description,
        fuel_capacity, cruise_speed, max_altitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        model_name,
        manufacturer,
        createAircraftModelDto.capacity,
        createAircraftModelDto.max_range,
        createAircraftModelDto.description,
        createAircraftModelDto.fuel_capacity,
        createAircraftModelDto.cruise_speed,
        createAircraftModelDto.max_altitude,
      ],
    );

    return result.rows[0];
  }

  /**
   * Get all aircraft models with pagination and filtering
   */
  async findAll(searchDto: SearchAircraftModelsDto): Promise<PaginatedResponse<AircraftModelResponseDto>> {
    const { page = 1, limit = 10, manufacturer, model_name, min_capacity, max_capacity, min_range, max_range } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (manufacturer) {
      conditions.push(`manufacturer ILIKE $${paramIndex}`);
      params.push(`%${manufacturer}%`);
      paramIndex++;
    }

    if (model_name) {
      conditions.push(`model_name ILIKE $${paramIndex}`);
      params.push(`%${model_name}%`);
      paramIndex++;
    }

    if (min_capacity) {
      conditions.push(`capacity >= $${paramIndex}`);
      params.push(min_capacity);
      paramIndex++;
    }

    if (max_capacity) {
      conditions.push(`capacity <= $${paramIndex}`);
      params.push(max_capacity);
      paramIndex++;
    }

    if (min_range) {
      conditions.push(`max_range >= $${paramIndex}`);
      params.push(min_range);
      paramIndex++;
    }

    if (max_range) {
      conditions.push(`max_range <= $${paramIndex}`);
      params.push(max_range);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM aircraft_models ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<AircraftModelResponseDto>(
      `
      SELECT * FROM aircraft_models 
      ${whereClause}
      ORDER BY manufacturer, model_name
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
   * Get aircraft model by ID
   */
  async findById(model_id: number): Promise<AircraftModelResponseDto> {
    const result = await this.databaseService.query<AircraftModelResponseDto>(
      'SELECT * FROM aircraft_models WHERE model_id = $1',
      [model_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Aircraft model not found');
    }

    return result.rows[0];
  }

  /**
   * Update aircraft model
   */
  async update(model_id: number, updateAircraftModelDto: UpdateAircraftModelDto): Promise<AircraftModelResponseDto> {
    const existingModel = await this.findById(model_id);

    // Check for conflicts if updating name or manufacturer
    if (updateAircraftModelDto.model_name || updateAircraftModelDto.manufacturer) {
      const newName = updateAircraftModelDto.model_name || existingModel.model_name;
      const newManufacturer = updateAircraftModelDto.manufacturer || existingModel.manufacturer;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT model_id FROM aircraft_models 
        WHERE model_name = $1 AND manufacturer = $2 AND model_id != $3
      `,
        [newName, newManufacturer, model_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Aircraft model with this name and manufacturer already exists');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateAircraftModelDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingModel;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(model_id);

    const result = await this.databaseService.query<AircraftModelResponseDto>(
      `
      UPDATE aircraft_models 
      SET ${updateFields.join(', ')}
      WHERE model_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return result.rows[0];
  }

  /**
   * Delete aircraft model
   */
  async remove(model_id: number): Promise<void> {
    const existingModel = await this.findById(model_id);

    // Check if model is in use by any aircraft
    const aircraftCheck = await this.databaseService.query(
      'SELECT COUNT(*) as count FROM aircraft WHERE model_id = $1',
      [model_id],
    );

    if (parseInt(aircraftCheck.rows[0].count) > 0) {
      throw new ConflictException('Cannot delete aircraft model that is in use by aircraft');
    }

    await this.databaseService.query('DELETE FROM aircraft_models WHERE model_id = $1', [model_id]);
  }

  /**
   * Get aircraft model statistics
   */
  async getStatistics(statisticsDto: AircraftModelStatisticsDto): Promise<AircraftModelStatisticsResponseDto[]> {
    const { manufacturer, min_capacity, max_capacity } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (manufacturer) {
      conditions.push(`am.manufacturer = $${paramIndex}`);
      params.push(manufacturer);
      paramIndex++;
    }

    if (min_capacity) {
      conditions.push(`am.capacity >= $${paramIndex}`);
      params.push(min_capacity);
      paramIndex++;
    }

    if (max_capacity) {
      conditions.push(`am.capacity <= $${paramIndex}`);
      params.push(max_capacity);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<AircraftModelStatisticsResponseDto>(
      `
      SELECT 
        am.manufacturer,
        COUNT(DISTINCT am.model_id) as model_count,
        SUM(am.capacity) as total_capacity,
        AVG(am.capacity) as average_capacity,
        (
          SELECT am2.model_name 
          FROM aircraft_models am2 
          JOIN aircraft a2 ON am2.model_id = a2.model_id 
          WHERE am2.manufacturer = am.manufacturer 
          GROUP BY am2.model_id, am2.model_name 
          ORDER BY COUNT(a2.aircraft_id) DESC 
          LIMIT 1
        ) as most_popular_model,
        COUNT(f.flight_id) as total_flights,
        CASE 
          WHEN COUNT(DISTINCT a.aircraft_id) > 0 
          THEN (COUNT(f.flight_id)::float / COUNT(DISTINCT a.aircraft_id))::float
          ELSE 0 
        END as utilization_rate
      FROM aircraft_models am
      LEFT JOIN aircraft a ON am.model_id = a.model_id
      LEFT JOIN flights f ON a.aircraft_id = f.aircraft_id
      ${whereClause}
      GROUP BY am.manufacturer
      ORDER BY model_count DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Get aircraft models by manufacturer
   */
  async findByManufacturer(manufacturer: string): Promise<AircraftModelResponseDto[]> {
    const result = await this.databaseService.query<AircraftModelResponseDto>(
      `
      SELECT * FROM aircraft_models 
      WHERE manufacturer ILIKE $1 
      ORDER BY model_name
    `,
      [`%${manufacturer}%`],
    );

    return result.rows;
  }

  /**
   * Get most popular aircraft models
   */
  async getMostPopular(limit: number = 10): Promise<Array<AircraftModelResponseDto & { aircraft_count: number }>> {
    const result = await this.databaseService.query<AircraftModelResponseDto & { aircraft_count: number }>(
      `
      SELECT 
        am.*,
        COUNT(a.aircraft_id) as aircraft_count
      FROM aircraft_models am
      LEFT JOIN aircraft a ON am.model_id = a.model_id
      GROUP BY am.model_id
      ORDER BY aircraft_count DESC, am.model_name
      LIMIT $1
    `,
      [limit],
    );

    return result.rows;
  }
}
