import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';
import { MaintenanceType, MaintenanceStatus } from '../../shared/enums';

export class CreateMaintenanceDto {
  @Type(() => Number)
  @IsNumber()
  aircraft_id: number;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  estimated_duration_hours: number;

  @Type(() => Number)
  @IsNumber()
  estimated_cost: number;

  @IsOptional()
  @IsString()
  scheduled_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  parts_required?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  technician_id?: number;
}

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimated_duration_hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actual_duration_hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimated_cost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actual_cost?: number;

  @IsOptional()
  @IsString()
  scheduled_date?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  completion_date?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  parts_required?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  technician_id?: number;
}

export class MaintenanceResponseDto {
  maintenance_id: number;
  aircraft_id: number;
  registration_number?: string;
  model_name?: string;
  type: MaintenanceType;
  description: string;
  estimated_duration_hours: number;
  actual_duration_hours?: number;
  estimated_cost: number;
  actual_cost?: number;
  scheduled_date?: Date;
  start_date?: Date;
  completion_date?: Date;
  status: MaintenanceStatus;
  notes?: string;
  parts_required?: string;
  technician_id?: number;
  technician_name?: string;
  created_at: Date;
  updated_at: Date;
}

export class SearchMaintenanceDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aircraft_id?: number;

  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  technician_id?: number;

  @IsOptional()
  @IsString()
  scheduled_date_from?: string;

  @IsOptional()
  @IsString()
  scheduled_date_to?: string;
}

export class MaintenanceStatisticsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  aircraft_id?: number;

  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  period?: string;
}

export class MaintenanceStatisticsResponseDto {
  period: string;
  total_maintenance: number;
  completed_maintenance: number;
  scheduled_maintenance: number;
  in_progress_maintenance: number;
  cancelled_maintenance: number;
  total_cost: number;
  average_duration_hours: number;
  maintenance_by_type: Record<MaintenanceType, number>;
  maintenance_by_status: Record<MaintenanceStatus, number>;
  upcoming_maintenance: Array<{
    maintenance_id: number;
    aircraft_id: number;
    registration_number: string;
    type: MaintenanceType;
    scheduled_date: Date;
    days_until_due: number;
  }>;
  overdue_maintenance: Array<{
    maintenance_id: number;
    aircraft_id: number;
    registration_number: string;
    type: MaintenanceType;
    scheduled_date: Date;
    days_overdue: number;
  }>;
}

export class ScheduleMaintenanceDto {
  @Type(() => Number)
  @IsNumber()
  aircraft_id: number;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  estimated_duration_hours: number;

  @Type(() => Number)
  @IsNumber()
  estimated_cost: number;

  @IsString()
  scheduled_date: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  parts_required?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  technician_id?: number;
}

export class CompleteMaintenanceDto {
  @Type(() => Number)
  @IsNumber()
  maintenance_id: number;

  @Type(() => Number)
  @IsNumber()
  actual_duration_hours: number;

  @Type(() => Number)
  @IsNumber()
  actual_cost: number;

  @IsString()
  completion_notes: string;

  @IsOptional()
  @IsString()
  parts_used?: string;
}
