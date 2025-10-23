import { api } from './client';
import type {
  FlightAnalyticsDto,
  RevenueAnalyticsDto,
  PassengerAnalyticsDto,
  OperationalAnalyticsDto,
  DelayAnalyticsDto,
  DashboardAnalyticsDto,
} from '../types';

export const analyticsApi = {
  // Get flight analytics
  getFlightAnalytics: (analyticsDto: FlightAnalyticsDto) =>
    api.get<any>('/analytics/flights', { params: analyticsDto }),

  // Get revenue analytics
  getRevenueAnalytics: (analyticsDto: RevenueAnalyticsDto) =>
    api.get<any>('/analytics/revenue', { params: analyticsDto }),

  // Get passenger analytics
  getPassengerAnalytics: (analyticsDto: PassengerAnalyticsDto) =>
    api.get<any>('/analytics/passengers', { params: analyticsDto }),

  // Get operational analytics
  getOperationalAnalytics: (analyticsDto: OperationalAnalyticsDto) =>
    api.get<any>('/analytics/operational', { params: analyticsDto }),

  // Get delay analytics
  getDelayAnalytics: (analyticsDto: DelayAnalyticsDto) =>
    api.get<any>('/analytics/delays', { params: analyticsDto }),

  // Get dashboard analytics
  getDashboardAnalytics: (analyticsDto: DashboardAnalyticsDto) =>
    api.get<any>('/analytics/dashboard', { params: analyticsDto }),
};
