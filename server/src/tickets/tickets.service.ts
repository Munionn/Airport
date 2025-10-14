import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  SearchTicketDto,
  CheckInDto,
  SeatSelectionDto,
  TicketCancellationDto,
  TicketRefundDto,
  SeatAvailabilityDto,
  TicketStatisticsDto,
  TicketPricingDto,
  TicketResponseDto,
  SeatAvailabilityResponseDto,
  TicketStatisticsResponseDto,
  TicketPricingResponseDto,
} from './dto/ticket.dto';
import { TicketClass, TicketStatus } from '../shared/enums';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all tickets with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<TicketResponseDto>> {
    const result = await this.databaseService.queryPaginated<TicketResponseDto>(
      `SELECT 
        t.*,
        p.first_name || ' ' || p.last_name as passenger_name,
        f.flight_number,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        f.scheduled_departure as departure_time,
        f.scheduled_arrival as arrival_time
      FROM tickets t
      JOIN passengers p ON t.passenger_id = p.passenger_id
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      ORDER BY t.created_at DESC`,
      [],
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
   * Get ticket by ID
   */
  async findById(ticket_id: number): Promise<TicketResponseDto | null> {
    const result = await this.databaseService.query<TicketResponseDto>(
      `SELECT 
        t.*,
        p.first_name || ' ' || p.last_name as passenger_name,
        f.flight_number,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        f.scheduled_departure as departure_time,
        f.scheduled_arrival as arrival_time
      FROM tickets t
      JOIN passengers p ON t.passenger_id = p.passenger_id
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      WHERE t.ticket_id = $1`,
      [ticket_id],
    );
    return result.rows[0] || null;
  }

  /**
   * Get ticket by ticket number
   */
  async findByTicketNumber(ticket_number: string): Promise<TicketResponseDto | null> {
    const result = await this.databaseService.query<TicketResponseDto>(
      `SELECT 
        t.*,
        p.first_name || ' ' || p.last_name as passenger_name,
        f.flight_number,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        f.scheduled_departure as departure_time,
        f.scheduled_arrival as arrival_time
      FROM tickets t
      JOIN passengers p ON t.passenger_id = p.passenger_id
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      WHERE t.ticket_number = $1`,
      [ticket_number],
    );
    return result.rows[0] || null;
  }

  /**
   * Search tickets with advanced criteria
   */
  async searchTickets(searchDto: SearchTicketDto): Promise<PaginatedResponse<TicketResponseDto>> {
    let query = `
      SELECT 
        t.*,
        p.first_name || ' ' || p.last_name as passenger_name,
        f.flight_number,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        f.scheduled_departure as departure_time,
        f.scheduled_arrival as arrival_time
      FROM tickets t
      JOIN passengers p ON t.passenger_id = p.passenger_id
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (searchDto.search) {
      query += ` AND (t.ticket_number ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR f.flight_number ILIKE $${paramIndex})`;
      params.push(`%${searchDto.search}%`);
      paramIndex++;
    }

    if (searchDto.passenger_id) {
      query += ` AND t.passenger_id = $${paramIndex}`;
      params.push(searchDto.passenger_id);
      paramIndex++;
    }

    if (searchDto.flight_id) {
      query += ` AND t.flight_id = $${paramIndex}`;
      params.push(searchDto.flight_id);
      paramIndex++;
    }

    if (searchDto.status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(searchDto.status);
      paramIndex++;
    }

    if (searchDto.class) {
      query += ` AND t.class = $${paramIndex}`;
      params.push(searchDto.class);
      paramIndex++;
    }

    if (searchDto.booking_date_from) {
      query += ` AND t.created_at >= $${paramIndex}`;
      params.push(searchDto.booking_date_from);
      paramIndex++;
    }

    if (searchDto.booking_date_to) {
      query += ` AND t.created_at <= $${paramIndex}`;
      params.push(searchDto.booking_date_to);
      paramIndex++;
    }

    if (searchDto.booking_reference) {
      query += ` AND t.booking_reference = $${paramIndex}`;
      params.push(searchDto.booking_reference);
      paramIndex++;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await this.databaseService.queryPaginated<TicketResponseDto>(
      query,
      params,
      searchDto.page || 1,
      searchDto.limit || 10,
    );

    return {
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
      hasNext: result.page < Math.ceil(result.total / result.limit),
      hasPrev: result.page > 1,
    };
  }

  /**
   * Create a new ticket
   */
  async createTicket(createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    const {
      passenger_id,
      flight_id,
      seat_number,
      class: ticketClass,
      price,
      meal_preference,
      special_requests,
      insurance = false,
      booking_reference,
    } = createTicketDto;

    // Check if passenger exists
    const passengerExists = await this.databaseService.exists('passengers', { passenger_id });
    if (!passengerExists) {
      throw new NotFoundException('Passenger not found');
    }

    // Check if flight exists
    const flightExists = await this.databaseService.exists('flights', { flight_id });
    if (!flightExists) {
      throw new NotFoundException('Flight not found');
    }

    // Check seat availability if seat is specified
    if (seat_number) {
      const seatAvailable = await this.checkSeatAvailability(flight_id, seat_number);
      if (!seatAvailable) {
        throw new ConflictException('Seat is not available');
      }
    }

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();

    const result = await this.databaseService.query<TicketResponseDto>(
      `INSERT INTO tickets (
        passenger_id, flight_id, seat_number, class, price,
        meal_preference, special_requests, insurance, booking_reference,
        ticket_number, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        passenger_id,
        flight_id,
        seat_number,
        ticketClass,
        price,
        meal_preference,
        special_requests,
        insurance,
        booking_reference,
        ticketNumber,
        TicketStatus.ACTIVE,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update ticket
   */
  async updateTicket(
    ticket_id: number,
    updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto | null> {
    const fields = Object.keys(updateTicketDto).filter(
      key => updateTicketDto[key as keyof UpdateTicketDto] !== undefined,
    );

    if (fields.length === 0) {
      return this.findById(ticket_id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => updateTicketDto[field as keyof UpdateTicketDto]);

    const result = await this.databaseService.query<TicketResponseDto>(
      `UPDATE tickets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $1 RETURNING *`,
      [ticket_id, ...values],
    );
    return result.rows[0] || null;
  }

  /**
   * Check in passenger
   */
  async checkIn(checkInDto: CheckInDto): Promise<TicketResponseDto> {
    const { ticket_id, seat_number, meal_preference, special_requests } = checkInDto;

    const ticket = await this.findById(ticket_id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Ticket is not active for check-in');
    }

    // Check if check-in is available (typically 24 hours before departure)
    const flight = await this.databaseService.query(
      'SELECT scheduled_departure FROM flights WHERE flight_id = $1',
      [ticket.flight_id],
    );

    if (flight.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    const departureTime = new Date(flight.rows[0].scheduled_departure);
    const checkInTime = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    if (new Date() < checkInTime) {
      throw new BadRequestException('Check-in is not yet available');
    }

    // Generate boarding pass number
    const boardingPassNumber = await this.generateBoardingPassNumber();

    const result = await this.databaseService.query<TicketResponseDto>(
      `UPDATE tickets 
       SET 
         seat_number = COALESCE($1, seat_number),
         meal_preference = COALESCE($2, meal_preference),
         special_requests = COALESCE($3, special_requests),
         check_in_time = CURRENT_TIMESTAMP,
         boarding_pass_number = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $5
       RETURNING *`,
      [seat_number, meal_preference, special_requests, boardingPassNumber, ticket_id],
    );

    return result.rows[0];
  }

  /**
   * Select seat
   */
  async selectSeat(seatSelectionDto: SeatSelectionDto): Promise<TicketResponseDto> {
    const { ticket_id, seat_number, additional_fee = 0 } = seatSelectionDto;

    const ticket = await this.findById(ticket_id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check seat availability
    const seatAvailable = await this.checkSeatAvailability(ticket.flight_id, seat_number);
    if (!seatAvailable) {
      throw new ConflictException('Seat is not available');
    }

    // Update ticket with seat and additional fee
    const newPrice = ticket.price + additional_fee;

    const result = await this.databaseService.query<TicketResponseDto>(
      `UPDATE tickets 
       SET 
         seat_number = $1,
         price = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $3
       RETURNING *`,
      [seat_number, newPrice, ticket_id],
    );

    return result.rows[0];
  }

  /**
   * Cancel ticket
   */
  async cancelTicket(cancellationDto: TicketCancellationDto): Promise<TicketResponseDto> {
    const { ticket_id, reason, request_refund = false, alternative_flight } = cancellationDto;

    const ticket = await this.findById(ticket_id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket is already cancelled');
    }

    const result = await this.databaseService.query<TicketResponseDto>(
      `UPDATE tickets 
       SET 
         status = $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $2
       RETURNING *`,
      [TicketStatus.CANCELLED, ticket_id],
    );

    // Log cancellation
    await this.logTicketAction(ticket_id, 'cancellation', {
      reason,
      request_refund,
      alternative_flight,
    });

    return result.rows[0];
  }

  /**
   * Process ticket refund
   */
  async processRefund(refundDto: TicketRefundDto): Promise<TicketResponseDto> {
    const {
      ticket_id,
      reason,
      refund_percentage = 1.0,
      refund_method = 'original_payment',
    } = refundDto;

    const ticket = await this.findById(ticket_id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket must be cancelled before refund');
    }

    const refundAmount = ticket.price * refund_percentage;

    const result = await this.databaseService.query<TicketResponseDto>(
      `UPDATE tickets 
       SET 
         status = $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $2
       RETURNING *`,
      [TicketStatus.REFUNDED, ticket_id],
    );

    // Log refund
    await this.logTicketAction(ticket_id, 'refund', {
      reason,
      refund_amount: refundAmount,
      refund_percentage,
      refund_method,
    });

    return {
      ...result.rows[0],
      refund_amount: refundAmount,
    };
  }

  /**
   * Get seat availability for a flight
   */
  async getSeatAvailability(
    availabilityDto: SeatAvailabilityDto,
  ): Promise<SeatAvailabilityResponseDto> {
    const { flight_id, class: ticketClass, include_details = false } = availabilityDto;

    // Get aircraft capacity
    const aircraftResult = await this.databaseService.query(
      `
      SELECT a.capacity, a.model_name
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      WHERE f.flight_id = $1
    `,
      [flight_id],
    );

    if (aircraftResult.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    const capacity = aircraftResult.rows[0].capacity;

    // Get occupied seats
    const occupiedResult = await this.databaseService.query(
      `
      SELECT seat_number, class, price
      FROM tickets
      WHERE flight_id = $1 AND status = 'active' AND seat_number IS NOT NULL
    `,
      [flight_id],
    );

    const occupiedSeats = occupiedResult.rows;
    const totalOccupied = occupiedSeats.length;
    const totalAvailable = capacity - totalOccupied;

    // Calculate seats by class
    const seatsByClass: Record<
      TicketClass,
      { total: number; available: number; occupied: number; price: number }
    > = {
      [TicketClass.ECONOMY]: {
        total: Math.floor(capacity * 0.8),
        available: 0,
        occupied: 0,
        price: 0,
      },
      [TicketClass.BUSINESS]: {
        total: Math.floor(capacity * 0.15),
        available: 0,
        occupied: 0,
        price: 0,
      },
      [TicketClass.FIRST]: {
        total: Math.floor(capacity * 0.05),
        available: 0,
        occupied: 0,
        price: 0,
      },
    };

    // Count occupied seats by class
    occupiedSeats.forEach(seat => {
      if (seatsByClass[seat.class]) {
        seatsByClass[seat.class].occupied++;
      }
    });

    // Calculate available seats by class
    Object.keys(seatsByClass).forEach(classKey => {
      const ticketClass = classKey as TicketClass;
      seatsByClass[ticketClass].available =
        seatsByClass[ticketClass].total - seatsByClass[ticketClass].occupied;
    });

    const response: SeatAvailabilityResponseDto = {
      flight_id,
      total_seats: capacity,
      available_seats: totalAvailable,
      occupied_seats: totalOccupied,
      seats_by_class: seatsByClass,
    };

    if (include_details) {
      // Generate seat map (simplified)
      response.seat_map = [];
      for (let i = 1; i <= capacity; i++) {
        const seatNumber = `A${i}`;
        const occupiedSeat = occupiedSeats.find(s => s.seat_number === seatNumber);

        response.seat_map.push({
          seat_number: seatNumber,
          class: TicketClass.ECONOMY, // Simplified
          status: occupiedSeat ? 'occupied' : 'available',
          price: occupiedSeat?.price || 0,
        });
      }
    }

    return response;
  }

  /**
   * Check if seat is available
   */
  async checkSeatAvailability(flight_id: number, seat_number: string): Promise<boolean> {
    const result = await this.databaseService.query(
      `
      SELECT 1 FROM tickets 
      WHERE flight_id = $1 AND seat_number = $2 AND status = 'active'
    `,
      [flight_id, seat_number],
    );

    return result.rows.length === 0;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(statsDto: TicketStatisticsDto): Promise<TicketStatisticsResponseDto> {
    const { start_date, end_date, flight_id, passenger_id, group_by = 'day' } = statsDto;

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND t.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND t.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (flight_id) {
      whereClause += ` AND t.flight_id = $${paramIndex}`;
      params.push(flight_id);
      paramIndex++;
    }

    if (passenger_id) {
      whereClause += ` AND t.passenger_id = $${paramIndex}`;
      params.push(passenger_id);
      paramIndex++;
    }

    const query = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN t.status = 'active' THEN 1 END) as sold_tickets,
        COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_tickets,
        COUNT(CASE WHEN t.status = 'refunded' THEN 1 END) as refunded_tickets,
        SUM(CASE WHEN t.status = 'active' THEN t.price ELSE 0 END) as total_revenue,
        SUM(CASE WHEN t.status = 'refunded' THEN t.price ELSE 0 END) as refunded_amount,
        AVG(t.price) as average_ticket_price,
        COUNT(CASE WHEN t.check_in_time IS NOT NULL THEN 1 END) as checked_in_tickets
      FROM tickets t
      ${whereClause}
    `;

    const result = await this.databaseService.query(query, params);
    const stats = result.rows[0];

    // Get tickets by class
    const classQuery = `
      SELECT 
        t.class,
        COUNT(*) as count,
        SUM(t.price) as revenue
      FROM tickets t
      ${whereClause}
      GROUP BY t.class
    `;

    const classResult = await this.databaseService.query(classQuery, params);
    const ticketsByClass: Record<TicketClass, { count: number; revenue: number }> = {
      [TicketClass.ECONOMY]: { count: 0, revenue: 0 },
      [TicketClass.BUSINESS]: { count: 0, revenue: 0 },
      [TicketClass.FIRST]: { count: 0, revenue: 0 },
    };

    classResult.rows.forEach(row => {
      ticketsByClass[row.class] = {
        count: parseInt(row.count),
        revenue: parseFloat(row.revenue || '0'),
      };
    });

    // Get tickets by status
    const statusQuery = `
      SELECT 
        t.status,
        COUNT(*) as count
      FROM tickets t
      ${whereClause}
      GROUP BY t.status
    `;

    const statusResult = await this.databaseService.query(statusQuery, params);
    const ticketsByStatus: Record<TicketStatus, number> = {
      [TicketStatus.ACTIVE]: 0,
      [TicketStatus.CANCELLED]: 0,
      [TicketStatus.USED]: 0,
      [TicketStatus.REFUNDED]: 0,
    };

    statusResult.rows.forEach(row => {
      ticketsByStatus[row.status] = parseInt(row.count);
    });

    const totalTickets = parseInt(stats.total_tickets);
    const checkedInTickets = parseInt(stats.checked_in_tickets);
    const checkInRate = totalTickets > 0 ? (checkedInTickets / totalTickets) * 100 : 0;
    const noShowRate =
      totalTickets > 0 ? ((totalTickets - checkedInTickets) / totalTickets) * 100 : 0;

    return {
      period: group_by,
      total_tickets: totalTickets,
      sold_tickets: parseInt(stats.sold_tickets),
      cancelled_tickets: parseInt(stats.cancelled_tickets),
      refunded_tickets: parseInt(stats.refunded_tickets),
      total_revenue: parseFloat(stats.total_revenue || '0'),
      refunded_amount: parseFloat(stats.refunded_amount || '0'),
      net_revenue:
        parseFloat(stats.total_revenue || '0') - parseFloat(stats.refunded_amount || '0'),
      tickets_by_class: ticketsByClass,
      tickets_by_status: ticketsByStatus,
      average_ticket_price: parseFloat(stats.average_ticket_price || '0'),
      check_in_rate: checkInRate,
      no_show_rate: noShowRate,
    };
  }

  /**
   * Get ticket pricing
   */
  async getTicketPricing(pricingDto: TicketPricingDto): Promise<TicketPricingResponseDto> {
    const { flight_id, class: ticketClass, passenger_id, include_discounts = false } = pricingDto;

    // Get base flight price
    const flightResult = await this.databaseService.query(
      `
      SELECT price FROM flights WHERE flight_id = $1
    `,
      [flight_id],
    );

    if (flightResult.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    const basePrice = flightResult.rows[0].price;

    // Calculate class multiplier
    const classMultipliers = {
      [TicketClass.ECONOMY]: 1.0,
      [TicketClass.BUSINESS]: 2.5,
      [TicketClass.FIRST]: 5.0,
    };

    const baseFare = basePrice * classMultipliers[ticketClass];
    const taxes = baseFare * 0.1; // 10% tax
    const fees = baseFare * 0.05; // 5% fees
    const totalPrice = baseFare + taxes + fees;

    const pricing: TicketPricingResponseDto = {
      flight_id,
      class: ticketClass,
      base_price: baseFare,
      taxes,
      fees,
      discounts: 0,
      total_price: totalPrice,
      currency: 'USD',
      pricing_breakdown: {
        base_fare: baseFare,
        fuel_surcharge: baseFare * 0.02,
        airport_tax: taxes * 0.5,
        service_fee: fees,
        insurance_fee: 0,
        seat_fee: 0,
        meal_fee: 0,
      },
    };

    if (include_discounts && passenger_id) {
      // Check for passenger discounts (frequent flyer, etc.)
      const passengerResult = await this.databaseService.query(
        `
        SELECT frequent_flyer FROM passengers WHERE passenger_id = $1
      `,
        [passenger_id],
      );

      if (passengerResult.rows.length > 0 && passengerResult.rows[0].frequent_flyer) {
        const discount = totalPrice * 0.1; // 10% discount for frequent flyers
        pricing.discounts = discount;
        pricing.total_price = totalPrice - discount;
        pricing.available_discounts = [
          {
            type: 'frequent_flyer',
            description: 'Frequent Flyer Discount',
            amount: discount,
            percentage: 10,
          },
        ];
      }
    }

    return pricing;
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticket_id: number): Promise<boolean> {
    const result = await this.databaseService.query('DELETE FROM tickets WHERE ticket_id = $1', [
      ticket_id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Private helper methods
   */
  private async generateTicketNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TK${timestamp}${random}`;
  }

  private async generateBoardingPassNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `BP${timestamp}${random}`;
  }

  private async logTicketAction(ticket_id: number, action: string, details: any): Promise<void> {
    await this.databaseService.query(
      `
      INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, reason, created_at)
      VALUES ('tickets', $1, $2, '{}', $3, $4, CURRENT_TIMESTAMP)
    `,
      [ticket_id, action, JSON.stringify(details), details.reason || ''],
    );
  }
}
