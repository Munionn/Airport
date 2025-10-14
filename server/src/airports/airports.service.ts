import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateAirportDto,
  UpdateAirportDto,
  AirportResponseDto,
  SearchAirportsDto,
  AirportStatisticsDto,
  AirportStatisticsResponseDto,
  AirportDistanceDto,
  AirportDistanceResponseDto,
} from './dto/airport.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class AirportsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new airport
   */
  async create(createAirportDto: CreateAirportDto): Promise<AirportResponseDto> {
    const { iata_code, icao_code } = createAirportDto;

    // Check if IATA or ICAO code already exists
    const existingAirport = await this.databaseService.query(
      `
      SELECT airport_id FROM airports 
      WHERE iata_code = $1 OR icao_code = $2
    `,
      [iata_code, icao_code],
    );

    if (existingAirport.rows.length > 0) {
      throw new ConflictException('Airport with this IATA or ICAO code already exists');
    }

    // Verify city exists
    const cityCheck = await this.databaseService.query(
      'SELECT city_id FROM cities WHERE city_id = $1',
      [createAirportDto.city_id],
    );

    if (cityCheck.rows.length === 0) {
      throw new NotFoundException('City not found');
    }

    const result = await this.databaseService.query<AirportResponseDto>(
      `
      INSERT INTO airports (
        iata_code, icao_code, airport_name, city_id, latitude, longitude,
        address, phone, website, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        iata_code,
        icao_code,
        createAirportDto.airport_name,
        createAirportDto.city_id,
        createAirportDto.latitude,
        createAirportDto.longitude,
        createAirportDto.address,
        createAirportDto.phone,
        createAirportDto.website,
        createAirportDto.status,
      ],
    );

    return await this.findById(result.rows[0].airport_id);
  }

  /**
   * Get all airports with pagination and filtering
   */
  async findAll(searchDto: SearchAirportsDto): Promise<PaginatedResponse<AirportResponseDto>> {
    const {
      page = 1,
      limit = 10,
      iata_code,
      icao_code,
      airport_name,
      city_name,
      country,
      city_id,
      status,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (iata_code) {
      conditions.push(`a.iata_code ILIKE $${paramIndex}`);
      params.push(`%${iata_code}%`);
      paramIndex++;
    }

    if (icao_code) {
      conditions.push(`a.icao_code ILIKE $${paramIndex}`);
      params.push(`%${icao_code}%`);
      paramIndex++;
    }

    if (airport_name) {
      conditions.push(`a.airport_name ILIKE $${paramIndex}`);
      params.push(`%${airport_name}%`);
      paramIndex++;
    }

    if (city_name) {
      conditions.push(`c.city_name ILIKE $${paramIndex}`);
      params.push(`%${city_name}%`);
      paramIndex++;
    }

    if (country) {
      conditions.push(`c.country ILIKE $${paramIndex}`);
      params.push(`%${country}%`);
      paramIndex++;
    }

    if (city_id) {
      conditions.push(`a.city_id = $${paramIndex}`);
      params.push(city_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<AirportResponseDto>(
      `
      SELECT 
        a.*,
        c.city_name,
        c.country
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      ${whereClause}
      ORDER BY a.iata_code
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
   * Get airport by ID
   */
  async findById(airport_id: number): Promise<AirportResponseDto> {
    const result = await this.databaseService.query<AirportResponseDto>(
      `
      SELECT 
        a.*,
        c.city_name,
        c.country
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      WHERE a.airport_id = $1
    `,
      [airport_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Airport not found');
    }

    return result.rows[0];
  }

  /**
   * Get airport by IATA code
   */
  async findByIataCode(iata_code: string): Promise<AirportResponseDto> {
    const result = await this.databaseService.query<AirportResponseDto>(
      `
      SELECT 
        a.*,
        c.city_name,
        c.country
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      WHERE a.iata_code = $1
    `,
      [iata_code],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Airport not found');
    }

    return result.rows[0];
  }

  /**
   * Update airport
   */
  async update(airport_id: number, updateAirportDto: UpdateAirportDto): Promise<AirportResponseDto> {
    const existingAirport = await this.findById(airport_id);

    // Check for conflicts if updating codes
    if (updateAirportDto.iata_code || updateAirportDto.icao_code) {
      const newIata = updateAirportDto.iata_code || existingAirport.iata_code;
      const newIcao = updateAirportDto.icao_code || existingAirport.icao_code;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT airport_id FROM airports 
        WHERE (iata_code = $1 OR icao_code = $2) AND airport_id != $3
      `,
        [newIata, newIcao, airport_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Airport with this IATA or ICAO code already exists');
      }
    }

    // Verify city exists if updating
    if (updateAirportDto.city_id) {
      const cityCheck = await this.databaseService.query(
        'SELECT city_id FROM cities WHERE city_id = $1',
        [updateAirportDto.city_id],
      );

      if (cityCheck.rows.length === 0) {
        throw new NotFoundException('City not found');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateAirportDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingAirport;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(airport_id);

    const result = await this.databaseService.query<AirportResponseDto>(
      `
      UPDATE airports 
      SET ${updateFields.join(', ')}
      WHERE airport_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].airport_id);
  }

  /**
   * Delete airport
   */
  async remove(airport_id: number): Promise<void> {
    const existingAirport = await this.findById(airport_id);

    // Check if airport is used in routes
    const routeCheck = await this.databaseService.query(
      `
      SELECT COUNT(*) as count FROM routes 
      WHERE departure_airport_id = $1 OR arrival_airport_id = $1
    `,
      [airport_id],
    );

    if (parseInt((routeCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete airport that is used in routes');
    }

    // Check if airport is used in flights
    const flightCheck = await this.databaseService.query(
      `
      SELECT COUNT(*) as count FROM flights 
      WHERE departure_airport_id = $1 OR arrival_airport_id = $1
    `,
      [airport_id],
    );

    if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete airport that is used in flights');
    }

    await this.databaseService.query('DELETE FROM airports WHERE airport_id = $1', [airport_id]);
  }

  /**
   * Get airport statistics
   */
  async getStatistics(statisticsDto: AirportStatisticsDto): Promise<AirportStatisticsResponseDto[]> {
    const { country, city_name, status } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (country) {
      conditions.push(`c.country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (city_name) {
      conditions.push(`c.city_name = $${paramIndex}`);
      params.push(city_name);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<AirportStatisticsResponseDto>(
      `
      SELECT 
        a.airport_id,
        a.iata_code,
        a.airport_name,
        c.city_name,
        c.country,
        COUNT(f.flight_id) as total_flights,
        COALESCE(SUM(
          (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
        ), 0) as total_passengers,
        COUNT(CASE WHEN f.departure_airport_id = a.airport_id THEN f.flight_id END) as total_departures,
        COUNT(CASE WHEN f.arrival_airport_id = a.airport_id THEN f.flight_id END) as total_arrivals,
        ROUND(COUNT(f.flight_id)::float / GREATEST(EXTRACT(DAYS FROM AGE(CURRENT_DATE, a.created_at)), 1), 2) as average_daily_flights,
        (
          SELECT EXTRACT(HOUR FROM f2.scheduled_departure)
          FROM flights f2
          WHERE f2.departure_airport_id = a.airport_id
          GROUP BY EXTRACT(HOUR FROM f2.scheduled_departure)
          ORDER BY COUNT(f2.flight_id) DESC
          LIMIT 1
        ) as busiest_hour,
        (
          SELECT arr_airport.iata_code
          FROM flights f3
          JOIN airports arr_airport ON f3.arrival_airport_id = arr_airport.airport_id
          WHERE f3.departure_airport_id = a.airport_id
          GROUP BY arr_airport.airport_id, arr_airport.iata_code
          ORDER BY COUNT(f3.flight_id) DESC
          LIMIT 1
        ) as most_popular_destination,
        COUNT(DISTINCT t.terminal_id) as terminal_count,
        COUNT(DISTINCT g.gate_id) as gate_count
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      LEFT JOIN flights f ON (a.airport_id = f.departure_airport_id OR a.airport_id = f.arrival_airport_id)
      LEFT JOIN terminals t ON a.airport_id = t.airport_id
      LEFT JOIN gates g ON t.terminal_id = g.terminal_id
      ${whereClause}
      GROUP BY a.airport_id, a.iata_code, a.airport_name, c.city_name, c.country, a.created_at
      ORDER BY total_flights DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Calculate distance between two airports
   */
  async calculateDistance(distanceDto: AirportDistanceDto): Promise<AirportDistanceResponseDto> {
    const { from_airport_id, to_airport_id } = distanceDto;

    const result = await this.databaseService.query<AirportDistanceResponseDto>(
      `
      SELECT 
        json_build_object(
          'airport_id', a1.airport_id,
          'iata_code', a1.iata_code,
          'airport_name', a1.airport_name,
          'latitude', a1.latitude,
          'longitude', a1.longitude
        ) as from_airport,
        json_build_object(
          'airport_id', a2.airport_id,
          'iata_code', a2.iata_code,
          'airport_name', a2.airport_name,
          'latitude', a2.latitude,
          'longitude', a2.longitude
        ) as to_airport,
        ROUND(
          6371 * acos(
            cos(radians(a1.latitude)) * cos(radians(a2.latitude)) * 
            cos(radians(a2.longitude) - radians(a1.longitude)) + 
            sin(radians(a1.latitude)) * sin(radians(a2.latitude))
          ), 2
        ) as distance_km,
        ROUND(
          6371 * acos(
            cos(radians(a1.latitude)) * cos(radians(a2.latitude)) * 
            cos(radians(a2.longitude) - radians(a1.longitude)) + 
            sin(radians(a1.latitude)) * sin(radians(a2.latitude))
          ) / 800 * 60, 0
        ) as estimated_flight_time_minutes
      FROM airports a1, airports a2
      WHERE a1.airport_id = $1 AND a2.airport_id = $2
    `,
      [from_airport_id, to_airport_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('One or both airports not found');
    }

    return result.rows[0];
  }

  /**
   * Get airports by country
   */
  async findByCountry(country: string): Promise<AirportResponseDto[]> {
    const result = await this.databaseService.query<AirportResponseDto>(
      `
      SELECT 
        a.*,
        c.city_name,
        c.country
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      WHERE c.country ILIKE $1 
      ORDER BY a.iata_code
    `,
      [`%${country}%`],
    );

    return result.rows;
  }

  /**
   * Get airports by city
   */
  async findByCity(city_id: number): Promise<AirportResponseDto[]> {
    const result = await this.databaseService.query<AirportResponseDto>(
      `
      SELECT 
        a.*,
        c.city_name,
        c.country
      FROM airports a
      JOIN cities c ON a.city_id = c.city_id
      WHERE a.city_id = $1 
      ORDER BY a.iata_code
    `,
      [city_id],
    );

    return result.rows;
  }
}
