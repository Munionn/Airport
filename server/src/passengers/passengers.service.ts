import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreatePassengerDto,
  UpdatePassengerDto,
  SearchPassengerDto,
  PassengerInfoDto,
  PassengerStatisticsDto,
  RegisterPassengerForFlightDto,
  PassengerFlightHistoryDto,
  PassengerResponseDto,
  PassengerStatisticsResponseDto,
} from './dto/passenger.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class PassengersService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all passengers with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<PassengerResponseDto>> {
    const result = await this.databaseService.queryPaginated<PassengerResponseDto>(
      'SELECT * FROM passengers ORDER BY created_at DESC',
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
   * Get passenger by ID
   */
  async findById(passenger_id: number): Promise<PassengerResponseDto | null> {
    const result = await this.databaseService.query<PassengerResponseDto>(
      'SELECT * FROM passengers WHERE passenger_id = $1',
      [passenger_id],
    );
    return result.rows[0] || null;
  }

  /**
   * Get passenger by passport number
   */
  async findByPassportNumber(passport_number: string): Promise<PassengerResponseDto | null> {
    const result = await this.databaseService.query<PassengerResponseDto>(
      'SELECT * FROM passengers WHERE passport_number = $1',
      [passport_number],
    );
    return result.rows[0] || null;
  }

  /**
   * Get passenger by email
   */
  async findByEmail(email: string): Promise<PassengerResponseDto | null> {
    const result = await this.databaseService.query<PassengerResponseDto>(
      'SELECT * FROM passengers WHERE email = $1',
      [email],
    );
    return result.rows[0] || null;
  }

  /**
   * Search passengers with advanced criteria
   */
  async searchPassengers(
    searchDto: SearchPassengerDto,
  ): Promise<PaginatedResponse<PassengerResponseDto>> {
    let query = 'SELECT * FROM passengers WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (searchDto.search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR passport_number ILIKE $${paramIndex})`;
      params.push(`%${searchDto.search}%`);
      paramIndex++;
    }

    if (searchDto.nationality) {
      query += ` AND nationality = $${paramIndex}`;
      params.push(searchDto.nationality);
      paramIndex++;
    }

    if (searchDto.passport_number) {
      query += ` AND passport_number = $${paramIndex}`;
      params.push(searchDto.passport_number);
      paramIndex++;
    }

    if (searchDto.email) {
      query += ` AND email = $${paramIndex}`;
      params.push(searchDto.email);
      paramIndex++;
    }

    if (searchDto.frequent_flyer !== undefined) {
      query += ` AND frequent_flyer = $${paramIndex}`;
      params.push(searchDto.frequent_flyer);
      paramIndex++;
    }

    if (searchDto.city) {
      query += ` AND city = $${paramIndex}`;
      params.push(searchDto.city);
      paramIndex++;
    }

    if (searchDto.country) {
      query += ` AND country = $${paramIndex}`;
      params.push(searchDto.country);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.databaseService.queryPaginated<PassengerResponseDto>(
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
   * Create a new passenger
   */
  async createPassenger(createPassengerDto: CreatePassengerDto): Promise<PassengerResponseDto> {
    const {
      first_name,
      last_name,
      email,
      phone,
      passport_number,
      nationality,
      date_of_birth,
      special_requirements,
    } = createPassengerDto;

    // Check if passenger with same passport already exists
    const existingPassenger = await this.findByPassportNumber(passport_number);
    if (existingPassenger) {
      throw new ConflictException('Passenger with this passport number already exists');
    }

    // Check if email is already in use
    if (email) {
      const existingEmail = await this.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Email is already in use');
      }
    }

    const result = await this.databaseService.query<PassengerResponseDto>(
      `INSERT INTO passengers (
        first_name, last_name, email, phone, passport_number, 
        nationality, date_of_birth, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        first_name,
        last_name,
        email,
        phone,
        passport_number,
        nationality,
        date_of_birth,
        special_requirements,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update passenger
   */
  async updatePassenger(
    passenger_id: number,
    updatePassengerDto: UpdatePassengerDto,
  ): Promise<PassengerResponseDto | null> {
    const fields = Object.keys(updatePassengerDto).filter(
      key => updatePassengerDto[key as keyof UpdatePassengerDto] !== undefined,
    );

    if (fields.length === 0) {
      return this.findById(passenger_id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(field => updatePassengerDto[field as keyof UpdatePassengerDto]);

    const result = await this.databaseService.query<PassengerResponseDto>(
      `UPDATE passengers SET ${setClause} WHERE passenger_id = $1 RETURNING *`,
      [passenger_id, ...values],
    );
    return result.rows[0] || null;
  }

  /**
   * Delete passenger
   */
  async deletePassenger(passenger_id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      'DELETE FROM passengers WHERE passenger_id = $1',
      [passenger_id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Register passenger for flight (from stored procedure)
   */
  async registerPassengerForFlight(registerDto: RegisterPassengerForFlightDto): Promise<any> {
    const { passenger_id, flight_id, seat_preference, meal_preference, special_requests } =
      registerDto;

    // Check if passenger exists
    const passenger = await this.findById(passenger_id);
    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    // Use stored procedure to register passenger
    const result = await this.databaseService.callProcedure('register_passenger_for_flight', [
      passenger_id,
      flight_id,
      seat_preference,
      meal_preference,
      special_requests,
    ]);

    return result.rows[0];
  }

  /**
   * Get passenger flight history
   */
  async getPassengerFlightHistory(historyDto: PassengerFlightHistoryDto): Promise<any[]> {
    const { passenger_id, start_date, end_date, status } = historyDto;

    let query = `
      SELECT 
        t.ticket_id,
        t.ticket_number,
        t.class,
        t.price,
        t.status as ticket_status,
        f.flight_number,
        f.scheduled_departure,
        f.scheduled_arrival,
        f.actual_departure,
        f.actual_arrival,
        f.status as flight_status,
        dep_airport.iata_code as departure_iata,
        dep_airport.airport_name as departure_airport,
        arr_airport.iata_code as arrival_iata,
        arr_airport.airport_name as arrival_airport,
        a.registration_number,
        a.model_name
      FROM tickets t
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      WHERE t.passenger_id = $1
    `;

    const params: unknown[] = [passenger_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND f.scheduled_departure >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND f.scheduled_departure <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY f.scheduled_departure DESC';

    const result = await this.databaseService.query(query, params);
    return result.rows;
  }

  /**
   * Get passenger statistics
   */
  async getPassengerStatistics(
    statsDto: PassengerStatisticsDto,
  ): Promise<PassengerStatisticsResponseDto> {
    const { start_date, end_date, nationality, group_by = 'nationality' } = statsDto;

    let whereClause = 'WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND p.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND p.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (nationality) {
      whereClause += ` AND p.nationality = $${paramIndex}`;
      params.push(nationality);
      paramIndex++;
    }

    const query = `
      SELECT 
        COUNT(*) as total_passengers,
        COUNT(CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_passengers,
        COUNT(CASE WHEN p.frequent_flyer = true THEN 1 END) as frequent_flyers,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM tickets t 
          WHERE t.passenger_id = p.passenger_id 
          AND t.status = 'used'
        ) THEN 1 END) as returning_passengers,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))) as average_age
      FROM passengers p
      ${whereClause}
    `;

    const result = await this.databaseService.query(query, params);
    const stats = result.rows[0];

    // Get nationality distribution
    const nationalityQuery = `
      SELECT nationality, COUNT(*) as count
      FROM passengers p
      ${whereClause}
      GROUP BY nationality
      ORDER BY count DESC
      LIMIT 10
    `;

    const nationalityResult = await this.databaseService.query(nationalityQuery, params);
    const passengersByNationality: Record<string, number> = {};
    nationalityResult.rows.forEach(row => {
      passengersByNationality[row.nationality] = parseInt(row.count);
    });

    // Get country distribution
    const countryQuery = `
      SELECT country, COUNT(*) as count
      FROM passengers p
      ${whereClause}
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    const countryResult = await this.databaseService.query(countryQuery, params);
    const passengersByCountry: Record<string, number> = {};
    countryResult.rows.forEach(row => {
      passengersByCountry[row.country] = parseInt(row.count);
    });

    // Get top cities
    const cityQuery = `
      SELECT city, COUNT(*) as passenger_count
      FROM passengers p
      ${whereClause}
      WHERE city IS NOT NULL
      GROUP BY city
      ORDER BY passenger_count DESC
      LIMIT 10
    `;

    const cityResult = await this.databaseService.query(cityQuery, params);

    return {
      period: group_by,
      total_passengers: parseInt(stats.total_passengers),
      new_passengers: parseInt(stats.new_passengers),
      returning_passengers: parseInt(stats.returning_passengers),
      frequent_flyers: parseInt(stats.frequent_flyers),
      passengers_by_nationality: passengersByNationality,
      passengers_by_country: passengersByCountry,
      average_age: parseFloat(stats.average_age || '0'),
      top_cities: cityResult.rows,
      loyalty_distribution: {
        frequent_flyers: parseInt(stats.frequent_flyers),
        regular_passengers: parseInt(stats.total_passengers) - parseInt(stats.frequent_flyers),
      },
    };
  }

  /**
   * Get European passengers (from query pool)
   */
  async getEuropeanPassengers(): Promise<any[]> {
    const result = await this.databaseService.query(`
      SELECT 
        p.passenger_id,
        p.first_name,
        p.last_name,
        p.nationality,
        p.country,
        COUNT(t.ticket_id) as total_flights,
        SUM(t.price) as total_spent
      FROM passengers p
      LEFT JOIN tickets t ON p.passenger_id = t.passenger_id
      WHERE p.nationality IN (
        'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium',
        'Austria', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland',
        'Poland', 'Czech Republic', 'Hungary', 'Portugal', 'Greece',
        'Ireland', 'Luxembourg', 'Slovenia', 'Slovakia', 'Estonia',
        'Latvia', 'Lithuania', 'Malta', 'Cyprus', 'Croatia', 'Romania',
        'Bulgaria', 'United Kingdom'
      )
      GROUP BY p.passenger_id, p.first_name, p.last_name, p.nationality, p.country
      ORDER BY total_flights DESC, total_spent DESC
    `);

    return result.rows;
  }

  /**
   * Get passenger info with flight history (from stored procedure)
   */
  async getPassengerInfoWithHistory(passenger_id: number): Promise<any> {
    const result = await this.databaseService.callProcedure(
      'get_passenger_info_with_flight_history',
      [passenger_id],
    );

    return result.rows[0];
  }

  /**
   * Get comprehensive passenger details
   */
  async getPassengerDetails(passenger_id: number): Promise<PassengerResponseDto> {
    const passenger = await this.findById(passenger_id);
    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    // Get additional statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(t.ticket_id) as total_flights,
        SUM(CASE WHEN t.status = 'used' THEN 1 ELSE 0 END) as completed_flights,
        SUM(t.price) as total_spent,
        MAX(f.scheduled_departure) as last_flight_date
      FROM tickets t
      LEFT JOIN flights f ON t.flight_id = f.flight_id
      WHERE t.passenger_id = $1
    `,
      [passenger_id],
    );

    const stats = statsResult.rows[0];

    return {
      ...passenger,
      total_flights: parseInt(stats.total_flights || '0'),
      total_distance: 0, // Would need route distance calculation
      loyalty_points: passenger.frequent_flyer ? parseInt(stats.total_flights || '0') * 100 : 0,
      last_flight_date: stats.last_flight_date,
    };
  }
}
