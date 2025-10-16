import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateTerminalDto,
  UpdateTerminalDto,
  TerminalResponseDto,
  SearchTerminalsDto,
  TerminalStatisticsDto,
  TerminalStatisticsResponseDto,
} from './dto/terminal.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class TerminalsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new terminal
   */
  async create(createTerminalDto: CreateTerminalDto): Promise<TerminalResponseDto> {
    const { terminal_name, airport_id } = createTerminalDto;

    // Check if terminal already exists
    const existingTerminal = await this.databaseService.query(
      `
      SELECT terminal_id FROM terminals 
      WHERE terminal_name = $1 AND airport_id = $2
    `,
      [terminal_name, airport_id],
    );

    if (existingTerminal.rows.length > 0) {
      throw new ConflictException('Terminal with this name already exists at this airport');
    }

    // Verify airport exists
    const airportCheck = await this.databaseService.query(
      'SELECT airport_id FROM airports WHERE airport_id = $1',
      [airport_id],
    );

    if (airportCheck.rows.length === 0) {
      throw new NotFoundException('Airport not found');
    }

    const result = await this.databaseService.query<TerminalResponseDto>(
      `
      INSERT INTO terminals (
        terminal_name, airport_id, status, description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [terminal_name, airport_id, createTerminalDto.status, createTerminalDto.description],
    );

    return await this.findById(result.rows[0].terminal_id);
  }

  /**
   * Get all terminals with pagination and filtering
   */
  async findAll(searchDto: SearchTerminalsDto): Promise<PaginatedResponse<TerminalResponseDto>> {
    const { page = 1, limit = 10, terminal_name, airport_id, status } = searchDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (terminal_name) {
      conditions.push(`t.terminal_name ILIKE $${paramIndex}`);
      params.push(`%${terminal_name}%`);
      paramIndex++;
    }

    if (airport_id) {
      conditions.push(`t.airport_id = $${paramIndex}`);
      params.push(airport_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM terminals t
      JOIN airports a ON t.airport_id = a.airport_id
      ${whereClause}
    `,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<TerminalResponseDto>(
      `
      SELECT 
        t.*,
        a.airport_name,
        a.iata_code,
        COUNT(g.gate_id) as gate_count
      FROM terminals t
      JOIN airports a ON t.airport_id = a.airport_id
      LEFT JOIN gates g ON t.terminal_id = g.terminal_id
      ${whereClause}
      GROUP BY t.terminal_id, a.airport_name, a.iata_code
      ORDER BY t.terminal_name
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
   * Get terminal by ID
   */
  async findById(terminal_id: number): Promise<TerminalResponseDto> {
    const result = await this.databaseService.query<TerminalResponseDto>(
      `
      SELECT 
        t.*,
        a.airport_name,
        a.iata_code,
        COUNT(g.gate_id) as gate_count
      FROM terminals t
      JOIN airports a ON t.airport_id = a.airport_id
      LEFT JOIN gates g ON t.terminal_id = g.terminal_id
      WHERE t.terminal_id = $1
      GROUP BY t.terminal_id, a.airport_name, a.iata_code
    `,
      [terminal_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Terminal not found');
    }

    return result.rows[0];
  }

  /**
   * Update terminal
   */
  async update(
    terminal_id: number,
    updateTerminalDto: UpdateTerminalDto,
  ): Promise<TerminalResponseDto> {
    const existingTerminal = await this.findById(terminal_id);

    // Check for conflicts if updating name or airport
    if (updateTerminalDto.terminal_name || updateTerminalDto.airport_id) {
      const newName = updateTerminalDto.terminal_name || existingTerminal.terminal_name;
      const newAirportId = updateTerminalDto.airport_id || existingTerminal.airport_id;

      const conflictCheck = await this.databaseService.query(
        `
        SELECT terminal_id FROM terminals 
        WHERE terminal_name = $1 AND airport_id = $2 AND terminal_id != $3
      `,
        [newName, newAirportId, terminal_id],
      );

      if (conflictCheck.rows.length > 0) {
        throw new ConflictException('Terminal with this name already exists at this airport');
      }
    }

    // Verify airport exists if updating
    if (updateTerminalDto.airport_id) {
      const airportCheck = await this.databaseService.query(
        'SELECT airport_id FROM airports WHERE airport_id = $1',
        [updateTerminalDto.airport_id],
      );

      if (airportCheck.rows.length === 0) {
        throw new NotFoundException('Airport not found');
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(updateTerminalDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return existingTerminal;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(terminal_id);

    const result = await this.databaseService.query<TerminalResponseDto>(
      `
      UPDATE terminals 
      SET ${updateFields.join(', ')}
      WHERE terminal_id = $${paramIndex}
      RETURNING *
    `,
      params,
    );

    return await this.findById(result.rows[0].terminal_id);
  }

  /**
   * Delete terminal
   */
  async remove(terminal_id: number): Promise<void> {
    const existingTerminal = await this.findById(terminal_id);

    // Check if terminal has gates
    const gateCheck = await this.databaseService.query(
      'SELECT COUNT(*) as count FROM gates WHERE terminal_id = $1',
      [terminal_id],
    );

    if (parseInt((gateCheck.rows[0] as { count: string }).count) > 0) {
      throw new ConflictException('Cannot delete terminal that has gates');
    }

    await this.databaseService.query('DELETE FROM terminals WHERE terminal_id = $1', [terminal_id]);
  }

  /**
   * Get terminals by airport
   */
  async findByAirport(airport_id: number): Promise<TerminalResponseDto[]> {
    const result = await this.databaseService.query<TerminalResponseDto>(
      `
      SELECT 
        t.*,
        a.airport_name,
        a.iata_code,
        COUNT(g.gate_id) as gate_count
      FROM terminals t
      JOIN airports a ON t.airport_id = a.airport_id
      LEFT JOIN gates g ON t.terminal_id = g.terminal_id
      WHERE t.airport_id = $1
      GROUP BY t.terminal_id, a.airport_name, a.iata_code
      ORDER BY t.terminal_name
    `,
      [airport_id],
    );

    return result.rows;
  }

  /**
   * Get terminal statistics
   */
  async getStatistics(
    statisticsDto: TerminalStatisticsDto,
  ): Promise<TerminalStatisticsResponseDto[]> {
    const { airport_id, status } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (airport_id) {
      conditions.push(`t.airport_id = $${paramIndex}`);
      params.push(airport_id);
      paramIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.databaseService.query<TerminalStatisticsResponseDto>(
      `
      SELECT 
        t.terminal_id,
        t.terminal_name,
        a.airport_name,
        COUNT(DISTINCT g.gate_id) as total_gates,
        COUNT(DISTINCT CASE WHEN g.status = 'available' THEN g.gate_id END) as available_gates,
        COUNT(DISTINCT CASE WHEN g.status = 'occupied' THEN g.gate_id END) as occupied_gates,
        COUNT(CASE 
          WHEN f.scheduled_departure::date = CURRENT_DATE THEN f.flight_id 
        END) as total_flights_today,
        CASE 
          WHEN COUNT(DISTINCT g.gate_id) > 0 
          THEN ROUND(
            (COUNT(DISTINCT CASE WHEN g.status = 'occupied' THEN g.gate_id END)::float / 
            COUNT(DISTINCT g.gate_id)::float) * 100, 2
          )
          ELSE 0 
        END as average_gate_utilization,
        t.status
      FROM terminals t
      JOIN airports a ON t.airport_id = a.airport_id
      LEFT JOIN gates g ON t.terminal_id = g.terminal_id
      LEFT JOIN flights f ON g.gate_id = f.gate_id
      ${whereClause}
      GROUP BY t.terminal_id, t.terminal_name, a.airport_name, t.status
      ORDER BY total_flights_today DESC
    `,
      params,
    );

    return result.rows;
  }
}
