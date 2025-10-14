import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { AircraftStatus } from '../../shared/enums';

export class CreateAircraftDto {
  @IsString()
  registration_number: string;

  @Type(() => Number)
  @IsNumber()
  model_id: number;

  @IsEnum(AircraftStatus)
  status: AircraftStatus;

  @IsDateString()
  purchase_date: Date;

  @IsOptional()
  @IsDateString()
  last_maintenance?: Date;

  @IsOptional()
  @IsDateString()
  next_maintenance?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_flight_hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_cycles?: number;
}

export class UpdateAircraftDto {
  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  model_id?: number;

  @IsOptional()
  @IsEnum(AircraftStatus)
  status?: AircraftStatus;

  @IsOptional()
  @IsDateString()
  purchase_date?: Date;

  @IsOptional()
  @IsDateString()
  last_maintenance?: Date;

  @IsOptional()
  @IsDateString()
  next_maintenance?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_flight_hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_cycles?: number;
}

export class AircraftResponseDto {
  aircraft_id: number;
  registration_number: string;
  model_id: number;
  model_name: string;
  manufacturer: string;
  capacity: number;
  max_range: number;
  status: AircraftStatus;
  purchase_date: Date;
  last_maintenance?: Date;
  next_maintenance?: Date;
  notes?: string;
  total_flight_hours?: number;
  total_cycles?: number;
  created_at: Date;
  updated_at: Date;
}

export class SearchAircraftDto extends PaginationDto {
  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @IsEnum(AircraftStatus)
  status?: AircraftStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  model_id?: number;

  @IsOptional()
  @IsDateString()
  purchase_date_from?: Date;

  @IsOptional()
  @IsDateString()
  purchase_date_to?: Date;

  @IsOptional()
  @IsDateString()
  maintenance_due_from?: Date;

  @IsOptional()
  @IsDateString()
  maintenance_due_to?: Date;
}

export class AircraftStatisticsDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsEnum(AircraftStatus)
  status?: AircraftStatus;

  @IsOptional()
  @IsDateString()
  from_date?: Date;

  @IsOptional()
  @IsDateString()
  to_date?: Date;
}

export class AircraftStatisticsResponseDto {
  total_aircraft: number;
  active_aircraft: number;
  maintenance_due: number;
  average_age_years: number;
  total_flight_hours: number;
  average_utilization: number;
  most_used_aircraft: {
    aircraft_id: number;
    registration_number: string;
    flight_count: number;
  };
  manufacturer_breakdown: Array<{
    manufacturer: string;
    count: number;
    percentage: number;
  }>;
}

export class AircraftEfficiencyDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsDateString()
  from_date?: Date;

  @IsOptional()
  @IsDateString()
  to_date?: Date;
}

export class AircraftEfficiencyResponseDto {
  aircraft_id: number;
  registration_number: string;
  model_name: string;
  manufacturer: string;
  total_flights: number;
  total_hours: number;
  total_passengers: number;
  utilization_rate: number;
  efficiency_score: number;
  average_load_factor: number;
  revenue_per_hour: number;
}

export class MaintenanceScheduleDto {
  @IsOptional()
  @IsDateString()
  from_date?: Date;

  @IsOptional()
  @IsDateString()
  to_date?: Date;

  @IsOptional()
  @IsEnum(AircraftStatus)
  status?: AircraftStatus;
}

export class MaintenanceScheduleResponseDto {
  aircraft_id: number;
  registration_number: string;
  model_name: string;
  last_maintenance: Date;
  next_maintenance: Date;
  days_until_maintenance: number;
  status: AircraftStatus;
  maintenance_type: string;
  estimated_duration_hours: number;
}
