import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateFlightCrewDto,
  UpdateFlightCrewDto,
  FlightCrewResponseDto,
  SearchFlightCrewDto,
  CrewStatisticsDto,
  CrewStatisticsResponseDto,
  CrewAvailabilityResponseDto,
} from './dto/flight-crew.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';
import { CrewPosition } from '../shared/enums';

@Injectable()
export class FlightCrewService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Assign crew member to flight
   */
  async create(createFlightCrewDto: CreateFlightCrewDto): Promise<FlightCrewResponseDto> {
    const { flight_id, user_id, position } = createFlightCrewDto;

    // Check if user exists
    const userCheck = await this.databaseService.query(
      'SELECT user_id, first_name, last_name, email FROM users WHERE user_id = $1',
      [user_id],
    );

    if (userCheck.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    // Check if flight exists
    const flightCheck = await this.databaseService.query(
      'SELECT flight_id, flight_number FROM flights WHERE flight_id = $1',
      [flight_id],
    );

    if (flightCheck.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    // Check if position is already assigned for this flight
    const positionCheck = await this.databaseService.query(
      'SELECT flight_crew_id FROM flight_crew WHERE flight_id = $1 AND position = $2',
      [flight_id, position],
    );

    if (positionCheck.rows.length > 0) {
      throw new ConflictException(`${position} position is already assigned for this flight`);
    }

    // Check if user is already assigned to this flight
    const userFlightCheck = await this.databaseService.query(
      'SELECT flight_crew_id FROM flight_crew WHERE flight_id = $1 AND user_id = $2',
      [flight_id, user_id],
    );

    if (userFlightCheck.rows.length > 0) {
      throw new ConflictException('User is already assigned to this flight');
    }

    // Check crew availability
    const availability = await this.checkCrewAvailability(user_id);
    if (!availability.is_available) {
      throw new BadRequestException('Crew member is not available for this flight');
    }

    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      INSERT INTO flight_crew (
        flight_id, user_id, position, notes, assigned_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `,
      [flight_id, user_id, position, createFlightCrewDto.notes],
    );

    return await this.findById(result.rows[0].flight_crew_id);
  }

  /**
   * Get all flight crew assignments with pagination and filtering
   */
  async findAll(searchDto: SearchFlightCrewDto): Promise<PaginatedResponse<FlightCrewResponseDto>> {
    const {
      page = 1,
      limit = 10,
      flight_id,
      user_id,
      position,
      flight_number,
      crew_name,
    } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (flight_id) {
      conditions.push(`fc.flight_id = $${paramIndex}`);
      params.push(flight_id);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`fc.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (position) {
      conditions.push(`fc.position = $${paramIndex}`);
      params.push(position);
      paramIndex++;
    }

    if (flight_number) {
      conditions.push(`f.flight_number ILIKE $${paramIndex}`);
      params.push(`%${flight_number}%`);
      paramIndex++;
    }

    if (crew_name) {
      conditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`);
      params.push(`%${crew_name}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      SELECT 
        fc.*,
        f.flight_number,
        u.first_name,
        u.last_name,
        u.email
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      ${whereClause}
      ORDER BY fc.assigned_at DESC
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
   * Get flight crew assignment by ID
   */
  async findById(flight_crew_id: number): Promise<FlightCrewResponseDto> {
    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      SELECT 
        fc.*,
        f.flight_number,
        u.first_name,
        u.last_name,
        u.email
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.flight_crew_id = $1
    `,
      [flight_crew_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Flight crew assignment not found');
    }

    return result.rows[0];
  }

  /**
   * Update flight crew assignment
   */
  async update(
    flight_crew_id: number,
    updateFlightCrewDto: UpdateFlightCrewDto,
  ): Promise<FlightCrewResponseDto> {
    const existingAssignment = await this.findById(flight_crew_id);

    // Check for conflicts if updating position
    if (
      updateFlightCrewDto.position &&
      updateFlightCrewDto.position !== existingAssignment.position
    ) {
      const conflictCheck = await this.databaseService.query(
        'SELECT flight_crew_id FROM flight_crew WHERE flight_id = $1 AND position = $2 AND flight_crew_id != $3',
        [existingAssignment.flight_id, updateFlightCrewDto.position, flight_crew_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException(
          `${updateFlightCrewDto.position} position is already assigned for this flight`,
        );
      }
    }

    // Check for conflicts if updating user
    if (updateFlightCrewDto.user_id && updateFlightCrewDto.user_id !== existingAssignment.user_id) {
      const userFlightCheck = await this.databaseService.query(
        'SELECT flight_crew_id FROM flight_crew WHERE flight_id = $1 AND user_id = $2 AND flight_crew_id != $3',
        [existingAssignment.flight_id, updateFlightCrewDto.user_id, flight_crew_id],
      );

      if (userFlightCheck.rows.length > 0) {
        throw new ConflictException('User is already assigned to this flight');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateFlightCrewDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingAssignment;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(flight_crew_id);

    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      UPDATE flight_crew 
      SET ${updateFields.join(', ')}
      WHERE flight_crew_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].flight_crew_id);
  }

  /**
   * Remove crew member from flight
   */
  async remove(flight_crew_id: number): Promise<void> {
    const existingAssignment = await this.findById(flight_crew_id);

    // Check if flight is already departed
    const flightCheck = await this.databaseService.query(
      'SELECT status, scheduled_departure FROM flights WHERE flight_id = $1',
      [existingAssignment.flight_id],
    );

    if (flightCheck.rows.length > 0) {
      const flight = flightCheck.rows[0] as { status: string };
      if (flight.status === 'departed' || flight.status === 'arrived') {
        throw new BadRequestException('Cannot remove crew from completed or departed flight');
      }
    }

    await this.databaseService.query('DELETE FROM flight_crew WHERE flight_crew_id = $1', [
      flight_crew_id,
    ]);
  }

  /**
   * Get crew for a specific flight
   */
  async getCrewForFlight(flight_id: number): Promise<FlightCrewResponseDto[]> {
    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      SELECT 
        fc.*,
        f.flight_number,
        u.first_name,
        u.last_name,
        u.email
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.flight_id = $1
      ORDER BY 
        CASE fc.position
          WHEN 'pilot' THEN 1
          WHEN 'co_pilot' THEN 2
          WHEN 'flight_engineer' THEN 3
          WHEN 'purser' THEN 4
          WHEN 'flight_attendant' THEN 5
          ELSE 6
        END
    `,
      [flight_id],
    );

    return result.rows;
  }

  /**
   * Get crew assignments for a specific user
   */
  async getCrewAssignmentsForUser(user_id: number): Promise<FlightCrewResponseDto[]> {
    const result = await this.databaseService.query<FlightCrewResponseDto>(
      `
      SELECT 
        fc.*,
        f.flight_number,
        u.first_name,
        u.last_name,
        u.email
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.user_id = $1
      ORDER BY f.scheduled_departure DESC
    `,
      [user_id],
    );

    return result.rows;
  }

  /**
   * Check crew availability
   */
  async checkCrewAvailability(user_id: number): Promise<CrewAvailabilityResponseDto> {
    // Get user details
    const userResult = await this.databaseService.query(
      'SELECT first_name, last_name FROM users WHERE user_id = $1',
      [user_id],
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = userResult.rows[0] as { first_name: string; last_name: string };

    // Get current flight assignments
    const currentFlightsResult = await this.databaseService.query(
      `
      SELECT 
        f.flight_id,
        f.flight_number,
        f.scheduled_departure,
        f.scheduled_arrival,
        f.status,
        fc.position
      FROM flight_crew fc
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.user_id = $1
      AND f.status IN ('scheduled', 'boarding', 'departed')
      AND f.scheduled_departure >= CURRENT_TIMESTAMP - INTERVAL '2 hours'
      ORDER BY f.scheduled_departure
    `,
      [user_id],
    );

    const currentFlights = currentFlightsResult.rows as Array<{
      flight_id: number;
      flight_number: string;
      scheduled_departure: Date;
      scheduled_arrival: Date;
      status: string;
      position: CrewPosition;
    }>;
    const isAvailable = currentFlights.length === 0;

    // Calculate total flight hours in the last 24 hours
    const hoursResult = await this.databaseService.query(
      `
      SELECT 
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600
        ), 0) as total_hours
      FROM flight_crew fc
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.user_id = $1
      AND f.scheduled_departure >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND f.status IN ('departed', 'arrived')
    `,
      [user_id],
    );

    const totalFlightHours = parseFloat(
      (hoursResult.rows[0] as { total_hours: string }).total_hours || '0',
    );
    const restHoursRequired = Math.max(0, 12 - totalFlightHours); // 12 hours rest required

    // Calculate next available time
    let nextAvailable = new Date();
    if (currentFlights.length > 0) {
      const lastFlight = currentFlights[currentFlights.length - 1];
      nextAvailable = new Date(lastFlight.scheduled_arrival);
      nextAvailable.setHours(nextAvailable.getHours() + 12); // Add 12 hours rest
    }

    return {
      user_id,
      name: `${user.first_name} ${user.last_name}`,
      position: currentFlights[0]?.position || CrewPosition.FLIGHT_ATTENDANT,
      is_available: isAvailable,
      current_flight:
        currentFlights.length > 0
          ? {
              flight_id: currentFlights[0].flight_id,
              flight_number: currentFlights[0].flight_number,
              scheduled_departure: currentFlights[0].scheduled_departure,
              scheduled_arrival: currentFlights[0].scheduled_arrival,
            }
          : undefined,
      next_available: nextAvailable,
      total_flight_hours: totalFlightHours,
      rest_hours_required: restHoursRequired,
    };
  }

  /**
   * Get crew statistics
   */
  async getStatistics(statisticsDto: CrewStatisticsDto): Promise<CrewStatisticsResponseDto> {
    const { user_id, position, flight_id } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (user_id) {
      conditions.push(`fc.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (position) {
      conditions.push(`fc.position = $${paramIndex}`);
      params.push(position);
      paramIndex++;
    }

    if (flight_id) {
      conditions.push(`fc.flight_id = $${paramIndex}`);
      params.push(flight_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(DISTINCT fc.user_id) as total_crew_members,
        COUNT(fc.flight_crew_id) as total_flights_served,
        COUNT(fc.flight_crew_id)::float / COUNT(DISTINCT fc.user_id)::float as average_flights_per_crew
      FROM flight_crew fc
      ${whereClause}
    `,
      params,
    );

    const stats = statsResult.rows[0] as {
      total_crew_members: string;
      total_flights_served: string;
      average_flights_per_crew: string;
    };

    // Get crew by position
    const positionResult = await this.databaseService.query(
      `
      SELECT 
        fc.position,
        COUNT(*) as count
      FROM flight_crew fc
      ${whereClause}
      GROUP BY fc.position
    `,
      params,
    );

    const crewByPosition: Record<CrewPosition, number> = {
      [CrewPosition.PILOT]: 0,
      [CrewPosition.CO_PILOT]: 0,
      [CrewPosition.FLIGHT_ENGINEER]: 0,
      [CrewPosition.FLIGHT_ATTENDANT]: 0,
      [CrewPosition.PURSER]: 0,
    };

    positionResult.rows.forEach((row: { position: CrewPosition; count: string }) => {
      crewByPosition[row.position] = parseInt(row.count);
    });

    // Get most active crew
    const activeCrewResult = await this.databaseService.query(
      `
      SELECT 
        fc.user_id,
        u.first_name || ' ' || u.last_name as name,
        fc.position,
        COUNT(fc.flight_crew_id) as flight_count
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      ${whereClause}
      GROUP BY fc.user_id, u.first_name, u.last_name, fc.position
      ORDER BY flight_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get crew efficiency
    const efficiencyResult = await this.databaseService.query(
      `
      SELECT 
        fc.user_id,
        u.first_name || ' ' || u.last_name as name,
        fc.position,
        COUNT(fc.flight_crew_id) as total_flights,
        COUNT(CASE WHEN f.status = 'arrived' AND f.actual_arrival <= f.scheduled_arrival + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
        ROUND(
          (COUNT(CASE WHEN f.status = 'arrived' AND f.actual_arrival <= f.scheduled_arrival + INTERVAL '15 minutes' THEN 1 END)::float / 
          COUNT(CASE WHEN f.status = 'arrived' THEN 1 END)::float) * 100, 2
        ) as on_time_performance
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      ${whereClause}
      GROUP BY fc.user_id, u.first_name, u.last_name, fc.position
      HAVING COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) > 0
      ORDER BY on_time_performance DESC
      LIMIT 10
    `,
      params,
    );

    const crewEfficiency = efficiencyResult.rows.map(
      (row: {
        user_id: number;
        name: string;
        position: CrewPosition;
        on_time_performance: string;
      }) => ({
        user_id: row.user_id,
        name: row.name,
        position: row.position,
        efficiency_score: parseFloat(row.on_time_performance || '0'),
        on_time_performance: parseFloat(row.on_time_performance || '0'),
      }),
    );

    return {
      period: 'all_time',
      total_crew_members: parseInt(stats.total_crew_members),
      total_flights_served: parseInt(stats.total_flights_served),
      average_flights_per_crew: parseFloat(stats.average_flights_per_crew || '0'),
      crew_by_position: crewByPosition,
      most_active_crew: activeCrewResult.rows.map(
        (row: { user_id: number; name: string; position: CrewPosition; flight_count: string }) => ({
          user_id: row.user_id,
          name: row.name,
          position: row.position,
          flight_count: parseInt(row.flight_count),
        }),
      ),
      crew_efficiency: crewEfficiency,
    };
  }
}
