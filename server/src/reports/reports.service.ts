import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  FlightStatisticsReportDto,
  FlightStatisticsReportResponseDto,
  RevenueReportDto,
  RevenueReportResponseDto,
  AirportStatisticsReportDto,
  AirportStatisticsReportResponseDto,
  EuropeanPassengerReportDto,
  EuropeanPassengerReportResponseDto,
  DataIntegrityReportDto,
  DataIntegrityReportResponseDto,
  CustomReportDto,
  CustomReportResponseDto,
} from './dto/reports.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Generate flight statistics report
   */
  async generateFlightStatisticsReport(
    reportDto: FlightStatisticsReportDto,
  ): Promise<FlightStatisticsReportResponseDto> {
    const startTime = Date.now();
    const reportId = `flight_stats_${Date.now()}`;
    const { date_from, date_to, period = 'monthly' } = reportDto;

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

    // Get summary statistics with complex aggregation
    const summaryResult = await this.databaseService.query(
      `
      WITH flight_summary AS (
        SELECT 
          COUNT(*) as total_flights,
          COUNT(CASE WHEN f.status = 'arrived' THEN 1 END) as completed_flights,
          COUNT(CASE WHEN f.status = 'cancelled' THEN 1 END) as cancelled_flights,
          COUNT(CASE WHEN f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as delayed_flights,
          COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          SUM((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )) as total_passengers,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as average_load_factor
        FROM flights f
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        ${whereClause}
      )
      SELECT 
        total_flights,
        completed_flights,
        cancelled_flights,
        delayed_flights,
        ROUND((on_time_flights::float / total_flights::float) * 100, 2) as on_time_performance,
        total_revenue,
        total_passengers,
        ROUND(average_load_factor, 2) as average_load_factor
      FROM flight_summary
    `,
      params,
    );

    // Get daily statistics with window functions
    const dailyStatsResult = await this.databaseService.query(
      `
      WITH daily_stats AS (
        SELECT 
          DATE(f.scheduled_departure) as date,
          COUNT(f.flight_id) as flights,
          SUM((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )) as passengers,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as revenue,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as load_factor,
          COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
          ROW_NUMBER() OVER (ORDER BY DATE(f.scheduled_departure)) as day_rank
        FROM flights f
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        ${whereClause}
        GROUP BY DATE(f.scheduled_departure)
      )
      SELECT 
        date,
        flights,
        passengers,
        ROUND(revenue, 2) as revenue,
        ROUND(load_factor, 2) as load_factor,
        ROUND((on_time_flights::float / flights::float) * 100, 2) as on_time_percentage
      FROM daily_stats
      ORDER BY date DESC
      LIMIT 30
    `,
      params,
    );

    // Get route performance with ranking
    const routePerformanceResult = await this.databaseService.query(
      `
      WITH route_performance AS (
        SELECT 
          r.route_id,
          r.route_name,
          dep_airport.name as departure_airport,
          arr_airport.name as arrival_airport,
          COUNT(f.flight_id) as flight_count,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as average_load_factor,
          COUNT(CASE WHEN f.actual_departure <= f.scheduled_departure + INTERVAL '15 minutes' THEN 1 END) as on_time_flights,
          ROW_NUMBER() OVER (ORDER BY COUNT(f.flight_id) DESC) as performance_rank
        FROM routes r
        JOIN airports dep_airport ON r.departure_airport_id = dep_airport.airport_id
        JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
        JOIN flights f ON r.route_id = f.route_id
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        ${whereClause}
        GROUP BY r.route_id, r.route_name, dep_airport.name, arr_airport.name
      )
      SELECT 
        route_id,
        route_name,
        departure_airport,
        arrival_airport,
        flight_count,
        ROUND(total_revenue, 2) as total_revenue,
        ROUND(average_load_factor, 2) as average_load_factor,
        ROUND((on_time_flights::float / flight_count::float) * 100, 2) as on_time_percentage
      FROM route_performance
      ORDER BY performance_rank
      LIMIT 20
    `,
      params,
    );

    // Get aircraft performance with efficiency metrics
    const aircraftPerformanceResult = await this.databaseService.query(
      `
      WITH aircraft_performance AS (
        SELECT 
          a.aircraft_id,
          a.registration_number,
          am.model_name,
          COUNT(f.flight_id) as flight_count,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as utilization_hours,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )::float / a.capacity::float * 100) as efficiency_score,
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
        GROUP BY a.aircraft_id, a.registration_number, am.model_name
      )
      SELECT 
        aircraft_id,
        registration_number,
        model_name,
        flight_count,
        ROUND(utilization_hours, 2) as utilization_hours,
        ROUND(total_revenue, 2) as total_revenue,
        ROUND(efficiency_score, 2) as efficiency_score
      FROM aircraft_performance
      ORDER BY efficiency_rank
      LIMIT 15
    `,
      params,
    );

    const summary = summaryResult.rows[0];
    const executionTime = Date.now() - startTime;

    this.logger.log(`Flight statistics report generated in ${executionTime}ms`);

    return {
      report_id: reportId,
      generated_at: new Date(),
      period: {
        from: date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: date_to ? new Date(date_to) : new Date(),
      },
      summary: {
        total_flights: parseInt(summary.total_flights),
        completed_flights: parseInt(summary.completed_flights),
        cancelled_flights: parseInt(summary.cancelled_flights),
        delayed_flights: parseInt(summary.delayed_flights),
        on_time_performance: parseFloat(summary.on_time_performance || '0'),
        total_revenue: parseFloat(summary.total_revenue || '0'),
        total_passengers: parseInt(summary.total_passengers),
        average_load_factor: parseFloat(summary.average_load_factor || '0'),
      },
      daily_statistics: dailyStatsResult.rows.map((row) => ({
        date: row.date,
        flights: parseInt(row.flights),
        passengers: parseInt(row.passengers),
        revenue: parseFloat(row.revenue || '0'),
        load_factor: parseFloat(row.load_factor || '0'),
        on_time_percentage: parseFloat(row.on_time_percentage || '0'),
      })),
      route_performance: routePerformanceResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        departure_airport: row.departure_airport,
        arrival_airport: row.arrival_airport,
        flight_count: parseInt(row.flight_count),
        total_revenue: parseFloat(row.total_revenue || '0'),
        average_load_factor: parseFloat(row.average_load_factor || '0'),
        on_time_percentage: parseFloat(row.on_time_percentage || '0'),
      })),
      aircraft_performance: aircraftPerformanceResult.rows.map(row => ({
        aircraft_id: row.aircraft_id,
        registration_number: row.registration_number,
        model_name: row.model_name,
        flight_count: parseInt(row.flight_count),
        utilization_hours: parseFloat(row.utilization_hours || '0'),
        total_revenue: parseFloat(row.total_revenue || '0'),
        efficiency_score: parseFloat(row.efficiency_score || '0'),
      })),
    };
  }

  /**
   * Generate revenue report with detailed analysis
   */
  async generateRevenueReport(reportDto: RevenueReportDto): Promise<RevenueReportResponseDto> {
    const startTime = Date.now();
    const reportId = `revenue_${Date.now()}`;
    const { date_from, date_to, breakdown_by = 'route' } = reportDto;

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

    // Get revenue summary with cost analysis
    const revenueSummaryResult = await this.databaseService.query(
      `
      WITH revenue_analysis AS (
        SELECT 
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as total_revenue,
          SUM(f.operational_cost) as total_costs,
          AVG(t.price) as average_ticket_price,
          COUNT(DISTINCT f.flight_id) as total_flights
        FROM flights f
        LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
      )
      SELECT 
        ROUND(total_revenue, 2) as total_revenue,
        ROUND(total_costs, 2) as total_costs,
        ROUND(total_revenue - total_costs, 2) as net_profit,
        ROUND(((total_revenue - total_costs) / NULLIF(total_revenue, 0)) * 100, 2) as profit_margin,
        ROUND(average_ticket_price, 2) as average_ticket_price,
        0 as revenue_growth -- Would need historical data
      FROM revenue_analysis
    `,
      params,
    );

    // Get revenue by class with percentage breakdown
    const revenueByClassResult = await this.databaseService.query(
      `
      SELECT 
        t.class,
        SUM(t.price) as revenue,
        COUNT(t.ticket_id) as ticket_count,
        ROUND((SUM(t.price) / (
          SELECT SUM(t2.price) FROM tickets t2 
          JOIN flights f2 ON t2.flight_id = f2.flight_id
          ${whereClause.replace('f.', 'f2.')}
          AND t2.status = 'active'
        )) * 100, 2) as percentage
      FROM tickets t
      JOIN flights f ON t.flight_id = f.flight_id
      ${whereClause}
      AND t.status = 'active'
      GROUP BY t.class
      ORDER BY revenue DESC
    `,
      params,
    );

    // Get revenue by route with passenger analysis
    const revenueByRouteResult = await this.databaseService.query(
      `
      WITH route_revenue AS (
        SELECT 
          r.route_id,
          r.route_name,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as revenue,
          SUM((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )) as passenger_count,
          ROW_NUMBER() OVER (ORDER BY 
            SUM(f.price * COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0)) DESC
          ) as revenue_rank
        FROM routes r
        JOIN flights f ON r.route_id = f.route_id
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY r.route_id, r.route_name
      )
      SELECT 
        route_id,
        route_name,
        ROUND(revenue, 2) as revenue,
        ROUND((revenue / (
          SELECT SUM(revenue) FROM route_revenue
        )) * 100, 2) as percentage,
        passenger_count
      FROM route_revenue
      ORDER BY revenue_rank
      LIMIT 15
    `,
      params,
    );

    // Get revenue by aircraft with flight hours
    const revenueByAircraftResult = await this.databaseService.query(
      `
      WITH aircraft_revenue AS (
        SELECT 
          a.aircraft_id,
          a.registration_number,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as revenue,
          SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as flight_hours,
          ROW_NUMBER() OVER (ORDER BY 
            SUM(f.price * COALESCE((
              SELECT COUNT(*) FROM tickets t 
              WHERE t.flight_id = f.flight_id AND t.status = 'active'
            ), 0)) DESC
          ) as revenue_rank
        FROM aircraft a
        JOIN flights f ON a.aircraft_id = f.aircraft_id
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY a.aircraft_id, a.registration_number
      )
      SELECT 
        aircraft_id,
        registration_number,
        ROUND(revenue, 2) as revenue,
        ROUND((revenue / (
          SELECT SUM(revenue) FROM aircraft_revenue
        )) * 100, 2) as percentage,
        ROUND(flight_hours, 2) as flight_hours
      FROM aircraft_revenue
      ORDER BY revenue_rank
      LIMIT 15
    `,
      params,
    );

    // Get monthly revenue with trend analysis
    const monthlyRevenueResult = await this.databaseService.query(
      `
      WITH monthly_revenue AS (
        SELECT 
          TO_CHAR(f.scheduled_departure, 'YYYY-MM') as month,
          SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0)) as revenue,
          SUM(f.operational_cost) as costs,
          LAG(SUM(f.price * COALESCE((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ), 0))) OVER (ORDER BY TO_CHAR(f.scheduled_departure, 'YYYY-MM')) as prev_month_revenue
        FROM flights f
        ${whereClause}
        AND f.status IN ('departed', 'arrived')
        GROUP BY TO_CHAR(f.scheduled_departure, 'YYYY-MM')
      )
      SELECT 
        month,
        ROUND(revenue, 2) as revenue,
        ROUND(costs, 2) as costs,
        ROUND(revenue - costs, 2) as profit,
        CASE 
          WHEN prev_month_revenue IS NOT NULL AND prev_month_revenue > 0
          THEN ROUND(((revenue - prev_month_revenue) / prev_month_revenue) * 100, 2)
          ELSE 0
        END as growth_rate
      FROM monthly_revenue
      ORDER BY month DESC
      LIMIT 12
    `,
      params,
    );

    // Get price analysis with trend detection
    const priceAnalysisResult = await this.databaseService.query(
      `
      WITH price_trend AS (
        SELECT 
          AVG(t.price) as average_price,
          MIN(t.price) as min_price,
          MAX(t.price) as max_price,
          STDDEV(t.price) as price_volatility
        FROM tickets t
        JOIN flights f ON t.flight_id = f.flight_id
        ${whereClause}
        AND t.status = 'active'
      )
      SELECT 
        ROUND(average_price, 2) as average_price,
        ROUND(min_price, 2) as min_price,
        ROUND(max_price, 2) as max_price,
        CASE 
          WHEN price_volatility < 50 THEN 'stable'
          WHEN price_volatility < 100 THEN 'increasing'
          ELSE 'decreasing'
        END as price_trend
      FROM price_trend
    `,
      params,
    );

    const summary = revenueSummaryResult.rows[0];
    const priceAnalysis = priceAnalysisResult.rows[0];

    return {
      report_id: reportId,
      generated_at: new Date(),
      period: {
        from: date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: date_to ? new Date(date_to) : new Date(),
      },
      summary: {
        total_revenue: parseFloat(summary.total_revenue || '0'),
        total_costs: parseFloat(summary.total_costs || '0'),
        net_profit: parseFloat(summary.net_profit || '0'),
        profit_margin: parseFloat(summary.profit_margin || '0'),
        average_ticket_price: parseFloat(summary.average_ticket_price || '0'),
        revenue_growth: parseFloat(summary.revenue_growth || '0'),
      },
      revenue_by_class: revenueByClassResult.rows.reduce((acc, row) => {
        acc[row.class] = parseFloat(row.revenue || '0');
        return acc;
      }, {} as Record<string, number>),
      revenue_by_route: revenueByRouteResult.rows.map((row) => ({
        route_id: row.route_id,
        route_name: row.route_name,
        revenue: parseFloat(row.revenue || '0'),
        percentage: parseFloat(row.percentage || '0'),
        passenger_count: parseInt(row.passenger_count),
      })),
      revenue_by_aircraft: revenueByAircraftResult.rows.map((row) => ({
        aircraft_id: row.aircraft_id,
        registration_number: row.registration_number,
        revenue: parseFloat(row.revenue || '0'),
        percentage: parseFloat(row.percentage || '0'),
        flight_hours: parseFloat(row.flight_hours || '0'),
      })),
      monthly_revenue: monthlyRevenueResult.rows.map((row) => ({
        month: row.month,
        revenue: parseFloat(row.revenue || '0'),
        costs: parseFloat(row.costs || '0'),
        profit: parseFloat(row.profit || '0'),
        growth_rate: parseFloat(row.growth_rate || '0'),
      })),
      price_analysis: {
        average_price: parseFloat(priceAnalysis.average_price || '0'),
        min_price: parseFloat(priceAnalysis.min_price || '0'),
        max_price: parseFloat(priceAnalysis.max_price || '0'),
        price_trend: priceAnalysis.price_trend as 'increasing' | 'decreasing' | 'stable',
      },
    };
  }

  /**
   * Generate European passenger statistics report
   */
  async generateEuropeanPassengerReport(
    reportDto: EuropeanPassengerReportDto,
  ): Promise<EuropeanPassengerReportResponseDto> {
    const startTime = Date.now();
    const reportId = `european_passengers_${Date.now()}`;
    const { date_from, date_to, nationality, country } = reportDto;

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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary statistics
    const summaryResult = await this.databaseService.query(
      `
      WITH european_passengers AS (
        SELECT 
          COUNT(DISTINCT p.passenger_id) as total_european_passengers,
          COUNT(DISTINCT f.flight_id) as total_flights,
          AVG((
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          )) as average_passengers_per_flight,
          COUNT(DISTINCT arr_city.city_id) as most_popular_destinations
        FROM passengers p
        JOIN tickets t ON p.passenger_id = t.passenger_id
        JOIN flights f ON t.flight_id = f.flight_id
        JOIN routes r ON f.route_id = r.route_id
        JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
        JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
        ${whereClause}
        AND p.nationality IN (
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
          'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
          'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        )
      )
      SELECT 
        total_european_passengers,
        total_flights,
        ROUND(average_passengers_per_flight, 2) as average_passengers_per_flight,
        most_popular_destinations
      FROM european_passengers
    `,
      params,
    );

    // Get passengers by nationality with destination analysis
    const passengersByNationalityResult = await this.databaseService.query(
      `
      WITH nationality_stats AS (
        SELECT 
          p.nationality,
          COUNT(DISTINCT p.passenger_id) as passenger_count,
          (
            SELECT arr_city.city_name
            FROM passengers p2
            JOIN tickets t2 ON p2.passenger_id = t2.passenger_id
            JOIN flights f2 ON t2.flight_id = f2.flight_id
            JOIN routes r2 ON f2.route_id = r2.route_id
            JOIN airports arr_airport2 ON r2.arrival_airport_id = arr_airport2.airport_id
            JOIN cities arr_city ON arr_airport2.city_id = arr_city.city_id
            WHERE p2.nationality = p.nationality
            ${whereClause.replace('p.', 'p2.')}
            GROUP BY arr_city.city_name
            ORDER BY COUNT(*) DESC
            LIMIT 1
          ) as most_popular_destination
        FROM passengers p
        ${whereClause}
        AND p.nationality IN (
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
          'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
          'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        )
        GROUP BY p.nationality
      )
      SELECT 
        nationality,
        passenger_count,
        ROUND((passenger_count::float / SUM(passenger_count) OVER ()) * 100, 2) as percentage,
        most_popular_destination
      FROM nationality_stats
      ORDER BY passenger_count DESC
      LIMIT 15
    `,
      params,
    );

    // Get passengers by country with flight duration analysis
    const passengersByCountryResult = await this.databaseService.query(
      `
      WITH country_stats AS (
        SELECT 
          p.country,
          COUNT(DISTINCT p.passenger_id) as passenger_count,
          AVG(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600) as average_flight_duration
        FROM passengers p
        JOIN tickets t ON p.passenger_id = t.passenger_id
        JOIN flights f ON t.flight_id = f.flight_id
        ${whereClause}
        AND p.nationality IN (
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
          'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
          'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        )
        GROUP BY p.country
      )
      SELECT 
        country,
        passenger_count,
        ROUND((passenger_count::float / SUM(passenger_count) OVER ()) * 100, 2) as percentage,
        ROUND(average_flight_duration, 2) as average_flight_duration
      FROM country_stats
      ORDER BY passenger_count DESC
      LIMIT 15
    `,
      params,
    );

    // Get top destinations with pricing analysis
    const topDestinationsResult = await this.databaseService.query(
      `
      WITH destination_stats AS (
        SELECT 
          arr_city.city_name as destination,
          arr_city.country,
          COUNT(DISTINCT p.passenger_id) as passenger_count,
          AVG(t.price) as average_price,
          ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT p.passenger_id) DESC) as destination_rank
        FROM passengers p
        JOIN tickets t ON p.passenger_id = t.passenger_id
        JOIN flights f ON t.flight_id = f.flight_id
        JOIN routes r ON f.route_id = r.route_id
        JOIN airports arr_airport ON r.arrival_airport_id = arr_airport.airport_id
        JOIN cities arr_city ON arr_airport.city_id = arr_city.city_id
        ${whereClause}
        AND p.nationality IN (
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
          'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
          'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        )
        GROUP BY arr_city.city_name, arr_city.country
      )
      SELECT 
        destination,
        country,
        passenger_count,
        ROUND((passenger_count::float / SUM(passenger_count) OVER ()) * 100, 2) as percentage,
        ROUND(average_price, 2) as average_price
      FROM destination_stats
      ORDER BY destination_rank
      LIMIT 20
    `,
      params,
    );

    // Get seasonal patterns with peak detection
    const seasonalPatternsResult = await this.databaseService.query(
      `
      WITH monthly_patterns AS (
        SELECT 
          TO_CHAR(p.created_at, 'Month') as month_name,
          EXTRACT(MONTH FROM p.created_at) as month_number,
          COUNT(DISTINCT p.passenger_id) as passenger_count,
          LAG(COUNT(DISTINCT p.passenger_id)) OVER (ORDER BY EXTRACT(MONTH FROM p.created_at)) as prev_month_count,
          AVG(COUNT(DISTINCT p.passenger_id)) OVER () as avg_monthly_passengers
        FROM passengers p
        ${whereClause}
        AND p.nationality IN (
          'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
          'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
          'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
          'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
        )
        GROUP BY EXTRACT(MONTH FROM p.created_at), TO_CHAR(p.created_at, 'Month')
      )
      SELECT 
        TRIM(month_name) as month,
        passenger_count,
        CASE 
          WHEN prev_month_count IS NOT NULL AND prev_month_count > 0
          THEN ROUND(((passenger_count - prev_month_count)::float / prev_month_count::float) * 100, 2)
          ELSE 0
        END as growth_rate,
        CASE 
          WHEN passenger_count > avg_monthly_passengers * 1.2 THEN true
          ELSE false
        END as peak_season
      FROM monthly_patterns
      ORDER BY month_number
    `,
      params,
    );

    const summary = summaryResult.rows[0];

    return {
      report_id: reportId,
      generated_at: new Date(),
      period: {
        from: date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: date_to ? new Date(date_to) : new Date(),
      },
      summary: {
        total_european_passengers: parseInt(summary.total_european_passengers),
        total_flights: parseInt(summary.total_flights),
        average_passengers_per_flight: parseFloat(summary.average_passengers_per_flight || '0'),
        most_popular_destinations: parseInt(summary.most_popular_destinations),
      },
      passengers_by_nationality: passengersByNationalityResult.rows.map((row) => ({
        nationality: row.nationality,
        passenger_count: parseInt(row.passenger_count),
        percentage: parseFloat(row.percentage || '0'),
        most_popular_destination: row.most_popular_destination || 'N/A',
      })),
      passengers_by_country: passengersByCountryResult.rows.map((row) => ({
        country: row.country,
        passenger_count: parseInt(row.passenger_count),
        percentage: parseFloat(row.percentage || '0'),
        average_flight_duration: parseFloat(row.average_flight_duration || '0'),
      })),
      top_destinations: topDestinationsResult.rows.map((row) => ({
        destination: row.destination,
        country: row.country,
        passenger_count: parseInt(row.passenger_count),
        percentage: parseFloat(row.percentage || '0'),
        average_price: parseFloat(row.average_price || '0'),
      })),
      seasonal_patterns: seasonalPatternsResult.rows.map((row) => ({
        month: row.month,
        passenger_count: parseInt(row.passenger_count),
        growth_rate: parseFloat(row.growth_rate || '0'),
        peak_season: row.peak_season,
      })),
    };
  }

  /**
   * Generate data integrity report
   */
  async generateDataIntegrityReport(
    reportDto: DataIntegrityReportDto,
  ): Promise<DataIntegrityReportResponseDto> {
    const startTime = Date.now();
    const reportId = `integrity_${Date.now()}`;
    const { check_type = 'all' } = reportDto;

    const recommendations: Array<{
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      suggested_action: string;
    }> = [];

    // Check flight integrity
    const flightIntegrityResult = await this.databaseService.query(
      `
      WITH flight_checks AS (
        SELECT 
          COUNT(CASE WHEN f.aircraft_id IS NULL THEN 1 END) as orphaned_flights,
          COUNT(CASE WHEN a.aircraft_id IS NULL THEN 1 END) as missing_aircraft,
          COUNT(CASE WHEN f.scheduled_departure > f.scheduled_arrival THEN 1 END) as invalid_dates,
          COUNT(CASE WHEN (
            SELECT COUNT(*) FROM tickets t 
            WHERE t.flight_id = f.flight_id AND t.status = 'active'
          ) > a.capacity THEN 1 END) as capacity_violations
        FROM flights f
        LEFT JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      )
      SELECT * FROM flight_checks
    `,
    );

    // Check passenger integrity
    const passengerIntegrityResult = await this.databaseService.query(
      `
      WITH passenger_checks AS (
        SELECT 
          COUNT(CASE WHEN p.email IS NOT NULL AND p.email !~ '^[^@]+@[^@]+\\.[^@]+$' THEN 1 END) as invalid_emails,
          COUNT(CASE WHEN p.phone IS NULL OR p.phone = '' THEN 1 END) as missing_phone_numbers,
          COUNT(CASE WHEN p.date_of_birth > CURRENT_DATE THEN 1 END) as invalid_dates_of_birth,
          COUNT(*) - COUNT(DISTINCT CONCAT(p.first_name, p.last_name, p.date_of_birth)) as duplicate_passengers
        FROM passengers p
      )
      SELECT * FROM passenger_checks
    `,
    );

    // Check ticket integrity
    const ticketIntegrityResult = await this.databaseService.query(
      `
      WITH ticket_checks AS (
        SELECT 
          COUNT(CASE WHEN f.flight_id IS NULL THEN 1 END) as orphaned_tickets,
          COUNT(CASE WHEN t.price <= 0 THEN 1 END) as invalid_prices,
          COUNT(CASE WHEN t.seat_number IS NOT NULL AND EXISTS (
            SELECT 1 FROM tickets t2 
            WHERE t2.flight_id = t.flight_id 
            AND t2.seat_number = t.seat_number 
            AND t2.ticket_id != t.ticket_id
            AND t2.status = 'active'
          ) THEN 1 END) as seat_conflicts,
          COUNT(CASE WHEN t.status NOT IN ('active', 'cancelled', 'used', 'refunded') THEN 1 END) as status_inconsistencies
        FROM tickets t
        LEFT JOIN flights f ON t.flight_id = f.flight_id
      )
      SELECT * FROM ticket_checks
    `,
    );

    // Check aircraft integrity
    const aircraftIntegrityResult = await this.databaseService.query(
      `
      WITH aircraft_checks AS (
        SELECT 
          COUNT(CASE WHEN am.model_id IS NULL THEN 1 END) as missing_models,
          COUNT(CASE WHEN a.capacity <= 0 THEN 1 END) as invalid_capacities,
          COUNT(CASE WHEN a.next_maintenance < a.last_maintenance THEN 1 END) as maintenance_violations,
          COUNT(CASE WHEN a.status = 'active' AND NOT EXISTS (
            SELECT 1 FROM flights f WHERE f.aircraft_id = a.aircraft_id 
            AND f.scheduled_departure >= CURRENT_DATE - INTERVAL '30 days'
          ) THEN 1 END) as utilization_anomalies
        FROM aircraft a
        LEFT JOIN aircraft_models am ON a.model_id = am.model_id
      )
      SELECT * FROM aircraft_checks
    `,
    );

    const flightIntegrity = flightIntegrityResult.rows[0];
    const passengerIntegrity = passengerIntegrityResult.rows[0];
    const ticketIntegrity = ticketIntegrityResult.rows[0];
    const aircraftIntegrity = aircraftIntegrityResult.rows[0];

    // Generate recommendations based on findings
    if (parseInt(flightIntegrity.orphaned_flights) > 0) {
      recommendations.push({
        issue: 'Orphaned Flights',
        severity: 'high',
        description: `${flightIntegrity.orphaned_flights} flights have no associated aircraft`,
        suggested_action: 'Review and assign aircraft to orphaned flights or remove invalid flights',
      });
    }

    if (parseInt(flightIntegrity.capacity_violations) > 0) {
      recommendations.push({
        issue: 'Capacity Violations',
        severity: 'critical',
        description: `${flightIntegrity.capacity_violations} flights have more passengers than aircraft capacity`,
        suggested_action: 'Immediately review overbooked flights and resolve capacity issues',
      });
    }

    if (parseInt(passengerIntegrity.invalid_emails) > 0) {
      recommendations.push({
        issue: 'Invalid Email Addresses',
        severity: 'medium',
        description: `${passengerIntegrity.invalid_emails} passengers have invalid email addresses`,
        suggested_action: 'Update passenger email addresses to valid format',
      });
    }

    if (parseInt(ticketIntegrity.seat_conflicts) > 0) {
      recommendations.push({
        issue: 'Seat Conflicts',
        severity: 'high',
        description: `${ticketIntegrity.seat_conflicts} tickets have conflicting seat assignments`,
        suggested_action: 'Resolve seat conflicts by reassigning passengers',
      });
    }

    const totalChecks = 16; // Total number of integrity checks
    const failedChecks = 
      parseInt(flightIntegrity.orphaned_flights) +
      parseInt(flightIntegrity.missing_aircraft) +
      parseInt(flightIntegrity.invalid_dates) +
      parseInt(flightIntegrity.capacity_violations) +
      parseInt(passengerIntegrity.invalid_emails) +
      parseInt(passengerIntegrity.missing_phone_numbers) +
      parseInt(passengerIntegrity.invalid_dates_of_birth) +
      parseInt(passengerIntegrity.duplicate_passengers) +
      parseInt(ticketIntegrity.orphaned_tickets) +
      parseInt(ticketIntegrity.invalid_prices) +
      parseInt(ticketIntegrity.seat_conflicts) +
      parseInt(ticketIntegrity.status_inconsistencies) +
      parseInt(aircraftIntegrity.missing_models) +
      parseInt(aircraftIntegrity.invalid_capacities) +
      parseInt(aircraftIntegrity.maintenance_violations) +
      parseInt(aircraftIntegrity.utilization_anomalies);

    const integrityScore = Math.max(0, ((totalChecks - failedChecks) / totalChecks) * 100);

    return {
      report_id: reportId,
      generated_at: new Date(),
      summary: {
        total_checks: totalChecks,
        passed_checks: totalChecks - failedChecks,
        failed_checks: failedChecks,
        integrity_score: Math.round(integrityScore),
      },
      flight_integrity: {
        orphaned_flights: parseInt(flightIntegrity.orphaned_flights),
        missing_aircraft: parseInt(flightIntegrity.missing_aircraft),
        invalid_dates: parseInt(flightIntegrity.invalid_dates),
        capacity_violations: parseInt(flightIntegrity.capacity_violations),
      },
      passenger_integrity: {
        duplicate_passengers: parseInt(passengerIntegrity.duplicate_passengers),
        invalid_emails: parseInt(passengerIntegrity.invalid_emails),
        missing_phone_numbers: parseInt(passengerIntegrity.missing_phone_numbers),
        invalid_dates_of_birth: parseInt(passengerIntegrity.invalid_dates_of_birth),
      },
      ticket_integrity: {
        orphaned_tickets: parseInt(ticketIntegrity.orphaned_tickets),
        invalid_prices: parseInt(ticketIntegrity.invalid_prices),
        seat_conflicts: parseInt(ticketIntegrity.seat_conflicts),
        status_inconsistencies: parseInt(ticketIntegrity.status_inconsistencies),
      },
      aircraft_integrity: {
        missing_models: parseInt(aircraftIntegrity.missing_models),
        invalid_capacities: parseInt(aircraftIntegrity.invalid_capacities),
        maintenance_violations: parseInt(aircraftIntegrity.maintenance_violations),
        utilization_anomalies: parseInt(aircraftIntegrity.utilization_anomalies),
      },
      recommendations,
    };
  }

  /**
   * Generate custom report based on user-defined parameters
   */
  async generateCustomReport(reportDto: CustomReportDto): Promise<CustomReportResponseDto> {
    const startTime = Date.now();
    const reportId = `custom_${Date.now()}`;
    const { report_name, report_description, query_type, custom_filters, grouping, sorting } = reportDto;

    // This would implement dynamic query generation based on user parameters
    // For now, returning a basic structure
    const executionTime = Date.now() - startTime;

    return {
      report_id: reportId,
      generated_at: new Date(),
      report_name,
      report_description,
      period: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
      query_execution_time: executionTime,
      total_records: 0,
      data: [],
      summary_statistics: {},
      metadata: {
        filters_applied: custom_filters ? JSON.parse(custom_filters) : {},
        grouping_used: grouping || 'none',
        sorting_used: sorting || 'none',
        data_sources: [query_type],
      },
    };
  }
}
