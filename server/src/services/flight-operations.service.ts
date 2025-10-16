import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FlightStatus } from '../shared/enums';

export interface RegisterPassengerForFlightDto {
  passenger_id: number;
  flight_id: number;
  seat_number?: string;
  class: 'economy' | 'business' | 'first';
  price?: number;
}

export interface CancelFlightDto {
  flight_id: number;
  reason: string;
  refund_passengers?: boolean;
}

export interface SearchFlightsDto {
  departure_airport_id?: number;
  arrival_airport_id?: number;
  departure_date?: string;
  arrival_date?: string;
  passenger_count?: number;
  class?: string;
  max_price?: number;
  direct_flights_only?: boolean;
}

export interface FlightStatisticsDto {
  start_date?: string;
  end_date?: string;
  airport_id?: number;
  route_id?: number;
  aircraft_id?: number;
}

export interface UpdateFlightStatusDto {
  flight_id: number;
  status: FlightStatus;
  actual_departure?: string;
  actual_arrival?: string;
  delay_reason?: string;
}

@Injectable()
export class FlightOperationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Register passenger for flight (from triggers_and_procedures.sql #2.1)
   */
  async registerPassengerForFlight(dto: RegisterPassengerForFlightDto): Promise<{
    success: boolean;
    ticket_id?: number;
    message: string;
  }> {
    const { passenger_id, flight_id, seat_number, class: ticketClass, price } = dto;

    return await this.databaseService.transaction(async (client) => {
      // Check if passenger exists
      const passengerCheck = await client.query(
        'SELECT passenger_id FROM passengers WHERE passenger_id = $1',
        [passenger_id],
      );

      if (passengerCheck.rows.length === 0) {
        throw new NotFoundException('Passenger not found');
      }

      // Check if flight exists and is available for booking
      const flightCheck = await client.query(
        `
        SELECT 
          f.flight_id,
          f.status,
          f.scheduled_departure,
          f.price,
          a.capacity,
          COUNT(t.ticket_id) as booked_seats
        FROM flights f
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
        WHERE f.flight_id = $1
        GROUP BY f.flight_id, f.status, f.scheduled_departure, f.price, a.capacity
      `,
        [flight_id],
      );

      if (flightCheck.rows.length === 0) {
        throw new NotFoundException('Flight not found');
      }

      const flight = flightCheck.rows[0];
      
      if (flight.status !== 'scheduled') {
        throw new BadRequestException('Flight is not available for booking');
      }

      if (new Date(flight.scheduled_departure) <= new Date()) {
        throw new BadRequestException('Cannot book flight that has already departed');
      }

      // Check capacity
      const bookedSeats = parseInt(flight.booked_seats);
      const capacity = parseInt(flight.capacity);
      
      if (bookedSeats >= capacity) {
        throw new ConflictException('Flight is fully booked');
      }

      // Check seat availability if seat number is specified
      if (seat_number) {
        const seatCheck = await client.query(
          'SELECT ticket_id FROM tickets WHERE flight_id = $1 AND seat_number = $2 AND status = $3',
          [flight_id, seat_number, 'active'],
        );

        if (seatCheck.rows.length > 0) {
          throw new ConflictException('Seat is already taken');
        }
      }

      // Calculate ticket price
      const basePrice = price || flight.price;
      const finalPrice = this.calculateTicketPrice(basePrice, ticketClass);

      // Generate ticket number
      const ticketNumber = this.generateTicketNumber();

      // Create ticket
      const ticketResult = await client.query(
        `
        INSERT INTO tickets (
          passenger_id, flight_id, ticket_number, seat_number, 
          class, price, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING ticket_id
      `,
        [passenger_id, flight_id, ticketNumber, seat_number, ticketClass, finalPrice, 'active'],
      );

      const ticketId = ticketResult.rows[0].ticket_id;

      // Update flight load
      await this.updateFlightLoad(flight_id);

      return {
        success: true,
        ticket_id: ticketId,
        message: 'Passenger successfully registered for flight',
      };
    });
  }

  /**
   * Cancel flight (from triggers_and_procedures.sql #2.2)
   */
  async cancelFlight(dto: CancelFlightDto): Promise<{
    success: boolean;
    affected_passengers: number;
    refunded_amount: number;
    message: string;
  }> {
    const { flight_id, reason, refund_passengers = true } = dto;

    return await this.databaseService.transaction(async (client) => {
      // Check if flight exists
      const flightCheck = await client.query(
        'SELECT flight_id, status, scheduled_departure FROM flights WHERE flight_id = $1',
        [flight_id],
      );

      if (flightCheck.rows.length === 0) {
        throw new NotFoundException('Flight not found');
      }

      const flight = flightCheck.rows[0];

      if (flight.status === 'cancelled') {
        throw new BadRequestException('Flight is already cancelled');
      }

      if (flight.status === 'arrived') {
        throw new BadRequestException('Cannot cancel completed flight');
      }

      // Get all active tickets for this flight
      const ticketsResult = await client.query(
        'SELECT ticket_id, passenger_id, price FROM tickets WHERE flight_id = $1 AND status = $2',
        [flight_id, 'active'],
      );

      const tickets = ticketsResult.rows;
      let refundedAmount = 0;

      // Cancel tickets and process refunds if requested
      if (refund_passengers && tickets.length > 0) {
        for (const ticket of tickets) {
          // Cancel ticket
          await client.query(
            'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $2',
            ['cancelled', ticket.ticket_id],
          );

          // Process refund
          const refundAmount = this.calculateRefundAmount(ticket.price, flight.scheduled_departure);
          refundedAmount += refundAmount;

          // Create refund record
          await client.query(
            `
            INSERT INTO refunds (
              ticket_id, amount, reason, status, created_at
            )
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `,
            [ticket.ticket_id, refundAmount, reason, 'processed'],
          );
        }
      }

      // Cancel flight
      await client.query(
        'UPDATE flights SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE flight_id = $2',
        ['cancelled', flight_id],
      );

      // Release gate if assigned
      await client.query(
        'UPDATE gates SET status = $1, flight_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE flight_id = $2',
        ['available', flight_id],
      );

      // Cancel crew assignments
      await client.query(
        'UPDATE flight_crew SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE flight_id = $2',
        ['cancelled', flight_id],
      );

      return {
        success: true,
        affected_passengers: tickets.length,
        refunded_amount: refundedAmount,
        message: `Flight cancelled successfully. ${tickets.length} passengers affected.`,
      };
    });
  }

  /**
   * Search flights (from triggers_and_procedures.sql #2.3)
   */
  async searchFlights(dto: SearchFlightsDto): Promise<Array<{
    flight_id: number;
    flight_number: string;
    departure_airport: string;
    arrival_airport: string;
    scheduled_departure: Date;
    scheduled_arrival: Date;
    price: number;
    available_seats: number;
    duration: string;
    aircraft_type: string;
  }>> {
    const {
      departure_airport_id,
      arrival_airport_id,
      departure_date,
      arrival_date,
      passenger_count = 1,
      class: ticketClass,
      max_price,
      direct_flights_only = true,
    } = dto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Base conditions
    conditions.push("f.status = 'scheduled'");
    conditions.push('f.scheduled_departure > CURRENT_TIMESTAMP');

    if (departure_airport_id) {
      conditions.push(`f.departure_airport_id = $${paramIndex}`);
      params.push(departure_airport_id);
      paramIndex++;
    }

    if (arrival_airport_id) {
      conditions.push(`f.arrival_airport_id = $${paramIndex}`);
      params.push(arrival_airport_id);
      paramIndex++;
    }

    if (departure_date) {
      conditions.push(`DATE(f.scheduled_departure) = $${paramIndex}`);
      params.push(departure_date);
      paramIndex++;
    }

    if (arrival_date) {
      conditions.push(`DATE(f.scheduled_arrival) = $${paramIndex}`);
      params.push(arrival_date);
      paramIndex++;
    }

    if (max_price) {
      conditions.push(`f.price <= $${paramIndex}`);
      params.push(max_price);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await this.databaseService.query(
      `
      SELECT 
        f.flight_id,
        f.flight_number,
        dep_airport.name as departure_airport,
        arr_airport.name as arrival_airport,
        f.scheduled_departure,
        f.scheduled_arrival,
        f.price,
        (a.capacity - COALESCE(booked_seats.count, 0)) as available_seats,
        EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure))/3600 as duration_hours,
        am.model_name as aircraft_type
      FROM flights f
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      LEFT JOIN (
        SELECT flight_id, COUNT(*) as count
        FROM tickets
        WHERE status = 'active'
        GROUP BY flight_id
      ) booked_seats ON f.flight_id = booked_seats.flight_id
      WHERE ${whereClause}
      AND (a.capacity - COALESCE(booked_seats.count, 0)) >= $${paramIndex}
      ORDER BY f.scheduled_departure
    `,
      [...params, passenger_count],
    );

    return result.rows.map((row) => ({
      flight_id: row.flight_id,
      flight_number: row.flight_number,
      departure_airport: row.departure_airport,
      arrival_airport: row.arrival_airport,
      scheduled_departure: row.scheduled_departure,
      scheduled_arrival: row.scheduled_arrival,
      price: row.price,
      available_seats: parseInt(row.available_seats),
      duration: `${Math.round(row.duration_hours)}h ${Math.round((row.duration_hours % 1) * 60)}m`,
      aircraft_type: row.aircraft_type,
    }));
  }

  /**
   * Calculate flight statistics (from triggers_and_procedures.sql #2.4)
   */
  async calculateFlightStatistics(dto: FlightStatisticsDto): Promise<{
    total_flights: number;
    completed_flights: number;
    cancelled_flights: number;
    delayed_flights: number;
    on_time_performance: number;
    total_passengers: number;
    total_revenue: number;
    average_load_factor: number;
    average_delay_minutes: number;
  }> {
    const { start_date, end_date, airport_id, route_id, aircraft_id } = dto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (start_date) {
      conditions.push(`f.scheduled_departure >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`f.scheduled_departure <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (airport_id) {
      conditions.push(`(f.departure_airport_id = $${paramIndex} OR f.arrival_airport_id = $${paramIndex})`);
      params.push(airport_id);
      paramIndex++;
    }

    if (route_id) {
      conditions.push(`f.route_id = $${paramIndex}`);
      params.push(route_id);
      paramIndex++;
    }

    if (aircraft_id) {
      conditions.push(`f.aircraft_id = $${paramIndex}`);
      params.push(aircraft_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query(
      `
      SELECT 
        COUNT(*) as total_flights,
        COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
        COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancelled_flights,
        COUNT(CASE WHEN f.status = 'delayed' THEN 1 END) as delayed_flights,
        COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
        COALESCE(SUM((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as total_passengers,
        COALESCE(SUM(f.price * (
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as total_revenue,
        AVG((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )::float / a.capacity::float * 100) as average_load_factor,
        AVG(CASE WHEN f.actual_departure IS NOT NULL AND f.scheduled_departure IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 
            ELSE 0 END) as average_delay_minutes
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      ${whereClause}
    `,
      params,
    );

    const stats = result.rows[0];
    const totalFlights = parseInt(stats.total_flights);
    const onTimeFlights = parseInt(stats.on_time_flights);

    return {
      total_flights: totalFlights,
      completed_flights: parseInt(stats.completed_flights),
      cancelled_flights: parseInt(stats.cancelled_flights),
      delayed_flights: parseInt(stats.delayed_flights),
      on_time_performance: totalFlights > 0 ? (onTimeFlights / totalFlights) * 100 : 0,
      total_passengers: parseInt(stats.total_passengers),
      total_revenue: parseFloat(stats.total_revenue || '0'),
      average_load_factor: parseFloat(stats.average_load_factor || '0'),
      average_delay_minutes: parseFloat(stats.average_delay_minutes || '0'),
    };
  }

  /**
   * Update flight status manually (from triggers_and_procedures.sql #2.7)
   */
  async updateFlightStatusManual(dto: UpdateFlightStatusDto): Promise<{
    success: boolean;
    message: string;
    affected_passengers: number;
  }> {
    const { flight_id, status, actual_departure, actual_arrival, delay_reason } = dto;

    return await this.databaseService.transaction(async (client) => {
      // Check if flight exists
      const flightCheck = await client.query(
        'SELECT flight_id, status FROM flights WHERE flight_id = $1',
        [flight_id],
      );

      if (flightCheck.rows.length === 0) {
        throw new NotFoundException('Flight not found');
      }

      const currentStatus = flightCheck.rows[0].status;

      // Validate status transition
      if (!this.isValidStatusTransition(currentStatus, status)) {
        throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${status}`);
      }

      // Update flight status
      const updateFields: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const params: unknown[] = [status];
      let paramIndex = 2;

      if (actual_departure) {
        updateFields.push(`actual_departure = $${paramIndex}`);
        params.push(actual_departure);
        paramIndex++;
      }

      if (actual_arrival) {
        updateFields.push(`actual_arrival = $${paramIndex}`);
        params.push(actual_arrival);
        paramIndex++;
      }

      if (delay_reason) {
        updateFields.push(`delay_reason = $${paramIndex}`);
        params.push(delay_reason);
        paramIndex++;
      }

      params.push(flight_id);

      await client.query(
        `UPDATE flights SET ${updateFields.join(', ')} WHERE flight_id = $${paramIndex}`,
        params,
      );

      // Handle status-specific actions
      if (status === 'boarding') {
        await this.handleBoardingStatus(flight_id, client);
      } else if (status === 'departed') {
        await this.handleDepartedStatus(flight_id, client);
      } else if (status === 'arrived') {
        await this.handleArrivedStatus(flight_id, client);
      }

      // Get affected passengers count
      const passengersResult = await client.query(
        'SELECT COUNT(*) as count FROM tickets WHERE flight_id = $1 AND status = $2',
        [flight_id, 'active'],
      );

      const affectedPassengers = parseInt(passengersResult.rows[0].count);

      return {
        success: true,
        message: `Flight status updated to ${status}`,
        affected_passengers: affectedPassengers,
      };
    });
  }

  // Helper methods

  private calculateTicketPrice(basePrice: number, ticketClass: string): number {
    const multipliers = {
      economy: 1.0,
      business: 1.5,
      first: 2.0,
    };

    return Math.round(basePrice * (multipliers[ticketClass] || 1.0));
  }

  private generateTicketNumber(): string {
    const prefix = 'TK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private calculateRefundAmount(price: number, scheduledDeparture: Date): number {
    const now = new Date();
    const departure = new Date(scheduledDeparture);
    const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeparture > 24) {
      return price; // Full refund
    } else if (hoursUntilDeparture > 2) {
      return price * 0.8; // 80% refund
    } else {
      return price * 0.5; // 50% refund
    }
  }

  private async updateFlightLoad(flightId: number): Promise<void> {
    await this.databaseService.query(
      `
      UPDATE flights 
      SET load_percentage = (
        SELECT ROUND((COUNT(t.ticket_id)::float / a.capacity::float) * 100, 2)
        FROM tickets t
        JOIN flights f ON t.flight_id = f.flight_id
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        WHERE t.flight_id = $1 AND t.status = 'active'
      )
      WHERE flight_id = $1
    `,
      [flightId],
    );
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      scheduled: ['boarding', 'cancelled', 'delayed'],
      boarding: ['departed', 'cancelled'],
      departed: ['arrived'],
      delayed: ['boarding', 'cancelled'],
      cancelled: [], // Terminal state
      arrived: [], // Terminal state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async handleBoardingStatus(flightId: number, client: any): Promise<void> {
    // Update gate status
    await client.query(
      'UPDATE gates SET status = $1 WHERE flight_id = $2',
      ['occupied', flightId],
    );

    // Send boarding notifications (would integrate with notification service)
    console.log(`Boarding started for flight ${flightId}`);
  }

  private async handleDepartedStatus(flightId: number, client: any): Promise<void> {
    // Update crew status
    await client.query(
      'UPDATE flight_crew SET status = $1 WHERE flight_id = $2',
      ['in_flight', flightId],
    );

    // Update gate status
    await client.query(
      'UPDATE gates SET status = $1, flight_id = NULL WHERE flight_id = $2',
      ['available', flightId],
    );
  }

  private async handleArrivedStatus(flightId: number, client: any): Promise<void> {
    // Update crew status
    await client.query(
      'UPDATE flight_crew SET status = $1 WHERE flight_id = $2',
      ['completed', flightId],
    );

    // Update ticket statuses
    await client.query(
      'UPDATE tickets SET status = $1 WHERE flight_id = $2 AND status = $3',
      ['used', flightId, 'active'],
    );

    // Update baggage statuses
    await client.query(
      'UPDATE baggage SET status = $1 WHERE flight_id = $2 AND status = $3',
      ['unloaded', flightId, 'loaded'],
    );
  }
}

