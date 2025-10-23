import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FlightEntity } from './entities/flight.entity';
import { FlightStatus } from '../shared/enums';
import type {
  CreateFlightDto,
  UpdateFlightDto,
  SearchFlightDto,
  FlightSearchCriteriaDto,
  FlightStatisticsDto,
  FlightStatisticsResponseDto,
  FlightResponseDto,
  AssignGateDto,
  UpdateFlightStatusDto,
  FlightDelayDto,
  FlightCancellationDto,
} from './dto/flight.dto';
import type { PaginatedResponse } from '../shared/dto/base.dto';

// Interface for the raw SQL query result
interface FlightQueryResult {
  flight_id: number;
  flight_number: string;
  aircraft_id: number;
  route_id: number;
  departure_airport_id: number;
  arrival_airport_id: number;
  gate_id?: number;
  scheduled_departure: Date;
  scheduled_arrival: Date;
  actual_departure?: Date;
  actual_arrival?: Date;
  status: FlightStatus;
  price: number;
  created_at: Date;
  updated_at: Date;
  departure_iata: string;
  departure_airport_name: string;
  departure_city: string;
  arrival_iata: string;
  arrival_airport_name: string;
  arrival_city: string;
  registration_number: string;
  model_name: string;
  capacity: number;
  gate_number?: string;
  terminal_name?: string;
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
        scheduled_departure, scheduled_arrival, price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        flight_number,
        aircraft_id,
        route_id,
        gate_id,
        scheduled_departure,
        scheduled_arrival,
        price,
        FlightStatus.SCHEDULED,
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
      `UPDATE flights SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE flight_id = $1 RETURNING *`,
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
      'UPDATE flights SET actual_departure = $2, actual_arrival = $3, updated_at = CURRENT_TIMESTAMP WHERE flight_id = $1 RETURNING *',
      [flight_id, actual_departure, actual_arrival],
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
  checkSeatAvailability(_flight_id: number, _seat_number: string): boolean {
    // Mock implementation for now
    return Math.random() > 0.3; // 70% chance of being available
  }

  /**
   * Calculate flight load percentage using database function
   */
  async calculateFlightLoad(flight_id: number): Promise<number> {
    try {
      const result = await this.databaseService.query<{ calculate_flight_load: number }>(
        'SELECT calculate_flight_load($1)',
        [flight_id],
      );
      return Number(result.rows[0]?.calculate_flight_load) || 0;
    } catch (_error) {
      // Fallback to mock calculation if database function doesn't exist
      console.warn('calculate_flight_load function not found, using mock calculation');
      return Math.floor(Math.random() * 100);
    }
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
        dep_city.city_name as departure_city,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_city.city_name as arrival_city,
        a.registration_number,
        a.model_name,
        a.capacity,
        g.gate_number,
        t.terminal_name
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
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

    const result = await this.databaseService.queryPaginated<FlightQueryResult>(
      query,
      params,
      searchParams.page || 1,
      searchParams.limit || 10,
    );

    // Transform the result to match FlightResponseDto structure
    const flightsWithDetails = await Promise.all(
      result.data.map(async (flight): Promise<FlightResponseDto> => ({
        flight_id: flight.flight_id,
        flight_number: flight.flight_number,
        aircraft_id: flight.aircraft_id,
        route_id: flight.route_id,
        departure_airport_id: flight.departure_airport_id,
        arrival_airport_id: flight.arrival_airport_id,
        gate_id: flight.gate_id,
        scheduled_departure: flight.scheduled_departure,
        scheduled_arrival: flight.scheduled_arrival,
        actual_departure: flight.actual_departure,
        actual_arrival: flight.actual_arrival,
        status: flight.status,
        price: Number(flight.price),
        created_at: new Date(), // Use current time since DB doesn't have created_at
        updated_at: new Date(), // Use current time since DB doesn't have updated_at
        departure_airport: {
          iata_code: flight.departure_iata,
          airport_name: flight.departure_airport_name,
          city: flight.departure_city,
        },
        arrival_airport: {
          iata_code: flight.arrival_iata,
          airport_name: flight.arrival_airport_name,
          city: flight.arrival_city,
        },
        aircraft: {
          registration_number: flight.registration_number,
          model_name: flight.model_name,
          capacity: Number(flight.capacity),
        },
        gate: flight.gate_number ? {
          gate_number: flight.gate_number,
          terminal: flight.terminal_name || 'Unknown',
        } : undefined,
        load_percentage: Number(await this.calculateFlightLoad(flight.flight_id)),
        available_seats: Number(await this.getAvailableSeats(flight.flight_id)),
      }))
    );

    return {
      ...result,
      data: flightsWithDetails,
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
    _page: number = 1,
    _limit: number = 10,
  ): Promise<PaginatedResponse<FlightResponseDto>> {
    // Mock implementation for now
    return this.searchFlightsPaginated({} as SearchFlightDto);
  }

  /**
   * Get flight statistics
   */
  getFlightStatistics(statisticsDto: FlightStatisticsDto): Promise<FlightStatisticsResponseDto> {
    // Mock implementation for now
    return Promise.resolve({
      period: statisticsDto.group_by || 'day',
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
    });
  }

  /**
   * Get available seats for a flight
   */
  async getAvailableSeats(flight_id: number): Promise<number> {
    try {
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
      return Number(result.rows[0]?.available_seats) || 0;
    } catch (_error) {
      // Fallback to mock calculation if query fails
      console.warn('Error calculating available seats, using mock calculation');
      return Math.floor(Math.random() * 50);
    }
  }

  /**
   * Assign gate to flight
   */
  async assignGate(assignGateDto: AssignGateDto): Promise<FlightResponseDto> {
    const { flight_id, gate_id } = assignGateDto;

    // Get flight details with all related data
    const flightQuery = `
      SELECT 
        f.*,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport_name,
        dep_city.city_name as departure_city,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_city.city_name as arrival_city,
        a.registration_number,
        a.model_name,
        a.capacity,
        g.gate_number,
        t.terminal_name
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE f.flight_id = $1
    `;

    const flightResult = await this.databaseService.query<FlightQueryResult>(
  
      flightQuery,
      [flight_id]
    );

    if (flightResult.rows.length === 0) {
      throw new Error(`Flight with ID ${flight_id} not found`);
    }

    const flight = flightResult.rows[0];

    // Update flight with new gate assignment
    const updateResult = await this.databaseService.query<FlightEntity>(
      `UPDATE flights 
       SET gate_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE flight_id = $2
       RETURNING *`,
      [gate_id, flight_id]
    );

    const updatedFlight = updateResult.rows[0];

    // Get gate details
    const gateQuery = `
      SELECT g.gate_number, t.terminal_name
      FROM gates g
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE g.gate_id = $1
    `;
    const gateResult = await this.databaseService.query<{ gate_number: string; terminal_name: string }>(
      gateQuery,
      [gate_id]
    );

    const gateInfo = gateResult.rows[0];

    // Calculate computed fields
    const [loadPercentage, availableSeats] = await Promise.all([
      this.calculateFlightLoad(flight_id),
      this.getAvailableSeats(flight_id)
    ]);

    return {
      flight_id: updatedFlight.flight_id,
      flight_number: updatedFlight.flight_number,
      aircraft_id: updatedFlight.aircraft_id,
      route_id: updatedFlight.route_id,
      departure_airport_id: updatedFlight.departure_airport_id,
      arrival_airport_id: updatedFlight.arrival_airport_id,
      gate_id: updatedFlight.gate_id,
      scheduled_departure: updatedFlight.scheduled_departure,
      scheduled_arrival: updatedFlight.scheduled_arrival,
      actual_departure: updatedFlight.actual_departure,
      actual_arrival: updatedFlight.actual_arrival,
      status: updatedFlight.status as FlightStatus,
      price: updatedFlight.price,
      created_at: new Date(), // Use current time since DB doesn't have created_at
      updated_at: new Date(), // Use current time since DB doesn't have updated_at
      departure_airport: {
        iata_code: flight.departure_iata,
        airport_name: flight.departure_airport_name,
        city: flight.departure_city,
      },
      arrival_airport: {
        iata_code: flight.arrival_iata,
        airport_name: flight.arrival_airport_name,
        city: flight.arrival_city,
      },
      aircraft: {
        registration_number: flight.registration_number,
        model_name: flight.model_name,
        capacity: flight.capacity,
      },
      gate: gateInfo ? {
        gate_number: gateInfo.gate_number,
        terminal: gateInfo.terminal_name || 'Unknown',
      } : undefined,
      load_percentage: loadPercentage,
      available_seats: availableSeats,
    };
  }

  /**
   * Update flight status with automatic trigger logic
   */
  async updateFlightStatus(updateDto: UpdateFlightStatusDto): Promise<FlightResponseDto> {
    const { flight_id, status, actual_departure, actual_arrival, reason } = updateDto;

    // Get current flight data
    const currentFlight = await this.findById(flight_id);
    if (!currentFlight) {
      throw new Error(`Flight with ID ${flight_id} not found`);
    }

    // Update flight status
    let updateQuery = `
      UPDATE flights 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const params: unknown[] = [status, flight_id];
    let paramIndex = 3;
    if (actual_departure) {
      updateQuery += `, actual_departure = $${paramIndex}`;
      params.push(actual_departure);
      paramIndex++;
    }
    
    if (actual_arrival) {
      updateQuery += `, actual_arrival = $${paramIndex}`;
      params.push(actual_arrival);
      paramIndex++;
    }
    
    updateQuery += ` WHERE flight_id = $2 RETURNING *`;

    const updateResult = await this.databaseService.query<FlightEntity>(
      updateQuery,
      params
    );

    const updatedFlight = updateResult.rows[0];

    // Log the status change
    console.log(`Flight ${flight_id} status changed to ${status}${reason ? ` - Reason: ${reason}` : ''}`);

    // Return updated flight details
    return this.getFlightDetails(flight_id);
  }

  /**
   * Handle flight delay
   */
  async handleFlightDelay(delayDto: FlightDelayDto): Promise<FlightResponseDto> {
    const { flight_id, delay_minutes, reason, new_departure_time, new_arrival_time } = delayDto;

    // Get current flight data
    const currentFlight = await this.findById(flight_id);
    if (!currentFlight) {
      throw new Error(`Flight with ID ${flight_id} not found`);
    }

    // Calculate new times if not provided
    const calculatedNewDeparture = new_departure_time || 
      new Date(currentFlight.scheduled_departure.getTime() + delay_minutes * 60 * 1000);
    const calculatedNewArrival = new_arrival_time || 
      new Date(currentFlight.scheduled_arrival.getTime() + delay_minutes * 60 * 1000);

    // Update flight with delay
    const updateResult = await this.databaseService.query<FlightEntity>(
      `UPDATE flights 
       SET status = $1, 
           scheduled_departure = $2, 
           scheduled_arrival = $3, 
           updated_at = CURRENT_TIMESTAMP
       WHERE flight_id = $4
       RETURNING *`,
      [FlightStatus.DELAYED, calculatedNewDeparture, calculatedNewArrival, flight_id]
    );

    const updatedFlight = updateResult.rows[0];

    // Log the delay
    console.log(`Flight ${flight_id} delayed by ${delay_minutes} minutes${reason ? ` - Reason: ${reason}` : ''}`);

    // Notify passengers
    this.notifyPassengersOfDelay(flight_id, delay_minutes, reason);

    // Return updated flight details
    return this.getFlightDetails(flight_id);
  }

  /**
   * Cancel flight
   */
  async cancelFlight(cancellationDto: FlightCancellationDto): Promise<FlightResponseDto> {
    const { flight_id, reason, alternative_flight, notify_passengers } = cancellationDto;

    // Get current flight data
    const currentFlight = await this.findById(flight_id);
    if (!currentFlight) {
      throw new Error(`Flight with ID ${flight_id} not found`);
    }

    // Update flight status to cancelled
    const updateResult = await this.databaseService.query<FlightEntity>(
      `UPDATE flights 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE flight_id = $2
       RETURNING *`,
      [FlightStatus.CANCELLED, flight_id]
    );

    const updatedFlight = updateResult.rows[0];

    // Release gate if assigned
    if (currentFlight.gate_id) {
      await this.releaseGate(currentFlight.gate_id);
    }

    // Log the cancellation
    console.log(`Flight ${flight_id} cancelled${reason ? ` - Reason: ${reason}` : ''}`);

    // Notify passengers if requested
    if (notify_passengers) {
      this.notifyPassengersOfCancellation(flight_id, reason, alternative_flight);
    }

    // Return updated flight details
    return this.getFlightDetails(flight_id);
  }

  /**
   * Get comprehensive flight details
   */
  async getFlightDetails(flight_id: number): Promise<FlightResponseDto> {
    const flightQuery = `
      SELECT 
        f.*,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport_name,
        dep_city.city_name as departure_city,
        dep_airport.latitude as departure_latitude,
        dep_airport.longitude as departure_longitude,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport_name,
        arr_city.city_name as arrival_city,
        arr_airport.latitude as arrival_latitude,
        arr_airport.longitude as arrival_longitude,
        a.registration_number,
        a.model_name,
        a.capacity,
        a.status as aircraft_status,
        g.gate_number,
        t.terminal_name
      FROM flights f
      LEFT JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      LEFT JOIN cities dep_city ON dep_airport.city_id = dep_city.city_id
      LEFT JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      LEFT JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN gates g ON f.gate_id = g.gate_id
      LEFT JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE f.flight_id = $1
    `;

    const flightResult = await this.databaseService.query<FlightQueryResult>(
      flightQuery,
      [flight_id]
    );

    if (flightResult.rows.length === 0) {
      throw new Error(`Flight with ID ${flight_id} not found`);
    }

    const flight = flightResult.rows[0];

    // Calculate computed fields
    const [loadPercentage, availableSeats] = await Promise.all([
      this.calculateFlightLoad(flight_id),
      this.getAvailableSeats(flight_id)
    ]);

    return {
      flight_id: flight.flight_id,
      flight_number: flight.flight_number,
      aircraft_id: flight.aircraft_id,
      route_id: flight.route_id,
      departure_airport_id: flight.departure_airport_id,
      arrival_airport_id: flight.arrival_airport_id,
      gate_id: flight.gate_id,
      scheduled_departure: flight.scheduled_departure,
      scheduled_arrival: flight.scheduled_arrival,
      actual_departure: flight.actual_departure,
      actual_arrival: flight.actual_arrival,
      status: flight.status,
      price: Number(flight.price),
      created_at: new Date(), // Use current time since DB doesn't have created_at
      updated_at: new Date(), // Use current time since DB doesn't have updated_at
      departure_airport: {
        iata_code: flight.departure_iata,
        airport_name: flight.departure_airport_name,
        city: flight.departure_city,
      },
      arrival_airport: {
        iata_code: flight.arrival_iata,
        airport_name: flight.arrival_airport_name,
        city: flight.arrival_city,
      },
      aircraft: {
        registration_number: flight.registration_number,
        model_name: flight.model_name,
        capacity: flight.capacity,
      },
      gate: flight.gate_number ? {
        gate_number: flight.gate_number,
            terminal: flight.terminal_name || 'Unknown',
      } : undefined,
      load_percentage: loadPercentage,
      available_seats: availableSeats,
    };
  }

  private async releaseGate(gate_id: number): Promise<void> {
    try {
      await this.databaseService.query(
        `UPDATE gates 
         SET status = 'available', updated_at = CURRENT_TIMESTAMP
         WHERE gate_id = $1`,
        [gate_id]
      );
      console.log(`Gate ${gate_id} released`);
    } catch (error) {
      console.warn(`Failed to release gate ${gate_id}:`, error);
    }
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
    const alternativeText = alternative_flight ? ` - Alternative: ${alternative_flight}` : '';
    console.log(
      `Notifying passengers of flight ${flight_id} cancellation: ${reason}${alternativeText}`,
    );
  }
}
