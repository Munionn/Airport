import { IsOptional, IsString, IsNumber, IsEnum, Type } from 'class-validator';
import { Type as TransformType } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class AnalyticsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'day' | 'week' | 'month' | 'year'

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
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;
}

export class FlightAnalyticsDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  analysis_type?: string; // 'performance' | 'revenue' | 'load_factor' | 'delays'
}

export class FlightAnalyticsResponseDto {
  period: string;
  total_flights: number;
  completed_flights: number;
  cancelled_flights: number;
  delayed_flights: number;
  on_time_performance: number;
  average_delay_minutes: number;
  total_revenue: number;
  average_load_factor: number;
  passenger_count: number;
  revenue_by_class: Record<string, number>;
  performance_by_route: Array<{
    route_id: number;
    route_name: string;
    departure_airport: string;
    arrival_airport: string;
    flight_count: number;
    on_time_percentage: number;
    average_load_factor: number;
    total_revenue: number;
  }>;
  performance_by_aircraft: Array<{
    aircraft_id: number;
    registration_number: string;
    model_name: string;
    flight_count: number;
    utilization_rate: number;
    average_load_factor: number;
    total_revenue: number;
  }>;
  daily_metrics: Array<{
    date: string;
    flights: number;
    passengers: number;
    revenue: number;
    load_factor: number;
  }>;
}

export class RevenueAnalyticsDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  breakdown_by?: string; // 'route' | 'aircraft' | 'class' | 'time'
}

export class RevenueAnalyticsResponseDto {
  period: string;
  total_revenue: number;
  revenue_growth: number;
  average_ticket_price: number;
  revenue_by_class: Record<string, number>;
  revenue_by_route: Array<{
    route_id: number;
    route_name: string;
    revenue: number;
    percentage: number;
  }>;
  revenue_by_aircraft: Array<{
    aircraft_id: number;
    registration_number: string;
    revenue: number;
    percentage: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;
  price_trends: Array<{
    date: string;
    average_price: number;
    min_price: number;
    max_price: number;
  }>;
}

export class PassengerAnalyticsDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  analysis_type?: string; // 'demographics' | 'loyalty' | 'behavior'
}

export class PassengerAnalyticsResponseDto {
  period: string;
  total_passengers: number;
  new_passengers: number;
  returning_passengers: number;
  frequent_flyers: number;
  average_age: number;
  passengers_by_nationality: Record<string, number>;
  passengers_by_country: Record<string, number>;
  passengers_by_city: Array<{
    city: string;
    country: string;
    passenger_count: number;
  }>;
  loyalty_distribution: {
    frequent_flyers: number;
    regular_passengers: number;
    new_passengers: number;
  };
  top_destinations: Array<{
    destination: string;
    passenger_count: number;
    percentage: number;
  }>;
  seasonal_patterns: Array<{
    month: string;
    passenger_count: number;
    growth_rate: number;
  }>;
}

export class OperationalAnalyticsDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  metric_type?: string; // 'efficiency' | 'utilization' | 'performance'
}

export class OperationalAnalyticsResponseDto {
  period: string;
  aircraft_utilization: number;
  gate_utilization: number;
  crew_utilization: number;
  average_turnaround_time: number;
  maintenance_efficiency: number;
  fuel_efficiency: number;
  operational_costs: number;
  cost_per_passenger: number;
  efficiency_by_aircraft: Array<{
    aircraft_id: number;
    registration_number: string;
    utilization_rate: number;
    efficiency_score: number;
    revenue_per_hour: number;
  }>;
  efficiency_by_route: Array<{
    route_id: number;
    route_name: string;
    load_factor: number;
    profitability: number;
    frequency: number;
  }>;
  performance_metrics: {
    on_time_departure: number;
    on_time_arrival: number;
    baggage_handling: number;
    customer_satisfaction: number;
  };
}

export class DelayAnalyticsDto extends AnalyticsQueryDto {
  @IsOptional()
  @IsString()
  delay_type?: string; // 'weather' | 'technical' | 'crew' | 'air_traffic'
}

export class DelayAnalyticsResponseDto {
  period: string;
  total_delays: number;
  average_delay_minutes: number;
  delay_rate: number;
  delays_by_cause: Record<string, number>;
  delays_by_airport: Array<{
    airport_id: number;
    airport_name: string;
    iata_code: string;
    delay_count: number;
    average_delay: number;
  }>;
  delays_by_route: Array<{
    route_id: number;
    route_name: string;
    delay_count: number;
    average_delay: number;
  }>;
  delays_by_time: Array<{
    hour: number;
    delay_count: number;
    average_delay: number;
  }>;
  seasonal_delays: Array<{
    month: string;
    delay_count: number;
    average_delay: number;
  }>;
  impact_analysis: {
    revenue_loss: number;
    passenger_impact: number;
    operational_cost: number;
  };
}

export class DashboardAnalyticsDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;
}

export class DashboardAnalyticsResponseDto {
  overview: {
    total_flights: number;
    total_passengers: number;
    total_revenue: number;
    on_time_performance: number;
  };
  today_metrics: {
    flights_today: number;
    passengers_today: number;
    revenue_today: number;
    delays_today: number;
  };
  recent_trends: {
    flight_growth: number;
    passenger_growth: number;
    revenue_growth: number;
    performance_trend: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
    timestamp: Date;
  }>;
  top_performers: {
    best_route: string;
    best_aircraft: string;
    best_crew_member: string;
  };
  key_metrics: {
    load_factor: number;
    utilization_rate: number;
    customer_satisfaction: number;
    operational_efficiency: number;
  };
}
