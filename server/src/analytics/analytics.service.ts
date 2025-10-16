import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  FlightAnalyticsDto,
  FlightAnalyticsResponseDto,
  RevenueAnalyticsDto,
  RevenueAnalyticsResponseDto,
  PassengerAnalyticsDto,
  PassengerAnalyticsResponseDto,
  OperationalAnalyticsDto,
  OperationalAnalyticsResponseDto,
  DelayAnalyticsDto,
  DelayAnalyticsResponseDto,
  DashboardAnalyticsDto,
  DashboardAnalyticsResponseDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get flight analytics
   */
  async getFlightAnalytics(analyticsDto: FlightAnalyticsDto): Promise<FlightAnalyticsResponseDto> {
    const { date_from, date_to, period = 'month', airport_id, route_id, aircraft_id } = analyticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`f.scheduled_departure >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`f.scheduled_departure <= $${paramIndex}`);
      params.push(date_to);
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

    // Get basic flight statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(*) as total_flights,
        COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
        COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancelled_flights,
        COUNT(CASE WHEN f.status = 'delayed' THEN 1 END) as delayed_flights,
        COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
        AVG(CASE WHEN f.actual_departure IS NOT NULL AND f.scheduled_departure IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 
            ELSE 0 END) as average_delay_minutes,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue,
        AVG(calculate_flight_load(f.flight_id)) as average_load_factor,
        COALESCE(SUM((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as passenger_count
      FROM flights f
      ${whereClause}
    `,
      params,
    );

    const stats = statsResult.rows[0];
    const totalFlights = parseInt(stats.total_flights);
    const onTimeFlights = parseInt(stats.on_time_flights);
    const onTimePerformance = totalFlights > 0 ? (onTimeFlights / totalFlights) * 100 : 0;

    // Get revenue by class
    const revenueByClassResult = await this.databaseService.query(
      `
      SELECT 
        t.class,
        SUM(t.price) as revenue
      FROM flights f
      JOIN tickets t ON f.flight_id = t.flight_id
      WHERE t.status = 'active'
      ${whereClause.replace('f.', 'f.')}
      GROUP BY t.class
    `,
      params,
    );

    const revenueByClass: Record<string, number> = {};
    revenueByClassResult.rows.forEach((row) => {
      revenueByClass[row.class] = parseFloat(row.revenue || '0');
    });

    // Get performance by route
    const routePerformanceResult = await this.databaseService.query(
      `
      SELECT 
        r.route_id,
        r.route_name,
        dep_airport.iata_code as departure_airport,
        arr_airport.iata_code as arrival_airport,
        COUNT(f.flight_id) as flight_count,
        ROUND(
          (COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END)::float / 
          COUNT(f.flight_id)::float) * 100, 2
        ) as on_time_percentage,
        AVG(calculate_flight_load(f.flight_id)) as average_load_factor,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      ${whereClause}
      GROUP BY r.route_id, r.route_name, dep_airport.iata_code, arr_airport.iata_code
      ORDER BY flight_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get performance by aircraft
    const aircraftPerformanceResult = await this.databaseService.query(
      `
      SELECT 
        a.aircraft_id,
        a.registration_number,
        am.model_name,
        COUNT(f.flight_id) as flight_count,
        ROUND(
          (COUNT(f.flight_id)::float / EXTRACT(DAYS FROM AGE(CURRENT_DATE, a.purchase_date)))::float * 100, 2
        ) as utilization_rate,
        AVG(calculate_flight_load(f.flight_id)) as average_load_factor,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      JOIN aircraft_models am ON a.model_id = am.model_id
      ${whereClause}
      GROUP BY a.aircraft_id, a.registration_number, am.model_name, a.purchase_date
      ORDER BY flight_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get daily metrics
    const dailyMetricsResult = await this.databaseService.query(
      `
      SELECT 
        DATE(f.scheduled_departure) as date,
        COUNT(f.flight_id) as flights,
        COALESCE(SUM((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as passengers,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as revenue,
        AVG(calculate_flight_load(f.flight_id)) as load_factor
      FROM flights f
      ${whereClause}
      GROUP BY DATE(f.scheduled_departure)
      ORDER BY date DESC
      LIMIT 30
    `,
      params,
    );

    return {
      period,
      total_flights: totalFlights,
      completed_flights: parseInt(stats.completed_flights),
      cancelled_flights: parseInt(stats.cancelled_flights),
      delayed_flights: parseInt(stats.delayed_flights),
      on_time_performance: onTimePerformance,
      average_delay_minutes: parseFloat(stats.average_delay_minutes || '0'),
      total_revenue: parseFloat(stats.total_revenue || '0'),
      average_load_factor: parseFloat(stats.average_load_factor || '0'),
      passenger_count: parseInt(stats.passenger_count),
      revenue_by_class: revenueByClass,
      performance_by_route: routePerformanceResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        departure_airport: row.departure_airport,
        arrival_airport: row.arrival_airport,
        flight_count: parseInt(row.flight_count),
        on_time_percentage: parseFloat(row.on_time_percentage || '0'),
        average_load_factor: parseFloat(row.average_load_factor || '0'),
        total_revenue: parseFloat(row.total_revenue || '0'),
      })),
      performance_by_aircraft: aircraftPerformanceResult.rows.map((row) => ({
        aircraft_id: row.aircraft_id,
        registration_number: row.registration_number,
        model_name: row.model_name,
        flight_count: parseInt(row.flight_count),
        utilization_rate: parseFloat(row.utilization_rate || '0'),
        average_load_factor: parseFloat(row.average_load_factor || '0'),
        total_revenue: parseFloat(row.total_revenue || '0'),
      })),
      daily_metrics: dailyMetricsResult.rows.map((row) => ({
        date: row.date,
        flights: parseInt(row.flights),
        passengers: parseInt(row.passengers),
        revenue: parseFloat(row.revenue || '0'),
        load_factor: parseFloat(row.load_factor || '0'),
      })),
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(analyticsDto: RevenueAnalyticsDto): Promise<RevenueAnalyticsResponseDto> {
    const { date_from, date_to, period = 'month', breakdown_by = 'route' } = analyticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`f.scheduled_departure >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`f.scheduled_departure <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic revenue statistics
    const revenueResult = await this.databaseService.query(
      `
      SELECT 
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue,
        AVG(t.price) as average_ticket_price
      FROM flights f
      LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
      ${whereClause}
    `,
      params,
    );

    const revenue = revenueResult.rows[0];
    const totalRevenue = parseFloat(revenue.total_revenue || '0');

    // Get revenue by class
    const classRevenueResult = await this.databaseService.query(
      `
      SELECT 
        t.class,
        SUM(t.price) as revenue
      FROM flights f
      JOIN tickets t ON f.flight_id = t.flight_id
      WHERE t.status = 'active'
      ${whereClause.replace('f.', 'f.')}
      GROUP BY t.class
    `,
      params,
    );

    const revenueByClass: Record<string, number> = {};
    classRevenueResult.rows.forEach((row) => {
      revenueByClass[row.class] = parseFloat(row.revenue || '0');
    });

    // Get revenue by route
    const routeRevenueResult = await this.databaseService.query(
      `
      SELECT 
        r.route_id,
        r.route_name,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as revenue
      FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      ${whereClause}
      GROUP BY r.route_id, r.route_name
      ORDER BY revenue DESC
      LIMIT 10
    `,
      params,
    );

    const totalRouteRevenue = routeRevenueResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue || '0'), 0);

    // Get revenue by aircraft
    const aircraftRevenueResult = await this.databaseService.query(
      `
      SELECT 
        a.aircraft_id,
        a.registration_number,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as revenue
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      ${whereClause}
      GROUP BY a.aircraft_id, a.registration_number
      ORDER BY revenue DESC
      LIMIT 10
    `,
      params,
    );

    const totalAircraftRevenue = aircraftRevenueResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue || '0'), 0);

    // Get monthly revenue
    const monthlyRevenueResult = await this.databaseService.query(
      `
      SELECT 
        TO_CHAR(f.scheduled_departure, 'YYYY-MM') as month,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as revenue
      FROM flights f
      ${whereClause}
      GROUP BY TO_CHAR(f.scheduled_departure, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `,
      params,
    );

    // Get price trends
    const priceTrendsResult = await this.databaseService.query(
      `
      SELECT 
        DATE(f.scheduled_departure) as date,
        AVG(t.price) as average_price,
        MIN(t.price) as min_price,
        MAX(t.price) as max_price
      FROM flights f
      JOIN tickets t ON f.flight_id = t.flight_id
      WHERE t.status = 'active'
      ${whereClause.replace('f.', 'f.')}
      GROUP BY DATE(f.scheduled_departure)
      ORDER BY date DESC
      LIMIT 30
    `,
      params,
    );

    return {
      period,
      total_revenue: totalRevenue,
      revenue_growth: 0, // Would need historical data to calculate
      average_ticket_price: parseFloat(revenue.average_ticket_price || '0'),
      revenue_by_class: revenueByClass,
      revenue_by_route: routeRevenueResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        revenue: parseFloat(row.revenue || '0'),
        percentage: totalRouteRevenue > 0 ? (parseFloat(row.revenue || '0') / totalRouteRevenue) * 100 : 0,
      })),
      revenue_by_aircraft: aircraftRevenueResult.rows.map((row) => ({
        aircraft_id: row.aircraft_id,
        registration_number: row.registration_number,
        revenue: parseFloat(row.revenue || '0'),
        percentage: totalAircraftRevenue > 0 ? (parseFloat(row.revenue || '0') / totalAircraftRevenue) * 100 : 0,
      })),
      monthly_revenue: monthlyRevenueResult.rows.map((row) => ({
        month: row.month,
        revenue: parseFloat(row.revenue || '0'),
        growth: 0, // Would need historical data to calculate
      })),
      price_trends: priceTrendsResult.rows.map((row) => ({
        date: row.date,
        average_price: parseFloat(row.average_price || '0'),
        min_price: parseFloat(row.min_price || '0'),
        max_price: parseFloat(row.max_price || '0'),
      })),
    };
  }

  /**
   * Get passenger analytics
   */
  async getPassengerAnalytics(analyticsDto: PassengerAnalyticsDto): Promise<PassengerAnalyticsResponseDto> {
    const { date_from, date_to, period = 'month', nationality, country, region } = analyticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    if (nationality) {
      conditions.push(`p.nationality = $${paramIndex}`);
      params.push(nationality);
      paramIndex++;
    }

    if (country) {
      conditions.push(`p.country = $${paramIndex}`);
      params.push(country);
      paramIndex++;
    }

    if (region) {
      conditions.push(`p.region = $${paramIndex}`);
      params.push(region);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic passenger statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(*) as total_passengers,
        COUNT(CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_passengers,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM tickets t 
          WHERE t.passenger_id = p.passenger_id 
          AND t.status = 'used'
        ) THEN 1 END) as returning_passengers,
        COUNT(CASE WHEN p.frequent_flyer = true THEN 1 END) as frequent_flyers,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))) as average_age
      FROM passengers p
      ${whereClause}
    `,
      params,
    );

    const stats = statsResult.rows[0];

    // Get passengers by nationality
    const nationalityResult = await this.databaseService.query(
      `
      SELECT 
        p.nationality,
        COUNT(*) as count
      FROM passengers p
      ${whereClause}
      GROUP BY p.nationality
      ORDER BY count DESC
      LIMIT 10
    `,
      params,
    );

    const passengersByNationality: Record<string, number> = {};
    nationalityResult.rows.forEach((row) => {
      passengersByNationality[row.nationality] = parseInt(row.count);
    });

    // Get passengers by country
    const countryResult = await this.databaseService.query(
      `
      SELECT 
        p.country,
        COUNT(*) as count
      FROM passengers p
      ${whereClause}
      WHERE p.country IS NOT NULL
      GROUP BY p.country
      ORDER BY count DESC
      LIMIT 10
    `,
      params,
    );

    const passengersByCountry: Record<string, number> = {};
    countryResult.rows.forEach((row) => {
      passengersByCountry[row.country] = parseInt(row.count);
    });

    // Get passengers by city
    const cityResult = await this.databaseService.query(
      `
      SELECT 
        p.city,
        p.country,
        COUNT(*) as passenger_count
      FROM passengers p
      ${whereClause}
      WHERE p.city IS NOT NULL
      GROUP BY p.city, p.country
      ORDER BY passenger_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get top destinations
    const destinationsResult = await this.databaseService.query(
      `
      SELECT 
        arr_city.city_name as destination,
        COUNT(t.ticket_id) as passenger_count
      FROM passengers p
      JOIN tickets t ON p.passenger_id = t.passenger_id
      JOIN flights f ON t.flight_id = f.flight_id
      JOIN routes r ON f.route_id = r.route_id
      JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
      JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
      WHERE t.status = 'used'
      ${whereClause.replace('p.', 'p.')}
      GROUP BY arr_city.city_name
      ORDER BY passenger_count DESC
      LIMIT 10
    `,
      params,
    );

    const totalDestinationPassengers = destinationsResult.rows.reduce((sum, row) => sum + parseInt(row.passenger_count), 0);

    // Get seasonal patterns
    const seasonalResult = await this.databaseService.query(
      `
      SELECT 
        TO_CHAR(p.created_at, 'Month') as month,
        COUNT(*) as passenger_count
      FROM passengers p
      ${whereClause}
      GROUP BY TO_CHAR(p.created_at, 'Month')
      ORDER BY EXTRACT(MONTH FROM MIN(p.created_at))
    `,
      params,
    );

    return {
      period,
      total_passengers: parseInt(stats.total_passengers),
      new_passengers: parseInt(stats.new_passengers),
      returning_passengers: parseInt(stats.returning_passengers),
      frequent_flyers: parseInt(stats.frequent_flyers),
      average_age: parseFloat(stats.average_age || '0'),
      passengers_by_nationality: passengersByNationality,
      passengers_by_country: passengersByCountry,
      passengers_by_city: cityResult.rows.map((row) => ({
        city: row.city,
        country: row.country,
        passenger_count: parseInt(row.passenger_count),
      })),
      loyalty_distribution: {
        frequent_flyers: parseInt(stats.frequent_flyers),
        regular_passengers: parseInt(stats.total_passengers) - parseInt(stats.frequent_flyers),
        new_passengers: parseInt(stats.new_passengers),
      },
      top_destinations: destinationsResult.rows.map((row) => ({
        destination: row.destination,
        passenger_count: parseInt(row.passenger_count),
        percentage: totalDestinationPassengers > 0 ? (parseInt(row.passenger_count) / totalDestinationPassengers) * 100 : 0,
      })),
      seasonal_patterns: seasonalResult.rows.map((row) => ({
        month: row.month.trim(),
        passenger_count: parseInt(row.passenger_count),
        growth_rate: 0, // Would need historical data to calculate
      })),
    };
  }

  /**
   * Get operational analytics with complex queries
   */
  async getOperationalAnalytics(analyticsDto: OperationalAnalyticsDto): Promise<OperationalAnalyticsResponseDto> {
    const { date_from, date_to, period = 'month', airport_id, route_id, aircraft_id } = analyticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`f.scheduled_departure >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`f.scheduled_departure <= $${paramIndex}`);
      params.push(date_to);
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

    // Get aircraft utilization with complex subquery
    const aircraftUtilizationResult = await this.databaseService.query(
      `
      WITH flight_hours AS (
        SELECT 
          f.aircraft_id,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as total_flight_hours,
          COUNT(f.flight_id) as flight_count
        FROM flights f
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY f.aircraft_id
      ),
      period_hours AS (
        SELECT 
          EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 3600 as total_period_hours
      )
      SELECT 
        AVG(
          CASE 
            WHEN ph.total_period_hours > 0 
            THEN (fh.total_flight_hours / ph.total_period_hours) * 100 
            ELSE 0 
          END
        ) as aircraft_utilization
      FROM flight_hours fh
      CROSS JOIN period_hours ph
    `,
      [...params, date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), date_to || new Date()],
    );

    // Get gate utilization with window functions
    const gateUtilizationResult = await this.databaseService.query(
      `
      WITH gate_usage AS (
        SELECT 
          g.gate_id,
          g.gate_number,
          COUNT(f.flight_id) as usage_count,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as total_hours,
          ROW_NUMBER() OVER (ORDER BY COUNT(f.flight_id) DESC) as usage_rank
        FROM gates g
        LEFT JOIN flights f ON g.gate_id = f.gate_id
        ${whereClause.replace('f.', 'f.')}
        GROUP BY g.gate_id, g.gate_number
      )
      SELECT AVG(total_hours / 24.0 * 100) as gate_utilization
      FROM gate_usage
      WHERE usage_count > 0
    `,
      params,
    );

    // Get crew utilization
    const crewUtilizationResult = await this.databaseService.query(
      `
      WITH crew_hours AS (
        SELECT 
          fc.user_id,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as total_flight_hours,
          COUNT(fc.flight_crew_id) as assignment_count
        FROM flight_crew fc
        JOIN flights f ON fc.flight_id = f.flight_id
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY fc.user_id
      )
      SELECT 
        AVG(total_flight_hours) as avg_crew_hours,
        COUNT(*) as active_crew_members
      FROM crew_hours
    `,
      params,
    );

    // Get turnaround time analysis
    const turnaroundResult = await this.databaseService.query(
      `
      WITH turnaround_times AS (
        SELECT 
          f.aircraft_id,
          f.flight_id,
          f.scheduled_arrival,
          LEAD(f.scheduled_departure) OVER (
            PARTITION BY f.aircraft_id 
            ORDER BY f.scheduled_departure
          ) as next_departure,
          EXTRACT(EPOCH FROM (
            LEAD(f.scheduled_departure) OVER (
              PARTITION BY f.aircraft_id 
              ORDER BY f.scheduled_departure
            ) - f.scheduled_arrival
          )) / 60 as turnaround_minutes
        FROM flights f
        ${whereClause}
        AND f.status IN ('arrived', 'departed')
      )
      SELECT 
        AVG(turnaround_minutes) as avg_turnaround_time,
        MIN(turnaround_minutes) as min_turnaround_time,
        MAX(turnaround_minutes) as max_turnaround_time
      FROM turnaround_times
      WHERE turnaround_minutes IS NOT NULL
      AND turnaround_minutes > 0
    `,
      params,
    );

    // Get maintenance efficiency
    const maintenanceEfficiencyResult = await this.databaseService.query(
      `
      WITH maintenance_stats AS (
        SELECT 
          m.aircraft_id,
          COUNT(*) as maintenance_count,
          AVG(m.actual_duration_hours) as avg_duration,
          AVG(m.actual_cost) as avg_cost,
          SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END) as completed_count
        FROM maintenance m
        JOIN aircraft a ON m.aircraft_id = a.aircraft_id
        WHERE m.created_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
        AND m.created_at <= COALESCE($2::date, CURRENT_DATE)
        GROUP BY m.aircraft_id
      )
      SELECT 
        AVG(completed_count::float / maintenance_count::float * 100) as maintenance_efficiency,
        AVG(avg_duration) as avg_maintenance_duration,
        AVG(avg_cost) as avg_maintenance_cost
      FROM maintenance_stats
    `,
      [date_from, date_to],
    );

    // Get fuel efficiency (simulated - would need actual fuel data)
    const fuelEfficiencyResult = await this.databaseService.query(
      `
      SELECT 
        AVG(
          CASE 
            WHEN EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600 > 0
            THEN (f.operational_cost / (EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600))
            ELSE 0
          END
        ) as fuel_efficiency_per_hour
      FROM flights f
      ${whereClause}
      AND f.status IN ('departed', 'arrived')
      AND f.operational_cost > 0
    `,
      params,
    );

    // Get operational costs
    const operationalCostsResult = await this.databaseService.query(
      `
      SELECT 
        SUM(f.operational_cost) as total_operational_costs,
        AVG(f.operational_cost) as avg_operational_cost,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue
      FROM flights f
      ${whereClause}
      AND f.status IN ('departed', 'arrived')
    `,
      params,
    );

    // Get efficiency by aircraft with complex ranking
    const aircraftEfficiencyResult = await this.databaseService.query(
      `
      WITH aircraft_metrics AS (
        SELECT 
          a.aircraft_id,
          a.registration_number,
          am.model_name,
          COUNT(f.flight_id) as flight_count,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as total_hours,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as avg_load_factor,
          ROW_NUMBER() OVER (ORDER BY 
            SUM(f.price * COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0)) DESC
          ) as efficiency_rank
        FROM aircraft a
        JOIN aircraft_models am ON a.model_id = am.model_id
        JOIN flights f ON a.aircraft_id = f.aircraft_id
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY a.aircraft_id, a.registration_number, am.model_name, a.capacity
      )
      SELECT 
        aircraft_id,
        registration_number,
        model_name,
        flight_count,
        ROUND(total_hours, 2) as utilization_rate,
        ROUND(avg_load_factor, 2) as efficiency_score,
        ROUND(total_revenue / NULLIF(total_hours, 0), 2) as revenue_per_hour
      FROM aircraft_metrics
      ORDER BY efficiency_rank
      LIMIT 10
    `,
      params,
    );

    // Get efficiency by route with profitability analysis
    const routeEfficiencyResult = await this.databaseService.query(
      `
      WITH route_metrics AS (
        SELECT 
          r.route_id,
          r.route_name,
          dep_airport.name as departure_airport,
          arr_airport.name as arrival_airport,
          COUNT(f.flight_id) as flight_count,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as avg_load_factor,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          SUM(f.operational_cost) as total_costs,
          ROW_NUMBER() OVER (ORDER BY 
            SUM(f.price * COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0)) DESC
          ) as profitability_rank
        FROM routes r
        JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
        JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
        JOIN flights f ON r.route_id = f.route_id
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY r.route_id, r.route_name, dep_airport.name, arr_airport.name
      )
      SELECT 
        route_id,
        route_name,
        departure_airport,
        arrival_airport,
        flight_count,
        ROUND(avg_load_factor, 2) as load_factor,
        ROUND(total_revenue - total_costs, 2) as profitability,
        ROUND(flight_count::float / EXTRACT(DAYS FROM ($2::timestamp - $1::timestamp)), 2) as frequency
      FROM route_metrics
      ORDER BY profitability_rank
      LIMIT 10
    `,
      [...params, date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), date_to || new Date()],
    );

    // Get performance metrics
    const performanceMetricsResult = await this.databaseService.query(
      `
      SELECT 
        ROUND(
          (COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END)::float / 
          COUNT(f.flight_id)::float) * 100, 2
        ) as on_time_departure,
        ROUND(
          (COUNT(CASE WHEN f.actual_arrival <= f.scheduled_arrival + INTERVAL '15 minutes' THEN 1 END)::float / 
          COUNT(f.flight_id)::float) * 100, 2
        ) as on_time_arrival,
        ROUND(
          (COUNT(CASE WHEN b.status = 'delivered' THEN 1 END)::float / 
          COUNT(b.baggage_id)::float) * 100, 2
        ) as baggage_handling,
        85.5 as customer_satisfaction -- Simulated value
      FROM flights f
      LEFT JOIN baggage b ON f.flight_id = b.flight_id
      ${whereClause}
      AND f.status IN ('departed', 'arrived')
    `,
      params,
    );

    const aircraftUtilization = parseFloat(aircraftUtilizationResult.rows[0]?.aircraft_utilization || '0');
    const gateUtilization = parseFloat(gateUtilizationResult.rows[0]?.gate_utilization || '0');
    const crewUtilization = parseFloat(crewUtilizationResult.rows[0]?.avg_crew_hours || '0');
    const avgTurnaroundTime = parseFloat(turnaroundResult.rows[0]?.avg_turnaround_time || '0');
    const maintenanceEfficiency = parseFloat(maintenanceEfficiencyResult.rows[0]?.maintenance_efficiency || '0');
    const fuelEfficiency = parseFloat(fuelEfficiencyResult.rows[0]?.fuel_efficiency_per_hour || '0');
    const operationalCosts = parseFloat(operationalCostsResult.rows[0]?.total_operational_costs || '0');
    const totalRevenue = parseFloat(operationalCostsResult.rows[0]?.total_revenue || '0');
    const costPerPassenger = operationalCosts / Math.max(1, totalRevenue / 500); // Estimated passenger count

    return {
      period,
      aircraft_utilization: aircraftUtilization,
      gate_utilization: gateUtilization,
      crew_utilization: crewUtilization,
      average_turnaround_time: avgTurnaroundTime,
      maintenance_efficiency: maintenanceEfficiency,
      fuel_efficiency: fuelEfficiency,
      operational_costs: operationalCosts,
      cost_per_passenger: costPerPassenger,
      efficiency_by_aircraft: aircraftEfficiencyResult.rows.map((row) => ({
        aircraft_id: row.aircraft_id,
        registration_number: row.registration_number,
        utilization_rate: parseFloat(row.utilization_rate || '0'),
        efficiency_score: parseFloat(row.efficiency_score || '0'),
        revenue_per_hour: parseFloat(row.revenue_per_hour || '0'),
      })),
      efficiency_by_route: routeEfficiencyResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        load_factor: parseFloat(row.load_factor || '0'),
        profitability: parseFloat(row.profitability || '0'),
        frequency: parseFloat(row.frequency || '0'),
      })),
      performance_metrics: {
        on_time_departure: parseFloat(performanceMetricsResult.rows[0]?.on_time_departure || '0'),
        on_time_arrival: parseFloat(performanceMetricsResult.rows[0]?.on_time_arrival || '0'),
        baggage_handling: parseFloat(performanceMetricsResult.rows[0]?.baggage_handling || '0'),
        customer_satisfaction: parseFloat(performanceMetricsResult.rows[0]?.customer_satisfaction || '0'),
      },
    };
  }

  /**
   * Get delay analytics with complex analysis
   */
  async getDelayAnalytics(analyticsDto: DelayAnalyticsDto): Promise<DelayAnalyticsResponseDto> {
    const { date_from, date_to, period = 'month', delay_type, airport_id, route_id } = analyticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (date_from) {
      conditions.push(`f.scheduled_departure >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`f.scheduled_departure <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    if (delay_type) {
      conditions.push(`f.delay_reason ILIKE $${paramIndex}`);
      params.push(`%${delay_type}%`);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic delay statistics with complex analysis
    const delayStatsResult = await this.databaseService.query(
      `
      WITH delay_analysis AS (
        SELECT 
          f.flight_id,
          f.flight_number,
          f.scheduled_departure,
          f.actual_departure,
          f.delay_reason,
          EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 as delay_minutes,
          CASE 
            WHEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 <= 15 THEN 'on_time'
            WHEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 <= 60 THEN 'minor_delay'
            WHEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 <= 180 THEN 'moderate_delay'
            ELSE 'major_delay'
          END as delay_category,
          dep_airport.name as departure_airport,
          arr_airport.name as arrival_airport,
          r.route_name,
          am.model_name as aircraft_type
        FROM flights f
        JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
        JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.airport_id
        JOIN routes r ON f.route_id = r.route_id
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        JOIN aircraft_models am ON a.model_id = am.model_id
        ${whereClause}
        AND f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes'
      )
      SELECT 
        COUNT(*) as total_delays,
        AVG(delay_minutes) as average_delay_minutes,
        ROUND(
          (COUNT(*)::float / (
            SELECT COUNT(*) FROM flights f2 
            ${whereClause.replace('f.', 'f2.')}
          )::float) * 100, 2
        ) as delay_rate,
        COUNT(CASE WHEN delay_category = 'minor_delay' THEN 1 END) as minor_delays,
        COUNT(CASE WHEN delay_category = 'moderate_delay' THEN 1 END) as moderate_delays,
        COUNT(CASE WHEN delay_category = 'major_delay' THEN 1 END) as major_delays
      FROM delay_analysis
    `,
      params,
    );

    // Get delays by cause with ranking
    const delaysByCauseResult = await this.databaseService.query(
      `
      WITH delay_causes AS (
        SELECT 
          COALESCE(f.delay_reason, 'Unknown') as delay_cause,
          COUNT(*) as delay_count,
          AVG(EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60) as avg_delay_minutes,
          ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as cause_rank
        FROM flights f
        ${whereClause}
        AND f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes'
        GROUP BY f.delay_reason
      )
      SELECT 
        delay_cause,
        delay_count,
        ROUND(avg_delay_minutes, 2) as avg_delay_minutes,
        ROUND((delay_count::float / SUM(delay_count) OVER ()) * 100, 2) as percentage
      FROM delay_causes
      ORDER BY cause_rank
      LIMIT 10
    `,
      params,
    );

    // Get delays by airport with complex analysis
    const delaysByAirportResult = await this.databaseService.query(
      `
      WITH airport_delays AS (
        SELECT 
          dep_airport.airport_id,
          dep_airport.name as airport_name,
          dep_airport.iata_code,
          COUNT(f.flight_id) as total_flights,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          AVG(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 
            ELSE 0 END) as avg_delay_minutes,
          ROW_NUMBER() OVER (ORDER BY 
            COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) DESC
          ) as delay_rank
        FROM flights f
        JOIN airports dep_airport ON f.departure_airport_id = dep_airport.airport_id
        ${whereClause}
        GROUP BY dep_airport.airport_id, dep_airport.name, dep_airport.iata_code
      )
      SELECT 
        airport_id,
        airport_name,
        iata_code,
        total_flights,
        delayed_flights,
        ROUND(avg_delay_minutes, 2) as average_delay,
        ROUND((delayed_flights::float / total_flights::float) * 100, 2) as delay_percentage
      FROM airport_delays
      WHERE delayed_flights > 0
      ORDER BY delay_rank
      LIMIT 10
    `,
      params,
    );

    // Get delays by route with profitability impact
    const delaysByRouteResult = await this.databaseService.query(
      `
      WITH route_delays AS (
        SELECT 
          r.route_id,
          r.route_name,
          dep_airport.name as departure_airport,
          arr_airport.name as arrival_airport,
          COUNT(f.flight_id) as total_flights,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          AVG(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 
            ELSE 0 END) as avg_delay_minutes,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue
        FROM flights f
        JOIN routes r ON f.route_id = r.route_id
        JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
        JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
        ${whereClause}
        GROUP BY r.route_id, r.route_name, dep_airport.name, arr_airport.name
      )
      SELECT 
        route_id,
        route_name,
        departure_airport,
        arrival_airport,
        total_flights,
        delayed_flights,
        ROUND(avg_delay_minutes, 2) as average_delay,
        ROUND((delayed_flights::float / total_flights::float) * 100, 2) as delay_percentage,
        ROUND(total_revenue, 2) as total_revenue
      FROM route_delays
      WHERE delayed_flights > 0
      ORDER BY delayed_flights DESC
      LIMIT 10
    `,
      params,
    );

    // Get delays by time of day with window functions
    const delaysByTimeResult = await this.databaseService.query(
      `
      WITH hourly_delays AS (
        SELECT 
          EXTRACT(HOUR FROM f.scheduled_departure) as hour_of_day,
          COUNT(f.flight_id) as total_flights,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          AVG(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 
            ELSE 0 END) as avg_delay_minutes,
          ROW_NUMBER() OVER (ORDER BY 
            COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) DESC
          ) as delay_rank
        FROM flights f
        ${whereClause}
        GROUP BY EXTRACT(HOUR FROM f.scheduled_departure)
      )
      SELECT 
        hour_of_day,
        total_flights,
        delayed_flights,
        ROUND(avg_delay_minutes, 2) as average_delay,
        ROUND((delayed_flights::float / total_flights::float) * 100, 2) as delay_percentage
      FROM hourly_delays
      WHERE delayed_flights > 0
      ORDER BY hour_of_day
    `,
      params,
    );

    // Get seasonal delays with trend analysis
    const seasonalDelaysResult = await this.databaseService.query(
      `
      WITH monthly_delays AS (
        SELECT 
          TO_CHAR(f.scheduled_departure, 'Month') as month_name,
          EXTRACT(MONTH FROM f.scheduled_departure) as month_number,
          COUNT(f.flight_id) as total_flights,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          AVG(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure)) / 60 
            ELSE 0 END) as avg_delay_minutes,
          LAG(COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END)) 
            OVER (ORDER BY EXTRACT(MONTH FROM f.scheduled_departure)) as prev_month_delays
        FROM flights f
        ${whereClause}
        GROUP BY EXTRACT(MONTH FROM f.scheduled_departure), TO_CHAR(f.scheduled_departure, 'Month')
      )
      SELECT 
        TRIM(month_name) as month,
        total_flights,
        delayed_flights,
        ROUND(avg_delay_minutes, 2) as average_delay,
        ROUND((delayed_flights::float / total_flights::float) * 100, 2) as delay_percentage,
        CASE 
          WHEN prev_month_delays IS NOT NULL 
          THEN ROUND(((delayed_flights - prev_month_delays)::float / prev_month_delays::float) * 100, 2)
          ELSE 0
        END as change_from_prev_month
      FROM monthly_delays
      ORDER BY month_number
    `,
      params,
    );

    // Calculate impact analysis
    const impactAnalysisResult = await this.databaseService.query(
      `
      WITH delay_impact AS (
        SELECT 
          SUM(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN f.price * COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0) * 0.1 -- 10% revenue loss estimate
            ELSE 0 END) as estimated_revenue_loss,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          SUM(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0)
            ELSE 0 END) as affected_passengers,
          SUM(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' 
            THEN f.operational_cost * 0.2 -- 20% additional operational cost
            ELSE 0 END) as additional_operational_cost
        FROM flights f
        ${whereClause}
      )
      SELECT 
        ROUND(estimated_revenue_loss, 2) as revenue_loss,
        affected_passengers,
        ROUND(additional_operational_cost, 2) as operational_cost
      FROM delay_impact
    `,
      params,
    );

    const stats = delayStatsResult.rows[0];
    const impact = impactAnalysisResult.rows[0];

    return {
      period,
      total_delays: parseInt(stats.total_delays),
      average_delay_minutes: parseFloat(stats.average_delay_minutes || '0'),
      delay_rate: parseFloat(stats.delay_rate || '0'),
      delays_by_cause: delaysByCauseResult.rows.reduce((acc, row) => {
        acc[row.delay_cause] = parseInt(row.delay_count);
        return acc;
      }, {} as Record<string, number>),
      delays_by_airport: delaysByAirportResult.rows.map((row) => ({
        airport_id: row.airport_id,
        airport_name: row.airport_name,
        iata_code: row.iata_code,
        delay_count: parseInt(row.delayed_flights),
        average_delay: parseFloat(row.average_delay || '0'),
      })),
      delays_by_route: delaysByRouteResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        delay_count: parseInt(row.delayed_flights),
        average_delay: parseFloat(row.average_delay || '0'),
      })),
      delays_by_time: delaysByTimeResult.rows.map((row) => ({
        hour: parseInt(row.hour_of_day),
        delay_count: parseInt(row.delayed_flights),
        average_delay: parseFloat(row.average_delay || '0'),
      })),
      seasonal_delays: seasonalDelaysResult.rows.map((row) => ({
        month: row.month,
        delay_count: parseInt(row.delayed_flights),
        average_delay: parseFloat(row.average_delay || '0'),
      })),
      impact_analysis: {
        revenue_loss: parseFloat(impact.revenue_loss || '0'),
        passenger_impact: parseInt(impact.affected_passengers || '0'),
        operational_cost: parseFloat(impact.operational_cost || '0'),
      },
    };
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(analyticsDto: DashboardAnalyticsDto): Promise<DashboardAnalyticsResponseDto> {
    const { date_from, date_to } = analyticsDto;

    // Get overview metrics
    const overviewResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(f.flight_id) as total_flights,
        COALESCE(SUM((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as total_passengers,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as total_revenue,
        ROUND(
          (COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END)::float / 
          COUNT(f.flight_id)::float) * 100, 2
        ) as on_time_performance
      FROM flights f
      WHERE f.scheduled_departure >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
      AND f.scheduled_departure <= COALESCE($2::date, CURRENT_DATE)
    `,
      [date_from, date_to],
    );

    const overview = overviewResult.rows[0];

    // Get today's metrics
    const todayResult = await this.databaseService.query(
      `
      SELECT 
        COUNT(f.flight_id) as flights_today,
        COALESCE(SUM((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as passengers_today,
        SUM(f.price * COALESCE((
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        ), 0)) as revenue_today,
        COUNT(CASE WHEN f.status = 'delayed' THEN 1 END) as delays_today
      FROM flights f
      WHERE DATE(f.scheduled_departure) = CURRENT_DATE
    `,
    );

    const today = todayResult.rows[0];

    return {
      overview: {
        total_flights: parseInt(overview.total_flights),
        total_passengers: parseInt(overview.total_passengers),
        total_revenue: parseFloat(overview.total_revenue || '0'),
        on_time_performance: parseFloat(overview.on_time_performance || '0'),
      },
      today_metrics: {
        flights_today: parseInt(today.flights_today),
        passengers_today: parseInt(today.passengers_today),
        revenue_today: parseFloat(today.revenue_today || '0'),
        delays_today: parseInt(today.delays_today),
      },
      recent_trends: {
        flight_growth: 0, // Would need historical data
        passenger_growth: 0,
        revenue_growth: 0,
        performance_trend: 0,
      },
      alerts: [],
      top_performers: {
        best_route: 'N/A',
        best_aircraft: 'N/A',
        best_crew_member: 'N/A',
      },
      key_metrics: {
        load_factor: 0,
        utilization_rate: 0,
        customer_satisfaction: 0,
        operational_efficiency: 0,
      },
    };
  }
}
