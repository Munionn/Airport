import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteResponseDto,
  SearchRoutesDto,
  RouteStatisticsDto,
  RouteStatisticsResponseDto,
  PopularRoutesDto,
  PopularRoutesResponseDto,
} from './dto/route.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new route
   */
  async create(createRouteDto: CreateRouteDto): Promise<RouteResponseDto> {
    const { departure_airport_id, arrival_airport_id } = createRouteDto;

    // Check if route already exists
    const existingRoute = await this.databaseService.query(
      `
      SELECT route_id FROM routes 
      WHERE departure_airport_id = $1 AND arrival_airport_id = $2
    `,
      [departure_airport_id, arrival_airport_id],
    );

    if (existingRoute.rows.length > 0) {
      throw new ConflictException('Route between these airports already exists');
    }

    // Verify airports exist
    const airportCheck = await this.databaseService.query(
      `
      SELECT COUNT(*) as count FROM airports 
      WHERE airport_id IN ($1, $2)
    `,
      [departure_airport_id, arrival_airport_id],
    );

    if (parseInt((airportCheck.rows[0] as { count: string }).count) !== 2) {
      throw new NotFoundException('One or both airports not found');
    }

    // Prevent self-routes
    if (departure_airport_id === arrival_airport_id) {
      throw new ConflictException('Cannot create route from airport to itself');
    }

    const result = await this.databaseService.query<RouteResponseDto>(
      `
      INSERT INTO routes (
        route_name, departure_airport_id, arrival_airport_id, distance,
        duration, status, base_price, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        createRouteDto.route_name,
        departure_airport_id,
        arrival_airport_id,
        createRouteDto.distance,
        createRouteDto.duration,
        createRouteDto.status,
        createRouteDto.base_price,
        createRouteDto.description,
      ],
    );

    return await this.findById(result.rows[0].route_id);
  }

  /**
   * Get all routes with pagination and filtering
   */
  async findAll(searchDto: SearchRoutesDto): Promise<PaginatedResponse<RouteResponseDto>> {
    const {
      page = 1,
      limit = 10,
      route_name,
      departure_airport,
      arrival_airport,
      departure_airport_id,
      arrival_airport_id,
      status,
      min_distance,
      max_distance,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (route_name) {
      conditions.push(`r.route_name ILIKE $${paramIndex}`);
      params.push(`%${route_name}%`);
      paramIndex++;
    }

    if (departure_airport) {
      conditions.push(`dep_airport.iata_code ILIKE $${paramIndex}`);
      params.push(`%${departure_airport}%`);
      paramIndex++;
    }

    if (arrival_airport) {
      conditions.push(`arr_airport.iata_code ILIKE $${paramIndex}`);
      params.push(`%${arrival_airport}%`);
      paramIndex++;
    }

    if (departure_airport_id) {
      conditions.push(`r.departure_airport_id = $${paramIndex}`);
      params.push(departure_airport_id);
      paramIndex++;
    }

    if (arrival_airport_id) {
      conditions.push(`r.arrival_airport_id = $${paramIndex}`);
      params.push(arrival_airport_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (min_distance) {
      conditions.push(`r.distance >= $${paramIndex}`);
      params.push(min_distance);
      paramIndex++;
    }

    if (max_distance) {
      conditions.push(`r.distance <= $${paramIndex}`);
      params.push(max_distance);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<RouteResponseDto>(
      `
      SELECT 
        r.*,
        json_build_object(
          'airport_id', dep_airport.airport_id,
          'iata_code', dep_airport.iata_code,
          'airport_name', dep_airport.airport_name,
          'city_name', dep_city.city_name,
          'country', dep_city.country
        ) as departure_airport,
        json_build_object(
          'airport_id', arr_airport.airport_id,
          'iata_code', arr_airport.iata_code,
          'airport_name', arr_airport.airport_name,
          'city_name', arr_city.city_name,
          'country', arr_city.country
        ) as arrival_airport
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      ${whereClause}
      ORDER BY r.route_name
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
   * Get route by ID
   */
  async findById(route_id: number): Promise<RouteResponseDto> {
    const result = await this.databaseService.query<RouteResponseDto>(
      `
      SELECT 
        r.*,
        json_build_object(
          'airport_id', dep_airport.airport_id,
          'iata_code', dep_airport.iata_code,
          'airport_name', dep_airport.airport_name,
          'city_name', dep_city.city_name,
          'country', dep_city.country
        ) as departure_airport,
        json_build_object(
          'airport_id', arr_airport.airport_id,
          'iata_code', arr_airport.iata_code,
          'airport_name', arr_airport.airport_name,
          'city_name', arr_city.city_name,
          'country', arr_city.country
        ) as arrival_airport
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      WHERE r.route_id = $1
    `,
      [route_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Route not found');
    }

    return result.rows[0];
  }

  /**
   * Update route
   */
  async update(route_id: number, updateRouteDto: UpdateRouteDto): Promise<RouteResponseDto> {
    const existingRoute = await this.findById(route_id);

    // Check for conflicts if updating airports
    if (updateRouteDto.departure_airport_id || updateRouteDto.arrival_airport_id) {
      const newDeparture = updateRouteDto.departure_airport_id || existingRoute.departure_airport_id;
      const newArrival = updateRouteDto.arrival_airport_id || existingRoute.arrival_airport_id;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT route_id FROM routes 
        WHERE departure_airport_id = $1 AND arrival_airport_id = $2 AND route_id != $3
      `,
        [newDeparture, newArrival, route_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Route between these airports already exists');
      }

      // Prevent self-routes
      if (newDeparture === newArrival) {
        throw new ConflictException('Cannot create route from airport to itself');
      }
    }

    // Verify airports exist if updating
    if (updateRouteDto.departure_airport_id || updateRouteDto.arrival_airport_id) {
      const departureId = updateRouteDto.departure_airport_id || existingRoute.departure_airport_id;
      const arrivalId = updateRouteDto.arrival_airport_id || existingRoute.arrival_airport_id;

      const airportCheck = await this.databaseService.query(
        `
        SELECT COUNT(*) as count FROM airports 
        WHERE airport_id IN ($1, $2)
      `,
        [departureId, arrivalId],
      );

      if (parseInt((airportCheck.rows[0] as { count: string }).count) !== 2) {
        throw new NotFoundException('One or both airports not found');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateRouteDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingRoute;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(route_id);

    const result = await this.databaseService.query<RouteResponseDto>(
      `
      UPDATE routes 
      SET ${updateFields.join(', ')}
      WHERE route_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].route_id);
  }

  /**
   * Delete route
   */
  async remove(route_id: number): Promise<void> {
    const existingRoute = await this.findById(route_id);

    // Check if route is used in flights
    const flightCheck = await this.databaseService.query(
      'SELECT COUNT(*) as count FROM flights WHERE route_id = $1',
      [route_id],
    );

    if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete route that is used in flights');
    }

    await this.databaseService.query('DELETE FROM routes WHERE route_id = $1', [route_id]);
  }

  /**
   * Get route statistics
   */
  async getStatistics(statisticsDto: RouteStatisticsDto): Promise<RouteStatisticsResponseDto[]> {
    const { departure_country, arrival_country, status } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (departure_country) {
      conditions.push(`dep_city.country = $${paramIndex}`);
      params.push(departure_country);
      paramIndex++;
    }

    if (arrival_country) {
      conditions.push(`arr_city.country = $${paramIndex}`);
      params.push(arrival_country);
      paramIndex++;
    }

    if (status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<RouteStatisticsResponseDto>(
      `
      SELECT 
        r.route_id,
        r.route_name,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        COUNT(f.flight_id) as total_flights,
        COALESCE(SUM(
          (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
        ), 0) as total_passengers,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND(
            (COALESCE(SUM(
              (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
            ), 0)::float / 
            (COUNT(f.flight_id) * 150)::float) * 100, 2
          )
          ELSE 0 
        END as average_load_factor,
        COALESCE(AVG(t.price), 0) as average_price,
        COALESCE(SUM(t.price), 0) as total_revenue,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND(
            (COUNT(CASE WHEN f.status = 'completed' AND f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END)::float / 
            COUNT(CASE WHEN f.status = 'completed' THEN 1 END)::float) * 100, 2
          )
          ELSE 0 
        END as on_time_performance,
        (
          SELECT TO_CHAR(f2.scheduled_departure, 'Month')
          FROM flights f2
          WHERE f2.route_id = r.route_id
          GROUP BY TO_CHAR(f2.scheduled_departure, 'Month')
          ORDER BY COUNT(f2.flight_id) DESC
          LIMIT 1
        ) as most_popular_month,
        (
          SELECT TO_CHAR(f3.scheduled_departure, 'Day')
          FROM flights f3
          WHERE f3.route_id = r.route_id
          GROUP BY TO_CHAR(f3.scheduled_departure, 'Day')
          ORDER BY COUNT(f3.flight_id) DESC
          LIMIT 1
        ) as busiest_day_of_week
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      LEFT JOIN flights f ON r.route_id = f.route_id
      LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
      ${whereClause}
      GROUP BY r.route_id, r.route_name, dep_airport.iata_code, arr_airport.iata_code
      ORDER BY total_flights DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Get popular routes
   */
  async getPopularRoutes(popularDto: PopularRoutesDto): Promise<PopularRoutesResponseDto[]> {
    const { limit = 10, departure_country, arrival_country } = popularDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (departure_country) {
      conditions.push(`dep_city.country = $${paramIndex}`);
      params.push(departure_country);
      paramIndex++;
    }

    if (arrival_country) {
      conditions.push(`arr_city.country = $${paramIndex}`);
      params.push(arrival_country);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<PopularRoutesResponseDto>(
      `
      SELECT 
        r.route_id,
        r.route_name,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        COUNT(f.flight_id) as flight_count,
        COALESCE(SUM(
          (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
        ), 0) as passenger_count,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND(
            (COALESCE(SUM(
              (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
            ), 0)::float / 
            (COUNT(f.flight_id) * 150)::float) * 100, 2
          )
          ELSE 0 
        END as average_load_factor,
        COALESCE(SUM(t.price), 0) as total_revenue,
        ROUND(
          (COUNT(f.flight_id) * 0.4 + 
           COALESCE(SUM(
             (SELECT COUNT(*) FROM tickets t WHERE t.flight_id = f.flight_id AND t.status = 'active')
           ), 0) * 0.6)::float, 2
        ) as popularity_score
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      LEFT JOIN flights f ON r.route_id = f.route_id
      LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
      ${whereClause}
      GROUP BY r.route_id, r.route_name, dep_airport.iata_code, arr_airport.iata_code
      ORDER BY popularity_score DESC, flight_count DESC
      LIMIT $${paramIndex}
    `,
      [...params, limit],
    );

    return result.rows;
  }

  /**
   * Get routes by departure airport
   */
  async findByDepartureAirport(airport_id: number): Promise<RouteResponseDto[]> {
    const result = await this.databaseService.query<RouteResponseDto>(
      `
      SELECT 
        r.*,
        json_build_object(
          'airport_id', dep_airport.airport_id,
          'iata_code', dep_airport.iata_code,
          'airport_name', dep_airport.airport_name,
          'city_name', dep_city.city_name,
          'country', dep_city.country
        ) as departure_airport,
        json_build_object(
          'airport_id', arr_airport.airport_id,
          'iata_code', arr_airport.iata_code,
          'airport_name', arr_airport.airport_name,
          'city_name', arr_city.city_name,
          'country', arr_city.country
        ) as arrival_airport
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      WHERE r.departure_airport_id = $1 
      ORDER BY r.route_name
    `,
      [airport_id],
    );

    return result.rows;
  }

  /**
   * Get routes by arrival airport
   */
  async findByArrivalAirport(airport_id: number): Promise<RouteResponseDto[]> {
    const result = await this.databaseService.query<RouteResponseDto>(
      `
      SELECT 
        r.*,
        json_build_object(
          'airport_id', dep_airport.airport_id,
          'iata_code', dep_airport.iata_code,
          'airport_name', dep_airport.airport_name,
          'city_name', dep_city.city_name,
          'country', dep_city.country
        ) as departure_airport,
        json_build_object(
          'airport_id', arr_airport.airport_id,
          'iata_code', arr_airport.iata_code,
          'airport_name', arr_airport.airport_name,
          'city_name', arr_city.city_name,
          'country', arr_city.country
        ) as arrival_airport
      FROM routes r
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      WHERE r.arrival_airport_id = $1 
      ORDER BY r.route_name
    `,
      [airport_id],
    );

    return result.rows;
  }
}
