import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  FlightAnalyticsDto,
  RevenueAnalyticsDto,
  PassengerAnalyticsDto,
  OperationalAnalyticsDto,
  DelayAnalyticsDto,
  DashboardAnalyticsDto,
} from './dto/analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('flights')
  getFlightAnalytics(@Query() analyticsDto: FlightAnalyticsDto) {
    return this.analyticsService.getFlightAnalytics(analyticsDto);
  }

  @Get('revenue')
  getRevenueAnalytics(@Query() analyticsDto: RevenueAnalyticsDto) {
    return this.analyticsService.getRevenueAnalytics(analyticsDto);
  }

  @Get('passengers')
  getPassengerAnalytics(@Query() analyticsDto: PassengerAnalyticsDto) {
    return this.analyticsService.getPassengerAnalytics(analyticsDto);
  }

  @Get('operational')
  getOperationalAnalytics(@Query() analyticsDto: OperationalAnalyticsDto) {
    return this.analyticsService.getOperationalAnalytics(analyticsDto);
  }

  @Get('delays')
  getDelayAnalytics(@Query() analyticsDto: DelayAnalyticsDto) {
    return this.analyticsService.getDelayAnalytics(analyticsDto);
  }

  @Get('dashboard')
  getDashboardAnalytics(@Query() analyticsDto: DashboardAnalyticsDto) {
    return this.analyticsService.getDashboardAnalytics(analyticsDto);
  }
}

