import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { TerminalStatus } from '../../shared/enums';

export class CreateTerminalDto {
  @IsString()
  terminal_name: string;

  @Type(() => Number)
  @IsNumber()
  airport_id: number;

  @IsEnum(TerminalStatus)
  status: TerminalStatus;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTerminalDto {
  @IsOptional()
  @IsString()
  terminal_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TerminalResponseDto {
  terminal_id: number;
  terminal_name: string;
  airport_id: number;
  airport_name?: string;
  iata_code?: string;
  status: TerminalStatus;
  description?: string;
  gate_count?: number;
  created_at: Date;
  updated_at: Date;
}

export class SearchTerminalsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  terminal_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class TerminalStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class TerminalStatisticsResponseDto {
  terminal_id: number;
  terminal_name: string;
  airport_name: string;
  total_gates: number;
  available_gates: number;
  occupied_gates: number;
  total_flights_today: number;
  average_gate_utilization: number;
  status: TerminalStatus;
}
