import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityResponseDto,
  SearchCitiesDto,
  CityStatisticsDto,
  CityStatisticsResponseDto,
} from './dto/city.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new city
   */
  async create(createCityDto: CreateCityDto): Promise<CityResponseDto> {
    const { city_name, country } = createCityDto;

    // Check if city already exists
    const existingCity = await this.databaseService.query(
      `
      SELECT city_id FROM cities 
      WHERE city_name = $1 AND country = $2
    `,
      [city_name, country],
    );

    if (existingCity.rows.length > 0) {
      throw new ConflictException('City with this name and country already exists');
    }

    const result = await this.databaseService.query<CityResponseDto>(
      `
      INSERT INTO cities (
        city_name, country, timezone, latitude, longitude, region, country_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        city_name,
        country,
        createCityDto.timezone,
        createCityDto.latitude,
        createCityDto.longitude,
        createCityDto.region,
        createCityDto.country_code,
      ],
    );

    return result.rows[0];
  }

  /**
   * Get all cities with pagination and filtering
   */
  async findAll(searchDto: SearchCitiesDto): Promise<PaginatedResponse<CityResponseDto>> {
    const {
      page = 1,
      limit = 10,
      city_name,
      country,
      region,
      country_code,
      timezone,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (city_name) {
      conditions.push(`city_name ILIKE $${paramIndex}`);
      params.push(`%${city_name}%`);
      paramIndex++;
    }

    if (country) {
      conditions.push(`country ILIKE $${paramIndex}`);
      params.push(`%${country}%`);
      paramIndex++;
    }

    if (region) {
      conditions.push(`region ILIKE $${paramIndex}`);
      params.push(`%${region}%`);
      paramIndex++;
    }

    if (country_code) {
      conditions.push(`country_code = $${paramIndex}`);
      params.push(country_code);
      paramIndex++;
    }

    if (timezone) {
      conditions.push(`timezone = $${paramIndex}`);
      params.push(timezone);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM cities ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<CityResponseDto>(
      `
      SELECT * FROM cities 
      ${whereClause}
      ORDER BY country, city_name
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
   * Get city by ID
   */
  async findById(city_id: number): Promise<CityResponseDto> {
    const result = await this.databaseService.query<CityResponseDto>(
      'SELECT * FROM cities WHERE city_id = $1',
      [city_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('City not found');
    }

    return result.rows[0];
  }

  /**
   * Update city
   */
  async update(city_id: number, updateCityDto: UpdateCityDto): Promise<CityResponseDto> {
    const existingCity = await this.findById(city_id);

    // Check for conflicts if updating name or country
    if (updateCityDto.city_name || updateCityDto.country) {
      const newName = updateCityDto.city_name || existingCity.city_name;
      const newCountry = updateCityDto.country || existingCity.country;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT city_id FROM cities 
        WHERE city_name = $1 AND country = $2 AND city_id != $3
      `,
        [newName, newCountry, city_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('City with this name and country already exists');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateCityDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingCity;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(city_id);

    const result = await this.databaseService.query<CityResponseDto>(
      `
      UPDATE cities 
      SET ${updateFields.join(', ')}
      WHERE city_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return result.rows[0];
  }

  /**
   * Delete city
   */
  async remove(city_id: number): Promise<void> {
    const existingCity = await this.findById(city_id);

    // Check if city has airports
    const airportCheck = await this.databaseService.query(
      'SELECT COUNT(*) as count FROM airports WHERE city_id = $1',
      [city_id],
    );

    if (parseInt((airportCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete city that has airports');
    }

    await this.databaseService.query('DELETE FROM cities WHERE city_id = $1', [city_id]);
  }

  /**
   * Get cities by country
   */
  async findByCountry(country: string): Promise<CityResponseDto[]> {
    const result = await this.databaseService.query<CityResponseDto>(
      `
      SELECT * FROM cities 
      WHERE country ILIKE $1 
      ORDER BY city_name
    `,
      [`%${country}%`],
    );

    return result.rows;
  }

  /**
   * Get city statistics
   */
  async getStatistics(statisticsDto: CityStatisticsDto): Promise<CityStatisticsResponseDto[]> {
    const { country, region } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (country) {
      conditions.push(`c.country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (region) {
      conditions.push(`c.region = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<CityStatisticsResponseDto>(
      `
      SELECT 
        c.city_id,
        c.city_name,
        c.country,
        COUNT(DISTINCT a.airport_id) as airport_count,
        COUNT(f.flight_id) as total_flights,
        COALESCE(SUM(
          (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
        ), 0) as total_passengers,
        COALESCE(AVG(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600), 0) as average_flight_duration,
        (
          SELECT arr_city.city_name
          FROM flights f2
          JOIN airports arr_airport ON f2.arrival_airport_id = arr_airport.airport_id
          JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
          WHERE f2.departure_airport_id IN (
            SELECT airport_id FROM airports WHERE city_id = c.city_id
          )
          GROUP BY arr_city.city_id, arr_city.city_name
          ORDER BY COUNT(f2.flight_id) DESC
          LIMIT 1
        ) as most_popular_destination,
        (
          SELECT TO_CHAR(f3.scheduled_departure, 'Month')
          FROM flights f3
          WHERE f3.departure_airport_id IN (
            SELECT airport_id FROM airports WHERE city_id = c.city_id
          )
          GROUP BY TO_CHAR(f3.scheduled_departure, 'Month')
          ORDER BY COUNT(f3.flight_id) DESC
          LIMIT 1
        ) as busiest_month
      FROM cities c
      LEFT JOIN airports a ON c.city_id = a.city_id
      LEFT JOIN flights f ON a.airport_id = f.departure_airport_id
      ${whereClause}
      GROUP BY c.city_id, c.city_name, c.country
      ORDER BY total_flights DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Get cities with airports
   */
  async getCitiesWithAirports(): Promise<Array<CityResponseDto & { airport_count: number }>> {
    const result = await this.databaseService.query<CityResponseDto & { airport_count: number }>(
      `
      SELECT 
        c.*,
        COUNT(a.airport_id) as airport_count
      FROM cities c
      LEFT JOIN airports a ON c.city_id = a.city_id
      GROUP BY c.city_id
      HAVING COUNT(a.airport_id) > 0
      ORDER BY airport_count DESC, c.city_name
    `,
    );

    return result.rows;
  }
}
