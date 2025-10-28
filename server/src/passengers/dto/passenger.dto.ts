import { IsOptional, IsString, IsNumber, IsDateString, IsEmail, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class CreatePassengerDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  passport_number: string;

  @IsString()
  nationality: string;

  @IsDateString()
  date_of_birth: Date;

  @IsOptional()
  @IsString()
  special_requirements?: string;
}

export class UpdatePassengerDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  passport_number?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  special_requirements?: string;
}

export class SearchPassengerDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  passport_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  frequent_flyer?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class PassengerInfoDto {
  @Type(() => Number)
  @IsNumber()
  passenger_id: number;

  @IsOptional()
  @IsString()
  flight_number?: string;

  @IsOptional()
  @IsDateString()
  flight_date?: Date;
}

export class PassengerStatisticsDto {
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  group_by?: 'nationality' | 'country' | 'month' | 'year';
}

export class PassengerResponseDto {
  passenger_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  passport_number: string;
  nationality: string;
  date_of_birth: Date;
  address?: string;
  city?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  frequent_flyer: boolean;
  frequent_flyer_number?: string;
  created_at: Date;
  updated_at: Date;
  // Additional computed fields
  total_flights?: number;
  total_distance?: number;
  loyalty_points?: number;
  last_flight_date?: Date;
}

export class PassengerStatisticsResponseDto {
  period: string;
  total_passengers: number;
  new_passengers: number;
  returning_passengers: number;
  frequent_flyers: number;
  passengers_by_nationality: Record<string, number>;
  passengers_by_country: Record<string, number>;
  average_age: number;
  top_cities: Array<{
    city: string;
    passenger_count: number;
  }>;
  loyalty_distribution: Record<string, number>;
}

export class RegisterPassengerForFlightDto {
  @Type(() => Number)
  @IsNumber()
  passenger_id: number;

  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsOptional()
  @IsString()
  seat_preference?: string;

  @IsOptional()
  @IsString()
  meal_preference?: string;

  @IsOptional()
  @IsString()
  special_requests?: string;
}

export class PassengerFlightHistoryDto {
  @Type(() => Number)
  @IsNumber()
  passenger_id: number;

  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

  @IsOptional()
  @IsString()
  status?: string;
}
