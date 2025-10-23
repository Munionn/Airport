import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class ReportQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'daily' | 'weekly' | 'monthly' | 'yearly'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  route_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aircraft_id?: number;

  @IsOptional()
  @IsString()
  format?: string; // 'json' | 'csv' | 'pdf'
}

export class FlightStatisticsReportDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  report_type?: string; // 'performance' | 'revenue' | 'load_factor' | 'delays'
}

export class FlightStatisticsReportResponseDto {
  report_id: string;
  generated_at: Date;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    total_flights: number;
    completed_flights: number;
    cancelled_flights: number;
    delayed_flights: number;
    on_time_performance: number;
    total_revenue: number;
    total_passengers: number;
    average_load_factor: number;
  };
  daily_statistics: Array<{
    date: string;
    flights: number;
    passengers: number;
    revenue: number;
    load_factor: number;
    on_time_percentage: number;
  }>;
  route_performance: Array<{
    route_id: number;
    route_name: string;
    departure_airport: string;
    arrival_airport: string;
    flight_count: number;
    total_revenue: number;
    average_load_factor: number;
    on_time_percentage: number;
  }>;
  aircraft_performance: Array<{
    aircraft_id: number;
    registration_number: string;
    model_name: string;
    flight_count: number;
    utilization_hours: number;
    total_revenue: number;
    efficiency_score: number;
  }>;
}

export class RevenueReportDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  breakdown_by?: string; // 'route' | 'aircraft' | 'class' | 'time'
}

export class RevenueReportResponseDto {
  report_id: string;
  generated_at: Date;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    total_revenue: number;
    total_costs: number;
    net_profit: number;
    profit_margin: number;
    average_ticket_price: number;
    revenue_growth: number;
  };
  revenue_by_class: Record<string, number>;
  revenue_by_route: Array<{
    route_id: number;
    route_name: string;
    revenue: number;
    percentage: number;
    passenger_count: number;
  }>;
  revenue_by_aircraft: Array<{
    aircraft_id: number;
    registration_number: string;
    revenue: number;
    percentage: number;
    flight_hours: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    costs: number;
    profit: number;
    growth_rate: number;
  }>;
  price_analysis: {
    average_price: number;
    min_price: number;
    max_price: number;
    price_trend: 'increasing' | 'decreasing' | 'stable';
  };
}

export class AirportStatisticsReportDto extends ReportQueryDto {}

export class AirportStatisticsReportResponseDto {
  report_id: string;
  generated_at: Date;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    total_airports: number;
    total_flights: number;
    total_passengers: number;
    total_revenue: number;
    average_delay_minutes: number;
  };
  airport_statistics: Array<{
    airport_id: number;
    airport_name: string;
    iata_code: string;
    city: string;
    country: string;
    flight_count: number;
    passenger_count: number;
    revenue: number;
    delay_percentage: number;
    average_delay_minutes: number;
  }>;
  busiest_airports: Array<{
    airport_id: number;
    airport_name: string;
    iata_code: string;
    flight_count: number;
    passenger_count: number;
    ranking: number;
  }>;
  performance_metrics: {
    on_time_departure: number;
    on_time_arrival: number;
    baggage_handling: number;
    customer_satisfaction: number;
  };
}

export class EuropeanPassengerReportDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class EuropeanPassengerReportResponseDto {
  report_id: string;
  generated_at: Date;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    total_european_passengers: number;
    total_flights: number;
    average_passengers_per_flight: number;
    most_popular_destinations: number;
  };
  passengers_by_nationality: Array<{
    nationality: string;
    passenger_count: number;
    percentage: number;
    most_popular_destination: string;
  }>;
  passengers_by_country: Array<{
    country: string;
    passenger_count: number;
    percentage: number;
    average_flight_duration: number;
  }>;
  top_destinations: Array<{
    destination: string;
    country: string;
    passenger_count: number;
    percentage: number;
    average_price: number;
  }>;
  seasonal_patterns: Array<{
    month: string;
    passenger_count: number;
    growth_rate: number;
    peak_season: boolean;
  }>;
}

export class DataIntegrityReportDto extends ReportQueryDto {
  @IsOptional()
  @IsString()
  check_type?: string; // 'all' | 'flights' | 'passengers' | 'tickets' | 'aircraft'
}

export class DataIntegrityReportResponseDto {
  report_id: string;
  generated_at: Date;
  summary: {
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
    integrity_score: number;
  };
  flight_integrity: {
    orphaned_flights: number;
    missing_aircraft: number;
    invalid_dates: number;
    capacity_violations: number;
  };
  passenger_integrity: {
    duplicate_passengers: number;
    invalid_emails: number;
    missing_phone_numbers: number;
    invalid_dates_of_birth: number;
  };
  ticket_integrity: {
    orphaned_tickets: number;
    invalid_prices: number;
    seat_conflicts: number;
    status_inconsistencies: number;
  };
  aircraft_integrity: {
    missing_models: number;
    invalid_capacities: number;
    maintenance_violations: number;
    utilization_anomalies: number;
  };
  recommendations: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggested_action: string;
  }>;
}

export class CustomReportDto extends ReportQueryDto {
  @IsString()
  report_name: string;

  @IsString()
  report_description: string;

  @IsString()
  query_type: string; // 'flights' | 'passengers' | 'revenue' | 'operational'

  @IsOptional()
  @IsString()
  custom_filters?: string; // JSON string of custom filters

  @IsOptional()
  @IsString()
  grouping?: string; // 'date' | 'route' | 'aircraft' | 'airport'

  @IsOptional()
  @IsString()
  sorting?: string; // 'date' | 'revenue' | 'passengers' | 'flights'
}

export class CustomReportResponseDto {
  report_id: string;
  generated_at: Date;
  report_name: string;
  report_description: string;
  period: {
    from: Date;
    to: Date;
  };
  query_execution_time: number;
  total_records: number;
  data: Array<Record<string, any>>;
  summary_statistics: Record<string, any>;
  metadata: {
    filters_applied: Record<string, any>;
    grouping_used: string;
    sorting_used: string;
    data_sources: string[];
  };
}
