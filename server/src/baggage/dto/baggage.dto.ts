import { IsOptional, IsString, IsNumber, IsEnum, Type } from 'class-validator';
import { PaginationDto } from '../../shared/dto/base.dto';
import { BaggageStatus } from '../../shared/enums';

export class CreateBaggageDto {
  @Type(() => Number)
  @IsNumber()
  ticket_id: number;

  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @Type(() => Number)
  @IsNumber()
  passenger_id: number;

  @IsString()
  baggage_tag: string;

  @Type(() => Number)
  @IsNumber()
  weight: number;

  @IsEnum(BaggageStatus)
  status: BaggageStatus;

  @IsOptional()
  @IsString()
  special_handling?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBaggageDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  passenger_id?: number;

  @IsOptional()
  @IsString()
  baggage_tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsEnum(BaggageStatus)
  status?: BaggageStatus;

  @IsOptional()
  @IsString()
  special_handling?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BaggageResponseDto {
  baggage_id: number;
  ticket_id: number;
  ticket_number?: string;
  flight_id: number;
  flight_number?: string;
  passenger_id: number;
  passenger_name?: string;
  baggage_tag: string;
  weight: number;
  status: BaggageStatus;
  special_handling?: string;
  notes?: string;
  checked_in_at?: Date;
  loaded_at?: Date;
  unloaded_at?: Date;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class SearchBaggageDto extends PaginationDto {
  @IsOptional()
  @IsString()
  baggage_tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  passenger_id?: number;

  @IsOptional()
  @IsEnum(BaggageStatus)
  status?: BaggageStatus;
}

export class BaggageStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  airport_id?: number;

  @IsOptional()
  @IsEnum(BaggageStatus)
  status?: BaggageStatus;
}

export class BaggageStatisticsResponseDto {
  period: string;
  total_baggage: number;
  checked_in: number;
  loaded: number;
  delivered: number;
  lost: number;
  average_weight: number;
  total_weight: number;
  special_handling_count: number;
  lost_percentage: number;
}

export class TrackBaggageDto {
  @IsString()
  baggage_tag: string;
}

export class TrackBaggageResponseDto {
  baggage_id: number;
  baggage_tag: string;
  passenger_name: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  status: BaggageStatus;
  status_history: Array<{
    status: BaggageStatus;
    timestamp: Date;
    location?: string;
  }>;
  current_location?: string;
  estimated_delivery?: Date;
}

export class UpdateBaggageStatusDto {
  @Type(() => Number)
  @IsNumber()
  baggage_id: number;

  @IsEnum(BaggageStatus)
  status: BaggageStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

