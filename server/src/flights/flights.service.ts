import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FlightEntity } from './entities/flight.entity';
import {
  CreateFlightDto,
  UpdateFlightDto,
  SearchFlightDto,
  FlightStatisticsDto,
  AssignGateDto,
  UpdateFlightStatusDto,
  FlightDelayDto,
  FlightCancellationDto,
  FlightSearchCriteriaDto,
  FlightResponseDto,
  FlightStatisticsResponseDto,
} from './dto/flight.dto';
import { FlightStatus } from '../shared/enums';
import { PaginatedResponse } from '../shared/dto/base.dto';

// Define interfaces for type safety
interface TopRoute {
  route_id: number;
  departure_airport: string;
  arrival_airport: string;
  flight_count: number;
}

interface FlightStats {
  period: string;
  total_flights: string;
  completed_flights: string;
  cancellations: string;
  delays: string;
  average_delay_minutes: string;
  total_revenue: string;
  average_load_factor: string;
  on_time_flights: string;
}

@Injectable()
export class FlightsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all flights
   */
  async findAll(): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights ORDER BY scheduled_departure DESC',
    );
    return result.rows;
  }

  /**
   * Get flight by ID
   */
  async findById(flight_id: number): Promise<FlightEntity | null> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE flight_id = $1',
      [flight_id],
    );
    return result.rows[0] || null;
  }

  /**
   * Get flight by flight number
   */
  async findByFlightNumber(flight_number: string): Promise<FlightEntity | null> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE flight_number = $1',
      [flight_number],
    );
    return result.rows[0] || null;
  }

  /**
   * Get flights by aircraft
   */
  async findByAircraft(aircraft_id: number): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE aircraft_id = $1 ORDER BY scheduled_departure DESC',
      [aircraft_id],
    );
    return result.rows;
  }

  /**
   * Get flights by route
   */
  async findByRoute(route_id: number): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE route_id = $1 ORDER BY scheduled_departure DESC',
      [route_id],
    );
    return result.rows;
  }

  /**
   * Get flights by airports
   */
  async findByAirports(
    departure_airport_id: number,
    arrival_airport_id: number,
  ): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE departure_airport_id = $1 AND arrival_airport_id = $2 ORDER BY scheduled_departure DESC',
      [departure_airport_id, arrival_airport_id],
    );
    return result.rows;
  }

  /**
   * Get flights by status
   */
  async findByStatus(status: string): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE status = $1 ORDER BY scheduled_departure DESC',
      [status],
    );
    return result.rows;
  }

  /**
   * Get flights in date range
   */
  async findByDateRange(start_date: Date, end_date: Date): Promise<FlightEntity[]> {
    const result = await this.databaseService.query<FlightEntity>(
      'SELECT * FROM flights WHERE scheduled_departure BETWEEN $1 AND $2 ORDER BY scheduled_departure',
      [start_date, end_date],
    );
    return result.rows;
  }

  /**
   * Create a new flight
   */
  async createFlight(createFlightDto: CreateFlightDto): Promise<FlightEntity> {
    const {
      flight_number,
      aircraft_id,
      route_id,
      gate_id,
      scheduled_departure,
      scheduled_arrival,
      price,
    } = createFlightDto;

    const result = await this.databaseService.query<FlightEntity>(
      `INSERT INTO flights (
        flight_number, aircraft_id, route_id, gate_id,
        scheduled_departure, scheduled_arrival, price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        flight_number,
        aircraft_id,
        route_id,
        gate_id,
        scheduled_departure,
        scheduled_arrival,
        price,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update flight
   */
  async updateFlight(
    flight_id: number,
    updateFlightDto: UpdateFlightDto,
  ): Promise<FlightEntity | null> {
    const fields = Object.keys(updateFlightDto).filter(
      key => updateFlightDto[key as keyof UpdateFlightDto] !== undefined,
    );

    if (fields.length === 0) {
      return this.findById(flight_id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const values = fields.map(field => updateFlightDto[field as keyof UpdateFlightDto]);

    const result = await this.databaseService.query<FlightEntity>(
      `UPDATE flights SET ${setClause} WHERE flight_id = $1 RETURNING *`,
      [flight_id, ...values],
    );
    return result.rows[0] || null;
  }

  /**
   * Update actual departure and arrival times
   */
  async updateActualTimes(
    flight_id: number,
    actual_departure: Date,
    actual_arrival: Date,
  ): Promise<FlightEntity | null> {
    const result = await this.databaseService.query<FlightEntity>(
      'UPDATE flights SET actual_departure = $1, actual_arrival = $2 WHERE flight_id = $3 RETURNING *',
      [actual_departure, actual_arrival, flight_id],
    );
    return result.rows[0] || null;
  }

  /**
   * Delete flight
   */
  async deleteFlight(flight_id: number): Promise<boolean> {
    const result = await this.databaseService.query('DELETE FROM flights WHERE flight_id = $1', [
      flight_id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Search flights using the database function
   */
  async searchFlights(
    departure_iata: string,
    arrival_iata: string,
    departure_date: Date,
  ): Promise<any[]> {
    const result = await this.databaseService.query('SELECT * FROM search_flights($1, $2, $3)', [
      departure_iata,
      arrival_iata,
      departure_date,
    ]);
    return result.rows;
  }

  /**
   * Check seat availability using database function
   */
  async checkSeatAvailability(flight_id: number, seat_number: string): Promise<boolean> {
    const result = await this.databaseService.query<{ check_seat_availability: boolean }>(
      'SELECT check_seat_availability($1, $2)',
      [flight_id, seat_number],
    );
    return result.rows[0].check_seat_availability;
  }

  /**
   * Calculate flight load percentage using database function
   */
  async calculateFlightLoad(flight_id: number): Promise<number> {
    const result = await this.databaseService.query<{ calculate_flight_load: number }>(
      'SELECT calculate_flight_load($1)',
      [flight_id],
    );
    return result.rows[0].calculate_flight_load;
  }

  /**
   * Get passenger ticket information for a flight
   */
  async getPassengerTicketInfo(flight_id: number): Promise<any[]> {
    const result = await this.databaseService.query(
      'SELECT * FROM passenger_ticket_info WHERE flight_id = $1',
      [flight_id],
    );
    return result.rows;
  }

  /**
   * Get flight crew
   */
  async getFlightCrew(flight_id: number): Promise<any[]> {
    const result = await this.databaseService.query(
      `SELECT fc.*, u.first_name, u.last_name, u.email
       FROM flight_crew fc
       JOIN users u ON fc.user_id = u.user_id
       WHERE fc.flight_id = $1`,
      [flight_id],
    );
    return result.rows;
  }

  /**
   * Get flight baggage
   */
  async getFlightBaggage(flight_id: number): Promise<any[]> {
    const result = await this.databaseService.query(
      `SELECT b.*, p.first_name, p.last_name
       FROM baggage b
       JOIN passengers p ON b.passenger_id = p.passenger_id
       WHERE b.flight_id = $1`,
      [flight_id],
    );
    return result.rows;
  }

  /**
   * Search flights with pagination
   */
  async searchFlightsPaginated(
    searchParams: SearchFlightDto,
  ): Promise<PaginatedResponse<FlightResponseDto>> {
    let query = `
      SELECT 
        f.*,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport_name,
        dep_airport.city as departure_city,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_airport.city as arrival_city,
        a.registration_number,
        a.model_name,
        a.capacity,
        g.gate_number,
        t.terminal_name
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (searchParams.departure_iata) {
      query += ` AND dep_airport.iata_code = $${paramIndex}`;
      params.push(searchParams.departure_iata);
      paramIndex++;
    }

    if (searchParams.arrival_iata) {
      query += ` AND arr_airport.iata_code = $${paramIndex}`;
      params.push(searchParams.arrival_iata);
      paramIndex++;
    }

    if (searchParams.departure_date) {
      query += ` AND DATE(f.scheduled_departure) = $${paramIndex}`;
      params.push(searchParams.departure_date);
      paramIndex++;
    }

    if (searchParams.status) {
      query += ` AND f.status = $${paramIndex}`;
      params.push(searchParams.status);
      paramIndex++;
    }

    if (searchParams.aircraft_id) {
      query += ` AND f.aircraft_id = $${paramIndex}`;
      params.push(searchParams.aircraft_id);
      paramIndex++;
    }

    if (searchParams.max_price) {
      query += ` AND f.price <= $${paramIndex}`;
      params.push(searchParams.max_price);
      paramIndex++;
    }

    query += ' ORDER BY f.scheduled_departure DESC';

    const result = await this.databaseService.queryPaginated<FlightResponseDto>(
      query,
      params,
      searchParams.page || 1,
      searchParams.limit || 10,
    );

    // Add computed fields
    const flightsWithLoad = await Promise.all(
      result.data.map(async flight => ({
        ...flight,
        load_percentage: await this.calculateFlightLoad(flight.flight_id),
        available_seats: await this.getAvailableSeats(flight.flight_id),
      })),
    );

    return {
      ...result,
      data: flightsWithLoad,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.page < Math.ceil(result.total / result.limit),
      hasPrev: result.page > 1,
    };
  }

  /**
   * Advanced flight search with multiple criteria
   */
  async advancedFlightSearch(
    criteria: FlightSearchCriteriaDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<FlightResponseDto>> {
    let query = `
      SELECT DISTINCT
        f.*,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport_name,
        dep_airport.city as departure_city,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_airport.city as arrival_city,
        a.registration_number,
        a.model_name,
        a.capacity,
        g.gate_number,
        t.terminal_name,
        calculate_flight_load(f.flight_id) as load_percentage
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE f.status IN ('scheduled', 'boarding')
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (criteria.departure_airport) {
      query += ` AND dep_airport.iata_code = $${paramIndex}`;
      params.push(criteria.departure_airport);
      paramIndex++;
    }

    if (criteria.arrival_airport) {
      query += ` AND arr_airport.iata_code = $${paramIndex}`;
      params.push(criteria.arrival_airport);
      paramIndex++;
    }

    if (criteria.departure_date) {
      query += ` AND DATE(f.scheduled_departure) = $${paramIndex}`;
      params.push(criteria.departure_date);
      paramIndex++;
    }

    if (criteria.max_price) {
      query += ` AND f.price <= $${paramIndex}`;
      params.push(criteria.max_price);
      paramIndex++;
    }

    if (criteria.passenger_count) {
      query += ` AND (a.capacity - COALESCE((
        SELECT COUNT(*) FROM tickets t 
        WHERE t.flight_id = f.flight_id AND t.status = 'active'
      ), 0)) >= $${paramIndex}`;
      params.push(criteria.passenger_count);
      paramIndex++;
    }

    if (criteria.direct_flights_only) {
      query += ` AND f.route_id NOT IN (
        SELECT route_id FROM routes WHERE has_connections = true
      )`;
    }

    query += ' ORDER BY f.scheduled_departure ASC';

    const result = await this.databaseService.queryPaginated<FlightResponseDto>(
      query,
      params,
      page,
      limit,
    );

    return {
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.page < Math.ceil(result.total / result.limit),
      hasPrev: result.page > 1,
    };
  }

  /**
   * Get flight statistics
   */
  async getFlightStatistics(
    statisticsDto: FlightStatisticsDto,
  ): Promise<FlightStatisticsResponseDto> {
    const { start_date, end_date, group_by = 'day', airport_id, route_id } = statisticsDto;

    let dateGrouping = 'DATE(f.scheduled_departure)';
    switch (group_by) {
      case 'week':
        dateGrouping = "DATE_TRUNC('week', f.scheduled_departure)";
        break;
      case 'month':
        dateGrouping = "DATE_TRUNC('month', f.scheduled_departure)";
        break;
      case 'year':
        dateGrouping = "DATE_TRUNC('year', f.scheduled_departure)";
        break;
    }

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND f.scheduled_departure >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND f.scheduled_departure <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (airport_id) {
      whereClause += ` AND (f.departure_airport_id = $${paramIndex} OR f.arrival_airport_id = $${paramIndex})`;
      params.push(airport_id);
      paramIndex++;
    }

    if (route_id) {
      whereClause += ` AND f.route_id = $${paramIndex}`;
      params.push(route_id);
      paramIndex++;
    }

    const query = `
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as total_flights,
        COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
        COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancellations,
        COUNT(CASE WHEN f.status = 'delayed' THEN 1 END) as delays,
        AVG(CASE WHEN f.actual_departure IS NOT NULL AND f.scheduled_departure IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 
            ELSE 0 END) as average_delay_minutes,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue,
        AVG(calculate_flight_load(f.flight_id)) as average_load_factor,
        COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights
      FROM flights f
      ${whereClause}
      GROUP BY ${dateGrouping}
      ORDER BY period DESC
    `;

    const result = await this.databaseService.query<FlightStats>(query, params);

    if (result.rows.length === 0) {
      return {
        period: group_by,
        total_flights: 0,
        total_passengers: 0,
        total_revenue: 0,
        average_load_factor: 0,
        on_time_performance: 0,
        cancellations: 0,
        delays: 0,
        average_delay_minutes: 0,
        top_routes: [],
        load_factor_by_class: {},
      };
    }

    const stats = result.rows[0];
    const totalFlights = parseInt(stats.total_flights);
    const onTimeFlights = parseInt(stats.on_time_flights);
    const onTimePerformance = totalFlights > 0 ? (onTimeFlights / totalFlights) * 100 : 0;

    // Get top routes
    const topRoutesQuery = `
      SELECT 
        r.route_id,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        COUNT(*) as flight_count
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      ${whereClause}
      GROUP BY r.route_id, dep_airport.iata_code, arr_airport.iata_code
      ORDER BY flight_count DESC
      LIMIT 5
    `;

    const topRoutesResult = await this.databaseService.query<TopRoute>(topRoutesQuery, params);

    return {
      period: stats.period,
      total_flights: totalFlights,
      total_passengers: 0, // Will be calculated separately
      total_revenue: parseFloat(stats.total_revenue || '0'),
      average_load_factor: parseFloat(stats.average_load_factor || '0'),
      on_time_performance: onTimePerformance,
      cancellations: parseInt(stats.cancellations),
      delays: parseInt(stats.delays),
      average_delay_minutes: parseFloat(stats.average_delay_minutes || '0'),
      top_routes: topRoutesResult.rows,
      load_factor_by_class: {}, // Will be calculated separately
    };
  }

  /**
   * Get available seats for a flight
   */
  async getAvailableSeats(flight_id: number): Promise<number> {
    const result = await this.databaseService.query<{ available_seats: number }>(
      `
      SELECT 
        a.capacity - COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = $1 AND t.status = 'active'
        ), 0) as available_seats
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      WHERE f.flight_id = $1
    `,
      [flight_id],
    );

    return result.rows[0]?.available_seats || 0;
  }

  /**
   * Assign gate to flight
   */
  async assignGate(assignGateDto: AssignGateDto): Promise<FlightResponseDto> {
    const { flight_id, gate_id } = assignGateDto;

    // Check if gate is available
    const gateCheck = await this.databaseService.query<{ assigned_flight_id: number }>(
      `
      SELECT g.*, f.flight_id as assigned_flight_id
      FROM gates g
      LEFT JOIN flights f ON g.gate_id = f.gate_id 
        AND f.status IN ('scheduled', 'boarding')
        AND f.scheduled_departure BETWEEN NOW() - INTERVAL '2 hours' AND NOW() + INTERVAL '4 hours'
      WHERE g.gate_id = $1
    `,
      [gate_id],
    );

    if (gateCheck.rows.length === 0) {
      throw new NotFoundException('Gate not found');
    }

    const gateData = gateCheck.rows[0];
    if (gateData.assigned_flight_id && gateData.assigned_flight_id !== flight_id) {
      throw new ConflictException('Gate is already assigned to another flight');
    }

    // Update flight with gate assignment
    const result = await this.databaseService.query(
      `
      UPDATE flights 
      SET gate_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE flight_id = $2
      RETURNING *
    `,
      [gate_id, flight_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    return this.getFlightDetails(flight_id);
  }

  /**
   * Update flight status with automatic trigger logic
   */
  async updateFlightStatus(updateDto: UpdateFlightStatusDto): Promise<FlightResponseDto> {
    const { flight_id, status, actual_departure, actual_arrival, reason } = updateDto;

    // Implement trigger logic
    let finalStatus = status;
    const finalDeparture = actual_departure;
    const finalArrival = actual_arrival;

    if (actual_departure && !actual_arrival) {
      finalStatus = FlightStatus.DEPARTED;
    } else if (actual_arrival) {
      finalStatus = FlightStatus.ARRIVED;
    } else if (actual_departure && actual_departure > new Date()) {
      finalStatus = FlightStatus.BOARDING;
    }

    const result = await this.databaseService.query(
      `
      UPDATE flights 
      SET 
        status = $1,
        actual_departure = $2,
        actual_arrival = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE flight_id = $4
      RETURNING *
    `,
      [finalStatus, finalDeparture, finalArrival, flight_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    // Log the status change
    await this.logFlightStatusChange(flight_id, finalStatus, reason);

    return this.getFlightDetails(flight_id);
  }

  /**
   * Handle flight delay
   */
  async handleFlightDelay(delayDto: FlightDelayDto): Promise<FlightResponseDto> {
    const { flight_id, delay_minutes, reason, new_departure_time, new_arrival_time } = delayDto;

    const flight = await this.findById(flight_id);
    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    const calculatedDeparture =
      new_departure_time || new Date(flight.scheduled_departure.getTime() + delay_minutes * 60000);
    const calculatedArrival =
      new_arrival_time || new Date(flight.scheduled_arrival.getTime() + delay_minutes * 60000);

    await this.databaseService.query(
      `
      UPDATE flights 
      SET 
        status = 'delayed',
        scheduled_departure = $1,
        scheduled_arrival = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE flight_id = $3
      RETURNING *
    `,
      [calculatedDeparture, calculatedArrival, flight_id],
    );

    // Log the delay
    await this.logFlightStatusChange(flight_id, FlightStatus.DELAYED, reason);

    // Notify passengers
    this.notifyPassengersOfDelay(flight_id, delay_minutes, reason);

    return this.getFlightDetails(flight_id);
  }

  /**
   * Cancel flight
   */
  async cancelFlight(cancellationDto: FlightCancellationDto): Promise<FlightResponseDto> {
    const { flight_id, reason, alternative_flight, notify_passengers } = cancellationDto;

    const flight = await this.findById(flight_id);
    if (!flight) {
      throw new NotFoundException('Flight not found');
    }

    if (flight.status === 'cancelled') {
      throw new BadRequestException('Flight is already cancelled');
    }

    await this.databaseService.query(
      `
      UPDATE flights 
      SET 
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE flight_id = $1
      RETURNING *
    `,
      [flight_id],
    );

    // Log the cancellation
    await this.logFlightStatusChange(flight_id, FlightStatus.CANCELLED, reason);

    // Release gate if assigned
    if (flight.gate_id) {
      await this.releaseGate(flight.gate_id);
    }

    // Notify passengers if requested
    if (notify_passengers) {
      this.notifyPassengersOfCancellation(flight_id, reason, alternative_flight);
    }

    return this.getFlightDetails(flight_id);
  }

  /**
   * Get comprehensive flight details
   */
  async getFlightDetails(flight_id: number): Promise<FlightResponseDto> {
    const result = await this.databaseService.query<FlightResponseDto>(
      `
      SELECT 
        f.*,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport_name,
        dep_airport.city as departure_city,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_airport.city as arrival_city,
        a.registration_number,
        a.model_name,
        a.capacity,
        g.gate_number,
        t.terminal_name
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE f.flight_id = $1
    `,
      [flight_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    const flight = result.rows[0];
    const loadPercentage = await this.calculateFlightLoad(flight_id);
    const availableSeats = await this.getAvailableSeats(flight_id);

    return {
      ...flight,
      load_percentage: loadPercentage,
      available_seats: availableSeats,
    };
  }

  /**
   * Private helper methods
   */
  private async logFlightStatusChange(
    flight_id: number,
    status: string,
    reason?: string,
  ): Promise<void> {
    await this.databaseService.query(
      `
      INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, reason, created_at)
      VALUES ('flights', $1, 'status_change', '{}', $2, $3, CURRENT_TIMESTAMP)
    `,
      [flight_id, JSON.stringify({ status }), reason],
    );
  }

  private async releaseGate(gate_id: number): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE gates 
      SET status = 'available', updated_at = CURRENT_TIMESTAMP
      WHERE gate_id = $1
    `,
      [gate_id],
    );
  }

  private notifyPassengersOfDelay(flight_id: number, delay_minutes: number, reason: string): void {
    // Implementation would integrate with notification service
    console.log(
      `Notifying passengers of flight ${flight_id} delay: ${delay_minutes} minutes - ${reason}`,
    );
  }

  private notifyPassengersOfCancellation(
    flight_id: number,
    reason: string,
    alternative_flight?: string,
  ): void {
    // Implementation would integrate with notification service
    console.log(
      `Notifying passengers of flight ${flight_id} cancellation: ${reason}${alternative_flight ? ` - Alternative: ${alternative_flight}` : ''}`,
    );
  }
}
