import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { GateStatus } from '../../shared/enums';

export class CreateGateDto {
  @IsString()
  gate_number: string;

  @Type(() => Number)
  @IsNumber()
  terminal_id: number;

  @IsEnum(GateStatus)
  status: GateStatus;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGateDto {
  @IsOptional()
  @IsString()
  gate_number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  terminal_id?: number;

  @IsOptional()
  @IsEnum(GateStatus)
  status?: GateStatus;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GateResponseDto {
  gate_id: number;
  gate_number: string;
  terminal_id: number;
  terminal_name?: string;
  airport_name?: string;
  status: GateStatus;
  description?: string;
  current_flight?: {
    flight_id: number;
    flight_number: string;
    scheduled_departure: Date;
  };
  created_at: Date;
  updated_at: Date;
}

export class SearchGatesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  gate_number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  terminal_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @IsEnum(GateStatus)
  status?: GateStatus;
}

export class GateStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  terminal_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;
}

export class GateStatisticsResponseDto {
  gate_id: number;
  gate_number: string;
  terminal_name: string;
  total_flights_assigned: number;
  current_status: GateStatus;
  utilization_rate: number;
  average_turnaround_time: number;
}

export class AutoAssignGateDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  terminal_id?: number;
}

export class ReleaseGateDto {
  @Type(() => Number)
  @IsNumber()
  gate_id: number;
}
