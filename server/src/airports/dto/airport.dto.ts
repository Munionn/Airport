import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { TerminalStatus } from '../../shared/enums';

export class CreateAirportDto {
  @IsString()
  iata_code: string;

  @IsString()
  icao_code: string;

  @IsString()
  airport_name: string;

  @Type(() => Number)
  @IsNumber()
  city_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class UpdateAirportDto {
  @IsOptional()
  @IsString()
  iata_code?: string;

  @IsOptional()
  @IsString()
  icao_code?: string;

  @IsOptional()
  @IsString()
  airport_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  city_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class AirportResponseDto {
  airport_id: number;
  iata_code: string;
  icao_code: string;
  airport_name: string;
  city_id: number;
  city_name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  website?: string;
  status?: TerminalStatus;
  created_at: Date;
  updated_at: Date;
}

export class SearchAirportsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  iata_code?: string;

  @IsOptional()
  @IsString()
  icao_code?: string;

  @IsOptional()
  @IsString()
  airport_name?: string;

  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  city_id?: number;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class AirportStatisticsDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsEnum(TerminalStatus)
  status?: TerminalStatus;
}

export class AirportStatisticsResponseDto {
  airport_id: number;
  iata_code: string;
  airport_name: string;
  city_name: string;
  country: string;
  total_flights: number;
  total_passengers: number;
  total_departures: number;
  total_arrivals: number;
  average_daily_flights: number;
  busiest_hour: number;
  most_popular_destination: string;
  terminal_count: number;
  gate_count: number;
}

export class AirportDistanceDto {
  @Type(() => Number)
  @IsNumber()
  from_airport_id: number;

  @Type(() => Number)
  @IsNumber()
  to_airport_id: number;
}

export class AirportDistanceResponseDto {
  from_airport: {
    airport_id: number;
    iata_code: string;
    airport_name: string;
    latitude: number;
    longitude: number;
  };
  to_airport: {
    airport_id: number;
    iata_code: string;
    airport_name: string;
    latitude: number;
    longitude: number;
  };
  distance_km: number;
  estimated_flight_time_minutes: number;
}
