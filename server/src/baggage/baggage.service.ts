import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateBaggageDto,
  UpdateBaggageDto,
  BaggageResponseDto,
  SearchBaggageDto,
  BaggageStatisticsDto,
  BaggageStatisticsResponseDto,
  TrackBaggageDto,
  TrackBaggageResponseDto,
  UpdateBaggageStatusDto,
} from './dto/baggage.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';
import { BaggageStatus } from '../shared/enums';

@Injectable()
export class BaggageService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create/Register new baggage
   */
  async create(createBaggageDto: CreateBaggageDto): Promise<BaggageResponseDto> {
    const { baggage_tag, ticket_id, flight_id, passenger_id } = createBaggageDto;

    // Check if baggage tag already exists
    const existingBaggage = await this.databaseService.query(
      'SELECT baggage_id FROM baggage WHERE baggage_tag = $1',
      [baggage_tag],
    );

    if (existingBaggage.rows.length > 0) {
      throw new ConflictException('Baggage with this tag already exists');
    }

    // Verify ticket exists
    const ticketCheck = await this.databaseService.query(
      'SELECT ticket_id FROM tickets WHERE ticket_id = $1',
      [ticket_id],
    );

    if (ticketCheck.rows.length === 0) {
      throw new NotFoundException('Ticket not found');
    }

    // Verify flight exists
    const flightCheck = await this.databaseService.query(
      'SELECT flight_id FROM flights WHERE flight_id = $1',
      [flight_id],
    );

    if (flightCheck.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    // Verify passenger exists
    const passengerCheck = await this.databaseService.query(
      'SELECT passenger_id FROM passengers WHERE passenger_id = $1',
      [passenger_id],
    );

    if (passengerCheck.rows.length === 0) {
      throw new NotFoundException('Passenger not found');
    }

    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      INSERT INTO baggage (
        ticket_id, flight_id, passenger_id, baggage_tag, weight, status, 
        special_handling, notes, checked_in_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `,
      [
        ticket_id,
        flight_id,
        passenger_id,
        baggage_tag,
        createBaggageDto.weight,
        createBaggageDto.status || BaggageStatus.CHECKED_IN,
        createBaggageDto.special_handling,
        createBaggageDto.notes,
      ],
    );

    return await this.findById(result.rows[0].baggage_id);
  }

  /**
   * Get all baggage with pagination and filtering
   */
  async findAll(searchDto: SearchBaggageDto): Promise<PaginatedResponse<BaggageResponseDto>> {
    const { page = 1, limit = 10, baggage_tag, ticket_id, flight_id, passenger_id, status } =
      searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (baggage_tag) {
      conditions.push(`b.baggage_tag ILIKE $${paramIndex}`);
      params.push(`%${baggage_tag}%`);
      paramIndex++;
    }

    if (ticket_id) {
      conditions.push(`b.ticket_id = $${paramIndex}`);
      params.push(ticket_id);
      paramIndex++;
    }

    if (flight_id) {
      conditions.push(`b.flight_id = $${paramIndex}`);
      params.push(flight_id);
      paramIndex++;
    }

    if (passenger_id) {
      conditions.push(`b.passenger_id = $${paramIndex}`);
      params.push(passenger_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM baggage b ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      SELECT 
        b.*,
        t.ticket_number,
        f.flight_number,
        p.first_name || ' ' || p.last_name as passenger_name
      FROM baggage b
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN passengers p ON b.passenger_id = p.passenger_id
      ${whereClause}
      ORDER BY b.created_at DESC
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
   * Get baggage by ID
   */
  async findById(baggage_id: number): Promise<BaggageResponseDto> {
    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      SELECT 
        b.*,
        t.ticket_number,
        f.flight_number,
        p.first_name || ' ' || p.last_name as passenger_name
      FROM baggage b
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN passengers p ON b.passenger_id = p.passenger_id
      WHERE b.baggage_id = $1
    `,
      [baggage_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Baggage not found');
    }

    return result.rows[0];
  }

  /**
   * Get baggage by tag
   */
  async findByTag(baggage_tag: string): Promise<BaggageResponseDto> {
    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      SELECT 
        b.*,
        t.ticket_number,
        f.flight_number,
        p.first_name || ' ' || p.last_name as passenger_name
      FROM baggage b
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN passengers p ON b.passenger_id = p.passenger_id
      WHERE b.baggage_tag = $1
    `,
      [baggage_tag],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Baggage not found');
    }

    return result.rows[0];
  }

  /**
   * Update baggage
   */
  async update(
    baggage_id: number,
    updateBaggageDto: UpdateBaggageDto,
  ): Promise<BaggageResponseDto> {
    const existingBaggage = await this.findById(baggage_id);

    // Check for conflicts if updating baggage tag
    if (updateBaggageDto.baggage_tag) {
      const conflictCheck = await this.databaseService.query(
        'SELECT baggage_id FROM baggage WHERE baggage_tag = $1 AND baggage_id != $2',
        [updateBaggageDto.baggage_tag, baggage_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Baggage with this tag already exists');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateBaggageDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingBaggage;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(baggage_id);

    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      UPDATE baggage 
      SET ${updateFields.join(', ')}
      WHERE baggage_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].baggage_id);
  }

  /**
   * Update baggage status (with trigger logic)
   */
  async updateStatus(updateStatusDto: UpdateBaggageStatusDto): Promise<BaggageResponseDto> {
    const { baggage_id, status, location, notes } = updateStatusDto;

    const baggage = await this.findById(baggage_id);

    // Update status with timestamps based on status
    let timestampField = '';
    switch (status) {
      case BaggageStatus.CHECKED_IN:
        timestampField = 'checked_in_at = CURRENT_TIMESTAMP,';
        break;
      case BaggageStatus.LOADED:
        timestampField = 'loaded_at = CURRENT_TIMESTAMP,';
        break;
      case BaggageStatus.UNLOADED:
        timestampField = 'unloaded_at = CURRENT_TIMESTAMP,';
        break;
      case BaggageStatus.DELIVERED:
        timestampField = 'delivered_at = CURRENT_TIMESTAMP,';
        break;
    }

    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      UPDATE baggage 
      SET 
        status = $1,
        ${timestampField}
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE baggage_id = $3
      RETURNING *
    `,
      [status, notes, baggage_id],
    );

    // Log status change
    await this.logStatusChange(baggage_id, status, location, notes);

    return await this.findById(result.rows[0].baggage_id);
  }

  /**
   * Delete baggage
   */
  async remove(baggage_id: number): Promise<void> {
    const existingBaggage = await this.findById(baggage_id);

    // Check if baggage is in transit
    if (existingBaggage.status === BaggageStatus.LOADED) {
      throw new BadRequestException('Cannot delete baggage that is currently loaded on a flight');
    }

    await this.databaseService.query('DELETE FROM baggage WHERE baggage_id = $1', [baggage_id]);
  }

  /**
   * Track baggage by tag
   */
  async trackBaggage(trackDto: TrackBaggageDto): Promise<TrackBaggageResponseDto> {
    const baggage = await this.findByTag(trackDto.baggage_tag);

    // Get flight details
    const flightResult = await this.databaseService.query(
      `
      SELECT 
        f.flight_number,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        f.scheduled_arrival
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      WHERE f.flight_id = $1
    `,
      [baggage.flight_id],
    );

    const flight = flightResult.rows[0];

    // Get status history from audit logs
    const historyResult = await this.databaseService.query(
      `
      SELECT 
        (new_values->>'status')::text as status,
        created_at as timestamp,
        reason as location
      FROM audit_logs
      WHERE table_name = 'baggage' 
      AND record_id = $1
      AND action = 'status_change'
      ORDER BY created_at ASC
    `,
      [baggage.baggage_id],
    );

    const statusHistory = historyResult.rows.map((row) => ({
      status: row.status as BaggageStatus,
      timestamp: row.timestamp,
      location: row.location,
    }));

    // Determine current location based on status
    let currentLocation = '';
    switch (baggage.status) {
      case BaggageStatus.CHECKED_IN:
        currentLocation = `Check-in counter at ${flight.departure_airport}`;
        break;
      case BaggageStatus.LOADED:
        currentLocation = `On flight ${flight.flight_number}`;
        break;
      case BaggageStatus.UNLOADED:
        currentLocation = `Baggage claim at ${flight.arrival_airport}`;
        break;
      case BaggageStatus.DELIVERED:
        currentLocation = `Delivered at ${flight.arrival_airport}`;
        break;
      case BaggageStatus.LOST:
        currentLocation = 'Lost - contact airline';
        break;
    }

    return {
      baggage_id: baggage.baggage_id,
      baggage_tag: baggage.baggage_tag,
      passenger_name: baggage.passenger_name || '',
      flight_number: flight.flight_number,
      departure_airport: flight.departure_airport,
      arrival_airport: flight.arrival_airport,
      status: baggage.status,
      status_history: statusHistory,
      current_location: currentLocation,
      estimated_delivery: flight.scheduled_arrival,
    };
  }

  /**
   * Get baggage statistics
   */
  async getStatistics(
    statisticsDto: BaggageStatisticsDto,
  ): Promise<BaggageStatisticsResponseDto> {
    const { flight_id, airport_id, status } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (flight_id) {
      conditions.push(`b.flight_id = $${paramIndex}`);
      params.push(flight_id);
      paramIndex++;
    }

    if (airport_id) {
      conditions.push(`(r.departure_airport_id = $${paramIndex} OR r.arrival_airport_id = $${paramIndex})`);
      params.push(airport_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query(
      `
      SELECT 
        COUNT(*) as total_baggage,
        COUNT(CASE WHEN b.status = 'checked_in' THEN 1 END) as checked_in,
        COUNT(CASE WHEN b.status = 'loaded' THEN 1 END) as loaded,
        COUNT(CASE WHEN b.status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN b.status = 'lost' THEN 1 END) as lost,
        AVG(b.weight) as average_weight,
        SUM(b.weight) as total_weight,
        COUNT(CASE WHEN b.special_handling IS NOT NULL THEN 1 END) as special_handling_count,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((COUNT(CASE WHEN b.status = 'lost' THEN 1 END)::float / COUNT(*)::float) * 100, 2)
          ELSE 0 
        END as lost_percentage
      FROM baggage b
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN routes r ON f.route_id = r.route_id
      ${whereClause}
    `,
      params,
    );

    const stats = result.rows[0];

    return {
      period: 'all_time',
      total_baggage: parseInt(stats.total_baggage),
      checked_in: parseInt(stats.checked_in),
      loaded: parseInt(stats.loaded),
      delivered: parseInt(stats.delivered),
      lost: parseInt(stats.lost),
      average_weight: parseFloat(stats.average_weight || '0'),
      total_weight: parseFloat(stats.total_weight || '0'),
      special_handling_count: parseInt(stats.special_handling_count),
      lost_percentage: parseFloat(stats.lost_percentage || '0'),
    };
  }

  /**
   * Get baggage by flight
   */
  async findByFlight(flight_id: number): Promise<BaggageResponseDto[]> {
    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      SELECT 
        b.*,
        t.ticket_number,
        f.flight_number,
        p.first_name || ' ' || p.last_name as passenger_name
      FROM baggage b
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN passengers p ON b.passenger_id = p.passenger_id
      WHERE b.flight_id = $1
      ORDER BY b.created_at
    `,
      [flight_id],
    );

    return result.rows;
  }

  /**
   * Get baggage by passenger
   */
  async findByPassenger(passenger_id: number): Promise<BaggageResponseDto[]> {
    const result = await this.databaseService.query<BaggageResponseDto>(
      `
      SELECT 
        b.*,
        t.ticket_number,
        f.flight_number,
        p.first_name || ' ' || p.last_name as passenger_name
      FROM baggage b
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN flights f ON b.flight_id = f.flight_id
      JOIN passengers p ON b.passenger_id = p.passenger_id
      WHERE b.passenger_id = $1
      ORDER BY b.created_at DESC
    `,
      [passenger_id],
    );

    return result.rows;
  }

  /**
   * Private helper: Log status change
   */
  private async logStatusChange(
    baggage_id: number,
    status: BaggageStatus,
    location?: string,
    notes?: string,
  ): Promise<void> {
    await this.databaseService.query(
      `
      INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, reason, created_at)
      VALUES ('baggage', $1, 'status_change', '{}', $2, $3, CURRENT_TIMESTAMP)
    `,
      [baggage_id, JSON.stringify({ status }), location || notes || ''],
    );
  }
}

