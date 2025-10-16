import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/base.dto';

export class AuditLogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  table_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  record_id?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AuditLogResponseDto {
  audit_id: number;
  table_name: string;
  record_id: number;
  action: string;
  old_values: any;
  new_values: any;
  user_id?: number;
  user_name?: string;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export class AuditStatisticsDto {
  @IsOptional()
  @IsString()
  table_name?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  period?: string;
}

export class AuditStatisticsResponseDto {
  period: string;
  total_audit_logs: number;
  logs_by_table: Record<string, number>;
  logs_by_action: Record<string, number>;
  logs_by_user: Array<{
    user_id: number;
    user_name: string;
    log_count: number;
  }>;
  daily_activity: Array<{
    date: string;
    log_count: number;
  }>;
  most_active_tables: Array<{
    table_name: string;
    log_count: number;
    last_activity: Date;
  }>;
  recent_activities: Array<{
    audit_id: number;
    table_name: string;
    action: string;
    user_name: string;
    created_at: Date;
  }>;
}

export class AuditReportDto {
  @IsOptional()
  @IsString()
  table_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  record_id?: number;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  format?: string; // 'json' | 'csv' | 'pdf'
}

export class AuditReportResponseDto {
  report_id: string;
  generated_at: Date;
  period: {
    from: Date;
    to: Date;
  };
  total_records: number;
  format: string;
  download_url?: string;
  data: AuditLogResponseDto[];
}
