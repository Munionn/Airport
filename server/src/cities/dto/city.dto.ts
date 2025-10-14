import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class CreateCityDto {
  @IsString()
  city_name: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  timezone?: string;

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
  region?: string;

  @IsOptional()
  @IsString()
  country_code?: string;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

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
  region?: string;

  @IsOptional()
  @IsString()
  country_code?: string;
}

export class CityResponseDto {
  city_id: number;
  city_name: string;
  country: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  country_code?: string;
  created_at: Date;
  updated_at: Date;
}

export class SearchCitiesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CityStatisticsDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;
}

export class CityStatisticsResponseDto {
  city_id: number;
  city_name: string;
  country: string;
  airport_count: number;
  total_flights: number;
  total_passengers: number;
  average_flight_duration: number;
  most_popular_destination: string;
  busiest_month: string;
}
