import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateGateDto,
  UpdateGateDto,
  GateResponseDto,
  SearchGatesDto,
  GateStatisticsDto,
  GateStatisticsResponseDto,
  AutoAssignGateDto,
  ReleaseGateDto,
} from './dto/gate.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';
import { GateStatus } from '../shared/enums';

@Injectable()
export class GatesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new gate
   */
  async create(createGateDto: CreateGateDto): Promise<GateResponseDto> {
    const { gate_number, terminal_id } = createGateDto;

    // Check if gate already exists
    const existingGate = await this.databaseService.query(
      `
      SELECT gate_id FROM gates 
      WHERE gate_number = $1 AND terminal_id = $2
    `,
      [gate_number, terminal_id],
    );

    if (existingGate.rows.length > 0) {
      throw new ConflictException('Gate with this number already exists in this terminal');
    }

    // Verify terminal exists
    const terminalCheck = await this.databaseService.query(
      'SELECT terminal_id FROM terminals WHERE terminal_id = $1',
      [terminal_id],
    );

    if (terminalCheck.rows.length === 0) {
      throw new NotFoundException('Terminal not found');
    }

    const result = await this.databaseService.query<GateResponseDto>(
      `
      INSERT INTO gates (
        gate_number, terminal_id, status, description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [gate_number, terminal_id, createGateDto.status, createGateDto.description],
    );

    return await this.findById(result.rows[0].gate_id);
  }

  /**
   * Get all gates with pagination and filtering
   */
  async findAll(searchDto: SearchGatesDto): Promise<PaginatedResponse<GateResponseDto>> {
    const { page = 1, limit = 10, gate_number, terminal_id, airport_id, status } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (gate_number) {
      conditions.push(`g.gate_number ILIKE $${paramIndex}`);
      params.push(`%${gate_number}%`);
      paramIndex++;
    }

    if (terminal_id) {
      conditions.push(`g.terminal_id = $${paramIndex}`);
      params.push(terminal_id);
      paramIndex++;
    }

    if (airport_id) {
      conditions.push(`t.airport_id = $${paramIndex}`);
      params.push(airport_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`g.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      JOIN airports a ON t.airport_id = a.airport_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<GateResponseDto>(
      `
      SELECT 
        g.*,
        t.terminal_name,
        a.airport_name
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      JOIN airports a ON t.airport_id = a.airport_id
      ${whereClause}
      ORDER BY t.terminal_name, g.gate_number
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset],
    );

    // Get current flight info for each gate
    const gatesWithFlights = await Promise.all(
      result.rows.map(async (gate) => {
        const currentFlight = await this.getCurrentFlight(gate.gate_id);
        return {
          ...gate,
          current_flight: currentFlight,
        };
      }),
    );

    return {
      data: gatesWithFlights,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Get gate by ID
   */
  async findById(gate_id: number): Promise<GateResponseDto> {
    const result = await this.databaseService.query<GateResponseDto>(
      `
      SELECT 
        g.*,
        t.terminal_name,
        a.airport_name
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      JOIN airports a ON t.airport_id = a.airport_id
      WHERE g.gate_id = $1
    `,
      [gate_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Gate not found');
    }

    const gate = result.rows[0];
    const currentFlight = await this.getCurrentFlight(gate_id);

    return {
      ...gate,
      current_flight: currentFlight,
    };
  }

  /**
   * Update gate
   */
  async update(gate_id: number, updateGateDto: UpdateGateDto): Promise<GateResponseDto> {
    const existingGate = await this.findById(gate_id);

    // Check for conflicts if updating gate number or terminal
    if (updateGateDto.gate_number || updateGateDto.terminal_id) {
      const newGateNumber = updateGateDto.gate_number || existingGate.gate_number;
      const newTerminalId = updateGateDto.terminal_id || existingGate.terminal_id;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT gate_id FROM gates 
        WHERE gate_number = $1 AND terminal_id = $2 AND gate_id != $3
      `,
        [newGateNumber, newTerminalId, gate_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Gate with this number already exists in this terminal');
      }
    }

    // Verify terminal exists if updating
    if (updateGateDto.terminal_id) {
      const terminalCheck = await this.databaseService.query(
        'SELECT terminal_id FROM terminals WHERE terminal_id = $1',
        [updateGateDto.terminal_id],
      );

      if (terminalCheck.rows.length === 0) {
        throw new NotFoundException('Terminal not found');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateGateDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingGate;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(gate_id);

    const result = await this.databaseService.query<GateResponseDto>(
      `
      UPDATE gates 
      SET ${updateFields.join(', ')}
      WHERE gate_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].gate_id);
  }

  /**
   * Delete gate
   */
  async remove(gate_id: number): Promise<void> {
    const existingGate = await this.findById(gate_id);

    // Check if gate is currently assigned to a flight
    const flightCheck = await this.databaseService.query(
      `
      SELECT COUNT(*) as count FROM flights 
      WHERE gate_id = $1 AND status IN ('scheduled', 'boarding')
    `,
      [gate_id],
    );

    if (parseInt((flightCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete gate that is assigned to active flights');
    }

    await this.databaseService.query('DELETE FROM gates WHERE gate_id = $1', [gate_id]);
  }

  /**
   * Get gates by terminal
   */
  async findByTerminal(terminal_id: number): Promise<GateResponseDto[]> {
    const result = await this.databaseService.query<GateResponseDto>(
      `
      SELECT 
        g.*,
        t.terminal_name,
        a.airport_name
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      JOIN airports a ON t.airport_id = a.airport_id
      WHERE g.terminal_id = $1
      ORDER BY g.gate_number
    `,
      [terminal_id],
    );

    return result.rows;
  }

  /**
   * Get available gates for a terminal or airport
   */
  async getAvailableGates(terminal_id?: number, airport_id?: number): Promise<GateResponseDto[]> {
    let query = `
      SELECT 
        g.*,
        t.terminal_name,
        a.airport_name
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      JOIN airports a ON t.airport_id = a.airport_id
      WHERE g.status = 'available'
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (terminal_id) {
      query += ` AND g.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
      paramIndex++;
    } else if (airport_id) {
      query += ` AND t.airport_id = $${paramIndex}`;
      params.push(airport_id);
      paramIndex++;
    }

    query += ' ORDER BY t.terminal_name, g.gate_number';

    const result = await this.databaseService.query<GateResponseDto>(query, params);
    return result.rows;
  }

  /**
   * Auto-assign gate to flight
   */
  async autoAssignGate(autoAssignDto: AutoAssignGateDto): Promise<GateResponseDto> {
    const { flight_id, terminal_id } = autoAssignDto;

    // Get flight details
    const flightResult = await this.databaseService.query(
      `
      SELECT f.*, a.airport_id 
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      JOIN airports a ON r.departure_airport_id = a.airport_id
      WHERE f.flight_id = $1
    `,
      [flight_id],
    );

    if (flightResult.rows.length === 0) {
      throw new NotFoundException('Flight not found');
    }

    const flight = flightResult.rows[0];
    const airport_id = flight.airport_id;

    // Find available gates
    let availableGatesQuery = `
      SELECT g.* 
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      WHERE g.status = 'available' 
      AND t.airport_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM flights f2
        WHERE f2.gate_id = g.gate_id
        AND f2.status IN ('scheduled', 'boarding')
        AND f2.scheduled_departure BETWEEN $2 - INTERVAL '2 hours' AND $2 + INTERVAL '2 hours'
      )
    `;

    const params: unknown[] = [airport_id, flight.scheduled_departure];
    let paramIndex = 3;

    if (terminal_id) {
      availableGatesQuery += ` AND g.terminal_id = $${paramIndex}`;
      params.push(terminal_id);
    }

    availableGatesQuery += ' ORDER BY g.gate_id LIMIT 1';

    const gateResult = await this.databaseService.query(availableGatesQuery, params);

    if (gateResult.rows.length === 0) {
      throw new BadRequestException('No available gates found for this flight');
    }

    const assignedGate = gateResult.rows[0];

    // Update gate status
    await this.databaseService.query(
      `UPDATE gates SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE gate_id = $1`,
      [assignedGate.gate_id],
    );

    // Assign gate to flight
    await this.databaseService.query(
      `UPDATE flights SET gate_id = $1, updated_at = CURRENT_TIMESTAMP WHERE flight_id = $2`,
      [assignedGate.gate_id, flight_id],
    );

    return await this.findById(assignedGate.gate_id);
  }

  /**
   * Release gate
   */
  async releaseGate(releaseDto: ReleaseGateDto): Promise<GateResponseDto> {
    const { gate_id } = releaseDto;

    const gate = await this.findById(gate_id);

    // Update gate status to available
    await this.databaseService.query(
      `UPDATE gates SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE gate_id = $1`,
      [gate_id],
    );

    // Clear gate assignment from any completed flights
    await this.databaseService.query(
      `
      UPDATE flights 
      SET gate_id = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE gate_id = $1 AND status IN ('arrived', 'cancelled')
    `,
      [gate_id],
    );

    return await this.findById(gate_id);
  }

  /**
   * Get gate statistics
   */
  async getStatistics(statisticsDto: GateStatisticsDto): Promise<GateStatisticsResponseDto[]> {
    const { terminal_id, airport_id } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (terminal_id) {
      conditions.push(`g.terminal_id = $${paramIndex}`);
      params.push(terminal_id);
      paramIndex++;
    }

    if (airport_id) {
      conditions.push(`t.airport_id = $${paramIndex}`);
      params.push(airport_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<GateStatisticsResponseDto>(
      `
      SELECT 
        g.gate_id,
        g.gate_number,
        t.terminal_name,
        COUNT(f.flight_id) as total_flights_assigned,
        g.status as current_status,
        CASE 
          WHEN COUNT(f.flight_id) > 0 
          THEN ROUND(
            (COUNT(CASE WHEN f.status IN ('departed', 'arrived') THEN 1 END)::float / 
            COUNT(f.flight_id)::float) * 100, 2
          )
          ELSE 0 
        END as utilization_rate,
        COALESCE(AVG(
          CASE 
            WHEN f.actual_departure IS NOT NULL AND f.actual_arrival IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f.actual_arrival - f.actual_departure)) / 60
            ELSE NULL
          END
        ), 0) as average_turnaround_time
      FROM gates g
      JOIN terminals t ON g.terminal_id = t.terminal_id
      LEFT JOIN flights f ON g.gate_id = f.gate_id
      ${whereClause}
      GROUP BY g.gate_id, g.gate_number, t.terminal_name, g.status
      ORDER BY total_flights_assigned DESC
    `,
      params,
    );

    return result.rows;
  }

  /**
   * Private helper: Get current flight for a gate
   */
  private async getCurrentFlight(gate_id: number): Promise<any | null> {
    const result = await this.databaseService.query(
      `
      SELECT 
        f.flight_id,
        f.flight_number,
        f.scheduled_departure
      FROM flights f
      WHERE f.gate_id = $1 
      AND f.status IN ('scheduled', 'boarding')
      AND f.scheduled_departure >= CURRENT_TIMESTAMP - INTERVAL '2 hours'
      ORDER BY f.scheduled_departure
      LIMIT 1
    `,
      [gate_id],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

