import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { RouteStatus } from '../../shared/enums';

export class CreateRouteDto {
  @IsString()
  route_name: string;

  @Type(() => Number)
  @IsNumber()
  departure_airport_id: number;

  @Type(() => Number)
  @IsNumber()
  arrival_airport_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  distance?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  route_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departure_airport_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  arrival_airport_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  distance?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base_price?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RouteResponseDto {
  route_id: number;
  route_name: string;
  departure_airport_id: number;
  departure_airport: {
    airport_id: number;
    iata_code: string;
    airport_name: string;
    city_name: string;
    country: string;
  };
  arrival_airport_id: number;
  arrival_airport: {
    airport_id: number;
    iata_code: string;
    airport_name: string;
    city_name: string;
    country: string;
  };
  distance?: number;
  duration?: string;
  status?: RouteStatus;
  base_price?: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export class SearchRoutesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  route_name?: string;

  @IsOptional()
  @IsString()
  departure_airport?: string;

  @IsOptional()
  @IsString()
  arrival_airport?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departure_airport_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  arrival_airport_id?: number;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  min_distance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_distance?: number;
}

export class RouteStatisticsDto {
  @IsOptional()
  @IsString()
  departure_country?: string;

  @IsOptional()
  @IsString()
  arrival_country?: string;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;
}

export class RouteStatisticsResponseDto {
  route_id: number;
  route_name: string;
  departure_airport: string;
  arrival_airport: string;
  total_flights: number;
  total_passengers: number;
  average_load_factor: number;
  average_price: number;
  total_revenue: number;
  on_time_performance: number;
  most_popular_month: string;
  busiest_day_of_week: string;
}

export class PopularRoutesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  departure_country?: string;

  @IsOptional()
  @IsString()
  arrival_country?: string;
}

export class PopularRoutesResponseDto {
  route_id: number;
  route_name: string;
  departure_airport: string;
  arrival_airport: string;
  flight_count: number;
  passenger_count: number;
  average_load_factor: number;
  total_revenue: number;
  popularity_score: number;
}
