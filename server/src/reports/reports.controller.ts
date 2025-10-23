import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  FlightStatisticsReportDto,
  RevenueReportDto,
  AirportStatisticsReportDto,
  EuropeanPassengerReportDto,
  DataIntegrityReportDto,
  CustomReportDto,
} from './dto/reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('flight-statistics')
  @HttpCode(HttpStatus.OK)
  generateFlightStatisticsReport(@Body() reportDto: FlightStatisticsReportDto) {
    return this.reportsService.generateFlightStatisticsReport(reportDto);
  }

  @Post('revenue')
  @HttpCode(HttpStatus.OK)
  generateRevenueReport(@Body() reportDto: RevenueReportDto) {
    return this.reportsService.generateRevenueReport(reportDto);
  }

  @Post('airport-statistics')
  @HttpCode(HttpStatus.OK)
  generateAirportStatisticsReport(@Body() reportDto: AirportStatisticsReportDto) {
    return this.reportsService.generateFlightStatisticsReport(reportDto);
  }

  @Post('european-passengers')
  @HttpCode(HttpStatus.OK)
  generateEuropeanPassengerReport(@Body() reportDto: EuropeanPassengerReportDto) {
    return this.reportsService.generateEuropeanPassengerReport(reportDto);
  }

  @Post('data-integrity')
  @HttpCode(HttpStatus.OK)
  generateDataIntegrityReport(@Body() reportDto: DataIntegrityReportDto) {
    return this.reportsService.generateDataIntegrityReport(reportDto);
  }

  @Post('custom')
  @HttpCode(HttpStatus.OK)
  generateCustomReport(@Body() reportDto: CustomReportDto) {
    return this.reportsService.generateCustomReport(reportDto);
  }

  @Get('available-reports')
  @HttpCode(HttpStatus.OK)
  getAvailableReports() {
    return {
      reports: [
        {
          name: 'Flight Statistics',
          endpoint: '/reports/flight-statistics',
          description: 'Comprehensive flight performance and statistics report',
          parameters: ['date_from', 'date_to', 'period', 'airport_id', 'route_id', 'aircraft_id'],
        },
        {
          name: 'Revenue Analysis',
          endpoint: '/reports/revenue',
          description: 'Detailed revenue analysis with cost breakdown',
          parameters: ['date_from', 'date_to', 'breakdown_by', 'airport_id', 'route_id'],
        },
        {
          name: 'Airport Statistics',
          endpoint: '/reports/airport-statistics',
          description: 'Airport performance and operational statistics',
          parameters: ['date_from', 'date_to', 'airport_id'],
        },
        {
          name: 'European Passengers',
          endpoint: '/reports/european-passengers',
          description: 'European passenger statistics and travel patterns',
          parameters: ['date_from', 'date_to', 'nationality', 'country'],
        },
        {
          name: 'Data Integrity',
          endpoint: '/reports/data-integrity',
          description: 'Data quality and integrity assessment report',
          parameters: ['check_type'],
        },
        {
          name: 'Custom Report',
          endpoint: '/reports/custom',
          description: 'Generate custom reports with user-defined parameters',
          parameters: ['report_name', 'report_description', 'query_type', 'custom_filters'],
        },
      ],
    };
  }
}
