import { IsOptional, IsString, IsNumber, IsEnum, Type } from 'class-validator';
import { Type as TransformType } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { CrewPosition } from '../../shared/enums';

export class CreateFlightCrewDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @IsEnum(CrewPosition)
  position: CrewPosition;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFlightCrewDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsEnum(CrewPosition)
  position?: CrewPosition;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FlightCrewResponseDto {
  flight_crew_id: number;
  flight_id: number;
  flight_number?: string;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  position: CrewPosition;
  notes?: string;
  assigned_at: Date;
  created_at: Date;
  updated_at: Date;
}

export class SearchFlightCrewDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsEnum(CrewPosition)
  position?: CrewPosition;

  @IsOptional()
  @IsString()
  flight_number?: string;

  @IsOptional()
  @IsString()
  crew_name?: string;
}

export class CrewStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsEnum(CrewPosition)
  position?: CrewPosition;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;
}

export class CrewStatisticsResponseDto {
  period: string;
  total_crew_members: number;
  total_flights_served: number;
  average_flights_per_crew: number;
  crew_by_position: Record<CrewPosition, number>;
  most_active_crew: Array<{
    user_id: number;
    name: string;
    position: CrewPosition;
    flight_count: number;
  }>;
  crew_efficiency: Array<{
    user_id: number;
    name: string;
    position: CrewPosition;
    efficiency_score: number;
    on_time_performance: number;
  }>;
}

export class AssignCrewDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @IsEnum(CrewPosition)
  position: CrewPosition;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CrewAvailabilityDto {
  @Type(() => Number)
  @IsNumber()
  user_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @IsEnum(CrewPosition)
  position?: CrewPosition;
}

export class CrewAvailabilityResponseDto {
  user_id: number;
  name: string;
  position: CrewPosition;
  is_available: boolean;
  current_flight?: {
    flight_id: number;
    flight_number: string;
    scheduled_departure: Date;
    scheduled_arrival: Date;
  };
  next_available: Date;
  total_flight_hours: number;
  rest_hours_required: number;
}
