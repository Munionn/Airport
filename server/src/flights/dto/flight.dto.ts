import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FlightStatus } from '../../shared/enums';
import { PaginationDto, FilterDto } from '../../shared/dto/base.dto';

export class CreateFlightDto {
  @IsString()
  flight_number: string;

  @Type(() => Number)
  @IsNumber()
  aircraft_id: number;

  @Type(() => Number)
  @IsNumber()
  route_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gate_id?: number;

  @IsDateString()
  scheduled_departure: Date;

  @IsDateString()
  scheduled_arrival: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFlightDto {
  @IsOptional()
  @IsString()
  flight_number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aircraft_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  route_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gate_id?: number;

  @IsOptional()
  @IsDateString()
  scheduled_departure?: Date;

  @IsOptional()
  @IsDateString()
  scheduled_arrival?: Date;

  @IsOptional()
  @IsDateString()
  actual_departure?: Date;

  @IsOptional()
  @IsDateString()
  actual_arrival?: Date;

  @IsOptional()
  @IsEnum(FlightStatus)
  status?: FlightStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SearchFlightDto extends PaginationDto {
  @IsOptional()
  @IsString()
  departure_iata?: string;

  @IsOptional()
  @IsString()
  arrival_iata?: string;

  @IsOptional()
  @IsDateString()
  departure_date?: Date;

  @IsOptional()
  @IsDateString()
  arrival_date?: Date;

  @IsOptional()
  @IsEnum(FlightStatus)
  status?: FlightStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aircraft_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  route_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gate_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passenger_count?: number;

  @IsOptional()
  @IsString()
  airline?: string;
}

export class FlightStatisticsDto {
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsString()
  group_by?: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  route_id?: number;
}

export class FlightLoadDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsOptional()
  @IsBoolean()
  include_details?: boolean;
}

export class AssignGateDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @Type(() => Number)
  @IsNumber()
  gate_id: number;

  @IsOptional()
  @IsDateString()
  assigned_time?: Date;
}

export class UpdateFlightStatusDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsEnum(FlightStatus)
  status: FlightStatus;

  @IsOptional()
  @IsDateString()
  actual_departure?: Date;

  @IsOptional()
  @IsDateString()
  actual_arrival?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class FlightDelayDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  delay_minutes: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  new_departure_time?: Date;

  @IsOptional()
  @IsDateString()
  new_arrival_time?: Date;
}

export class FlightCancellationDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  alternative_flight?: string;

  @IsOptional()
  @IsBoolean()
  notify_passengers?: boolean;
}

export class FlightSearchCriteriaDto {
  @IsOptional()
  @IsString()
  departure_airport?: string;

  @IsOptional()
  @IsString()
  arrival_airport?: string;

  @IsOptional()
  @IsDateString()
  departure_date?: Date;

  @IsOptional()
  @IsDateString()
  arrival_date?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passenger_count?: number;

  @IsOptional()
  @IsString()
  ticket_class?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  @IsString()
  airline?: string;

  @IsOptional()
  @IsBoolean()
  direct_flights_only?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferred_airlines?: string[];
}

export class FlightResponseDto {
  flight_id: number;
  flight_number: string;
  aircraft_id: number;
  route_id: number;
  departure_airport_id: number;
  arrival_airport_id: number;
  gate_id?: number;
  scheduled_departure: Date;
  scheduled_arrival: Date;
  actual_departure?: Date;
  actual_arrival?: Date;
  status: FlightStatus;
  price: number;
  created_at: Date;
  updated_at: Date;
  // Additional computed fields
  load_percentage?: number;
  available_seats?: number;
  departure_airport?: {
    iata_code: string;
    airport_name: string;
    city: string;
  };
  arrival_airport?: {
    iata_code: string;
    airport_name: string;
    city: string;
  };
  aircraft?: {
    registration_number: string;
    model_name: string;
    capacity: number;
  };
  gate?: {
    gate_number: string;
    terminal: string;
  };
}

export class FlightStatisticsResponseDto {
  period: string;
  total_flights: number;
  total_passengers: number;
  total_revenue: number;
  average_load_factor: number;
  on_time_performance: number;
  cancellations: number;
  delays: number;
  average_delay_minutes: number;
  top_routes: Array<{
    route_id: number;
    departure_airport: string;
    arrival_airport: string;
    flight_count: number;
  }>;
  load_factor_by_class: Record<string, number>;
}
