import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class CreateAircraftModelDto {
  @IsString()
  model_name: string;

  @IsString()
  manufacturer: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_range: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fuel_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cruise_speed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_altitude?: number;
}

export class UpdateAircraftModelDto {
  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_range?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fuel_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cruise_speed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_altitude?: number;
}

export class AircraftModelResponseDto {
  model_id: number;
  model_name: string;
  manufacturer: string;
  capacity: number;
  max_range: number;
  description?: string;
  fuel_capacity?: number;
  cruise_speed?: number;
  max_altitude?: number;
  created_at: Date;
  updated_at: Date;
}

export class SearchAircraftModelsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  min_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  min_range?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_range?: number;
}

export class AircraftModelStatisticsDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  min_capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  max_capacity?: number;
}

export class AircraftModelStatisticsResponseDto {
  manufacturer: string;
  model_count: number;
  total_capacity: number;
  average_capacity: number;
  most_popular_model: string;
  total_flights: number;
  utilization_rate: number;
}
