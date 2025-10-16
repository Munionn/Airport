import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  AuditLogQueryDto,
  AuditStatisticsDto,
  AuditReportDto,
} from './dto/audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  getAuditLogs(@Query() queryDto: AuditLogQueryDto) {
    return this.auditService.getAuditLogs(queryDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: AuditStatisticsDto) {
    return this.auditService.getAuditStatistics(statisticsDto);
  }

  @Get('summary')
  getAuditSummary() {
    return this.auditService.getAuditSummary();
  }

  @Post('report')
  generateAuditReport(@Body() reportDto: AuditReportDto) {
    return this.auditService.generateAuditReport(reportDto);
  }

  @Get('logs/record/:tableName/:recordId')
  getAuditLogsForRecord(
    @Param('tableName') tableName: string,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.auditService.getAuditLogsForRecord(tableName, recordId);
  }

  @Get('logs/table/:tableName')
  getAuditLogsForTable(
    @Param('tableName') tableName: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getAuditLogsForTable(tableName, limit);
  }

  @Get('logs/user/:userId')
  getAuditLogsForUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getAuditLogsForUser(userId, limit);
  }

  @Get('logs/:id')
  getAuditLogById(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.getAuditLogById(id);
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  cleanOldAuditLogs(@Body('retentionDays') retentionDays?: number) {
    return this.auditService.cleanOldAuditLogs(retentionDays);
  }
}

