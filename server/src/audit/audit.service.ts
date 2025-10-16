import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditStatisticsDto,
  AuditStatisticsResponseDto,
  AuditReportDto,
  AuditReportResponseDto,
} from './dto/audit.dto';
import { PaginatedResponse } from '../shared/dto/base.dto';

@Injectable()
export class AuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(queryDto: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const {
      page = 1,
      limit = 10,
      table_name,
      record_id,
      action,
      user_id,
      date_from,
      date_to,
      search,
    } = queryDto;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (table_name) {
      conditions.push(`a.table_name = $${paramIndex}`);
      params.push(table_name);
      paramIndex++;
    }

    if (record_id) {
      conditions.push(`a.record_id = $${paramIndex}`);
      params.push(record_id);
      paramIndex++;
    }

    if (action) {
      conditions.push(`a.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`a.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (date_from) {
      conditions.push(`a.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`a.created_at <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(a.table_name ILIKE $${paramIndex} OR a.action ILIKE $${paramIndex} OR a.reason ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await this.databaseService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM audit_logs a ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count.toString());

    // Get paginated results
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset],
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(audit_id: number): Promise<AuditLogResponseDto> {
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE a.audit_id = $1
    `,
      [audit_id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Audit log not found');
    }

    return result.rows[0];
  }

  /**
   * Get audit logs for a specific record
   */
  async getAuditLogsForRecord(table_name: string, record_id: number): Promise<AuditLogResponseDto[]> {
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE a.table_name = $1 AND a.record_id = $2
      ORDER BY a.created_at DESC
    `,
      [table_name, record_id],
    );

    return result.rows;
  }

  /**
   * Get audit logs for a specific table
   */
  async getAuditLogsForTable(table_name: string, limit: number = 100): Promise<AuditLogResponseDto[]> {
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE a.table_name = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `,
      [table_name, limit],
    );

    return result.rows;
  }

  /**
   * Get audit logs for a specific user
   */
  async getAuditLogsForUser(user_id: number, limit: number = 100): Promise<AuditLogResponseDto[]> {
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `,
      [user_id, limit],
    );

    return result.rows;
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(statisticsDto: AuditStatisticsDto): Promise<AuditStatisticsResponseDto> {
    const { table_name, action, date_from, date_to, period = '30_days' } = statisticsDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (table_name) {
      conditions.push(`a.table_name = $${paramIndex}`);
      params.push(table_name);
      paramIndex++;
    }

    if (action) {
      conditions.push(`a.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (date_from) {
      conditions.push(`a.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`a.created_at <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get basic statistics
    const statsResult = await this.databaseService.query(
      `
      SELECT COUNT(*) as total_audit_logs
      FROM audit_logs a
      ${whereClause}
    `,
      params,
    );

    const totalLogs = parseInt(statsResult.rows[0].total_audit_logs);

    // Get logs by table
    const tableResult = await this.databaseService.query(
      `
      SELECT 
        a.table_name,
        COUNT(*) as log_count
      FROM audit_logs a
      ${whereClause}
      GROUP BY a.table_name
      ORDER BY log_count DESC
    `,
      params,
    );

    const logsByTable: Record<string, number> = {};
    tableResult.rows.forEach((row) => {
      logsByTable[row.table_name] = parseInt(row.log_count);
    });

    // Get logs by action
    const actionResult = await this.databaseService.query(
      `
      SELECT 
        a.action,
        COUNT(*) as log_count
      FROM audit_logs a
      ${whereClause}
      GROUP BY a.action
      ORDER BY log_count DESC
    `,
      params,
    );

    const logsByAction: Record<string, number> = {};
    actionResult.rows.forEach((row) => {
      logsByAction[row.action] = parseInt(row.log_count);
    });

    // Get logs by user
    const userResult = await this.databaseService.query(
      `
      SELECT 
        a.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(*) as log_count
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      GROUP BY a.user_id, u.first_name, u.last_name
      ORDER BY log_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get daily activity
    const dailyResult = await this.databaseService.query(
      `
      SELECT 
        DATE(a.created_at) as date,
        COUNT(*) as log_count
      FROM audit_logs a
      ${whereClause}
      GROUP BY DATE(a.created_at)
      ORDER BY date DESC
      LIMIT 30
    `,
      params,
    );

    // Get most active tables
    const activeTablesResult = await this.databaseService.query(
      `
      SELECT 
        a.table_name,
        COUNT(*) as log_count,
        MAX(a.created_at) as last_activity
      FROM audit_logs a
      ${whereClause}
      GROUP BY a.table_name
      ORDER BY log_count DESC
      LIMIT 10
    `,
      params,
    );

    // Get recent activities
    const recentResult = await this.databaseService.query(
      `
      SELECT 
        a.audit_id,
        a.table_name,
        a.action,
        u.first_name || ' ' || u.last_name as user_name,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 20
    `,
      params,
    );

    return {
      period,
      total_audit_logs: totalLogs,
      logs_by_table: logsByTable,
      logs_by_action: logsByAction,
      logs_by_user: userResult.rows.map((row) => ({
        user_id: row.user_id,
        user_name: row.user_name || 'Unknown',
        log_count: parseInt(row.log_count),
      })),
      daily_activity: dailyResult.rows.map((row) => ({
        date: row.date,
        log_count: parseInt(row.log_count),
      })),
      most_active_tables: activeTablesResult.rows.map((row) => ({
        table_name: row.table_name,
        log_count: parseInt(row.log_count),
        last_activity: row.last_activity,
      })),
      recent_activities: recentResult.rows.map((row) => ({
        audit_id: row.audit_id,
        table_name: row.table_name,
        action: row.action,
        user_name: row.user_name || 'System',
        created_at: row.created_at,
      })),
    };
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(reportDto: AuditReportDto): Promise<AuditReportResponseDto> {
    const { table_name, record_id, action, date_from, date_to, format = 'json' } = reportDto;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (table_name) {
      conditions.push(`a.table_name = $${paramIndex}`);
      params.push(table_name);
      paramIndex++;
    }

    if (record_id) {
      conditions.push(`a.record_id = $${paramIndex}`);
      params.push(record_id);
      paramIndex++;
    }

    if (action) {
      conditions.push(`a.action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (date_from) {
      conditions.push(`a.created_at >= $${paramIndex}`);
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      conditions.push(`a.created_at <= $${paramIndex}`);
      params.push(date_to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get audit logs for report
    const result = await this.databaseService.query<AuditLogResponseDto>(
      `
      SELECT 
        a.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
    `,
      params,
    );

    const reportId = `audit_report_${Date.now()}`;
    const generatedAt = new Date();

    return {
      report_id: reportId,
      generated_at: generatedAt,
      period: {
        from: date_from ? new Date(date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: date_to ? new Date(date_to) : new Date(),
      },
      total_records: result.rows.length,
      format,
      data: result.rows,
    };
  }

  /**
   * Clean old audit logs (retention policy)
   */
  async cleanOldAuditLogs(retentionDays: number = 365): Promise<number> {
    const result = await this.databaseService.query(
      `
      DELETE FROM audit_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '${retentionDays} days'
    `,
    );

    return result.rowCount || 0;
  }

  /**
   * Get audit log summary for dashboard
   */
  async getAuditSummary(): Promise<{
    total_logs_today: number;
    total_logs_this_week: number;
    total_logs_this_month: number;
    most_active_user: string;
    most_modified_table: string;
    recent_activities: Array<{
      table_name: string;
      action: string;
      user_name: string;
      created_at: Date;
    }>;
  }> {
    // Get counts for different periods
    const todayResult = await this.databaseService.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= CURRENT_DATE`,
    );

    const weekResult = await this.databaseService.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`,
    );

    const monthResult = await this.databaseService.query(
      `SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`,
    );

    // Get most active user
    const userResult = await this.databaseService.query(
      `
      SELECT 
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(*) as log_count
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      WHERE a.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY a.user_id, u.first_name, u.last_name
      ORDER BY log_count DESC
      LIMIT 1
    `,
    );

    // Get most modified table
    const tableResult = await this.databaseService.query(
      `
      SELECT 
        table_name,
        COUNT(*) as log_count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY table_name
      ORDER BY log_count DESC
      LIMIT 1
    `,
    );

    // Get recent activities
    const recentResult = await this.databaseService.query(
      `
      SELECT 
        a.table_name,
        a.action,
        u.first_name || ' ' || u.last_name as user_name,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `,
    );

    return {
      total_logs_today: parseInt(todayResult.rows[0].count),
      total_logs_this_week: parseInt(weekResult.rows[0].count),
      total_logs_this_month: parseInt(monthResult.rows[0].count),
      most_active_user: userResult.rows[0]?.user_name || 'Unknown',
      most_modified_table: tableResult.rows[0]?.table_name || 'None',
      recent_activities: recentResult.rows.map((row) => ({
        table_name: row.table_name,
        action: row.action,
        user_name: row.user_name || 'System',
        created_at: row.created_at,
      })),
    };
  }
}
