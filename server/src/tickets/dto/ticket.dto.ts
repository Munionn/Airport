import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TicketClass, TicketStatus } from '../../shared/enums';
import { PaginationDto, FilterDto } from '../../shared/dto/base.dto';

export class CreateTicketDto {
  @Type(() => Number)
  @IsNumber()
  passenger_id: number;

  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsOptional()
  @IsString()
  seat_number?: string;

  @IsEnum(TicketClass)
  class: TicketClass;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  meal_preference?: string;

  @IsOptional()
  @IsString()
  special_requests?: string;

  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @IsOptional()
  @IsString()
  booking_reference?: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  seat_number?: string;

  @IsOptional()
  @IsEnum(TicketClass)
  class?: TicketClass;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  meal_preference?: string;

  @IsOptional()
  @IsString()
  special_requests?: string;

  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @IsOptional()
  @IsDateString()
  check_in_time?: Date;

  @IsOptional()
  @IsString()
  boarding_pass_number?: string;
}

export class SearchTicketDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  passenger_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  flight_id?: number;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketClass)
  class?: TicketClass;

  @IsOptional()
  @IsDateString()
  booking_date_from?: Date;

  @IsOptional()
  @IsDateString()
  booking_date_to?: Date;

  @IsOptional()
  @IsString()
  booking_reference?: string;
}

export class CheckInDto {
  @Type(() => Number)
  @IsNumber()
  ticket_id: number;

  @IsOptional()
  @IsString()
  seat_number?: string;

  @IsOptional()
  @IsString()
  meal_preference?: string;

  @IsOptional()
  @IsString()
  special_requests?: string;
}

export class SeatSelectionDto {
  @Type(() => Number)
  @IsNumber()
  ticket_id: number;

  @IsString()
  seat_number: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  additional_fee?: number;
}

export class TicketCancellationDto {
  @Type(() => Number)
  @IsNumber()
  ticket_id: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsBoolean()
  request_refund?: boolean;

  @IsOptional()
  @IsString()
  alternative_flight?: string;
}

export class TicketRefundDto {
  @Type(() => Number)
  @IsNumber()
  ticket_id: number;

  @IsString()
  reason: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  refund_percentage?: number;

  @IsOptional()
  @IsString()
  refund_method?: string;
}

export class TicketResponseDto {
  ticket_id: number;
  ticket_number: string;
  passenger_id: number;
  flight_id: number;
  seat_number?: string;
  class: TicketClass;
  price: number;
  status: TicketStatus;
  meal_preference?: string;
  special_requests?: string;
  insurance: boolean;
  booking_reference?: string;
  check_in_time?: Date;
  boarding_pass_number?: string;
  created_at: Date;
  updated_at: Date;
  // Additional computed fields
  passenger_name?: string;
  flight_number?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_time?: Date;
  arrival_time?: Date;
  is_checkin_available?: boolean;
  refund_amount?: number;
}

export class SeatAvailabilityDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsOptional()
  @IsEnum(TicketClass)
  class?: TicketClass;

  @IsOptional()
  @IsBoolean()
  include_details?: boolean;
}

export class SeatAvailabilityResponseDto {
  flight_id: number;
  total_seats: number;
  available_seats: number;
  occupied_seats: number;
  seats_by_class: Record<
    TicketClass,
    {
      total: number;
      available: number;
      occupied: number;
      price: number;
    }
  >;
  seat_map?: Array<{
    seat_number: string;
    class: TicketClass;
    status: 'available' | 'occupied' | 'blocked';
    price?: number;
  }>;
}

export class TicketStatisticsDto {
  @IsOptional()
  @IsDateString()
  start_date?: Date;

  @IsOptional()
  @IsDateString()
  end_date?: Date;

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
  group_by?: 'day' | 'week' | 'month' | 'class' | 'status';
}

export class TicketStatisticsResponseDto {
  period: string;
  total_tickets: number;
  sold_tickets: number;
  cancelled_tickets: number;
  refunded_tickets: number;
  total_revenue: number;
  refunded_amount: number;
  net_revenue: number;
  tickets_by_class: Record<
    TicketClass,
    {
      count: number;
      revenue: number;
    }
  >;
  tickets_by_status: Record<TicketStatus, number>;
  average_ticket_price: number;
  check_in_rate: number;
  no_show_rate: number;
}

export class TicketPricingDto {
  @Type(() => Number)
  @IsNumber()
  flight_id: number;

  @IsEnum(TicketClass)
  class: TicketClass;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  passenger_id?: number;

  @IsOptional()
  @IsBoolean()
  include_discounts?: boolean;
}

export class TicketPricingResponseDto {
  flight_id: number;
  class: TicketClass;
  base_price: number;
  taxes: number;
  fees: number;
  discounts: number;
  total_price: number;
  currency: string;
  pricing_breakdown: {
    base_fare: number;
    fuel_surcharge: number;
    airport_tax: number;
    service_fee: number;
    insurance_fee?: number;
    seat_fee?: number;
    meal_fee?: number;
  };
  available_discounts?: Array<{
    type: string;
    description: string;
    amount: number;
    percentage?: number;
  }>;
}
