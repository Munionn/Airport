import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HelperFunctionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Check if seat is available (from triggers_and_procedures.sql #3.1)
   */
  async isSeatAvailable(flightId: number, seatNumber: string): Promise<boolean> {
    const result = await this.databaseService.query(
      `
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM tickets 
            WHERE flight_id = $1 AND seat_number = $2 AND status = 'active'
          ) THEN false
          ELSE true
        END as is_available
    `,
      [flightId, seatNumber],
    );

    return result.rows[0].is_available;
  }

  /**
   * Calculate flight load percentage (from triggers_and_procedures.sql #3.2)
   */
  async calculateFlightLoadPercentage(flightId: number): Promise<number> {
    const result = await this.databaseService.query(
      `
      SELECT 
        ROUND(
          (COUNT(t.ticket_id)::float / a.capacity::float) * 100, 2
        ) as load_percentage
      FROM flights f
      JOIN aircraft a ON f.aircraft_id = a.aircraft_id
      LEFT JOIN tickets t ON f.flight_id = t.flight_id AND t.status = 'active'
      WHERE f.flight_id = $1
      GROUP BY a.capacity
    `,
      [flightId],
    );

    return result.rows.length > 0 ? parseFloat(result.rows[0].load_percentage || '0') : 0;
  }

  /**
   * Generate unique ticket number (from triggers_and_procedures.sql #3.3)
   */
  generateTicketNumber(): string {
    const prefix = 'TK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate unique baggage tag number
   */
  generateBaggageTagNumber(): string {
    const prefix = 'BG';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate unique maintenance ID
   */
  generateMaintenanceId(): string {
    const prefix = 'MT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate flight duration in hours
   */
  calculateFlightDuration(departureTime: Date, arrivalTime: Date): number {
    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    return durationMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate delay in minutes
   */
  calculateDelayMinutes(scheduledTime: Date, actualTime: Date): number {
    const delayMs = actualTime.getTime() - scheduledTime.getTime();
    return Math.round(delayMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Check if flight is on time (within 15 minutes of scheduled time)
   */
  isFlightOnTime(scheduledTime: Date, actualTime: Date): boolean {
    const delayMinutes = this.calculateDelayMinutes(scheduledTime, actualTime);
    return delayMinutes <= 15;
  }

  /**
   * Calculate ticket price based on class and booking time
   */
  calculateTicketPrice(
    basePrice: number,
    ticketClass: 'economy' | 'business' | 'first',
    bookingTime?: Date,
    departureTime?: Date,
  ): number {
    const classMultipliers = {
      economy: 1.0,
      business: 1.5,
      first: 2.0,
    };

    let price = basePrice * classMultipliers[ticketClass];

    // Apply dynamic pricing based on booking time
    if (bookingTime && departureTime) {
      const hoursUntilDeparture = (departureTime.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDeparture < 24) {
        price *= 1.2; // 20% increase for last-minute bookings
      } else if (hoursUntilDeparture < 72) {
        price *= 1.1; // 10% increase for bookings within 3 days
      }
    }

    return Math.round(price);
  }

  /**
   * Calculate refund amount based on cancellation time
   */
  calculateRefundAmount(
    ticketPrice: number,
    cancellationTime: Date,
    departureTime: Date,
  ): number {
    const hoursUntilDeparture = (departureTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeparture > 24) {
      return ticketPrice; // Full refund
    } else if (hoursUntilDeparture > 2) {
      return ticketPrice * 0.8; // 80% refund
    } else if (hoursUntilDeparture > 0) {
      return ticketPrice * 0.5; // 50% refund
    } else {
      return 0; // No refund for no-show
    }
  }

  /**
   * Check if aircraft is available for maintenance
   */
  async isAircraftAvailableForMaintenance(
    aircraftId: number,
    maintenanceStartTime: Date,
    maintenanceDurationHours: number,
  ): Promise<boolean> {
    const maintenanceEndTime = new Date(maintenanceStartTime.getTime() + maintenanceDurationHours * 60 * 60 * 1000);

    const result = await this.databaseService.query(
      `
      SELECT COUNT(*) as conflicting_flights
      FROM flights f
      WHERE f.aircraft_id = $1
      AND f.status IN ('scheduled', 'boarding', 'departed')
      AND (
        (f.scheduled_departure BETWEEN $2 AND $3)
        OR (f.scheduled_arrival BETWEEN $2 AND $3)
        OR (f.scheduled_departure <= $2 AND f.scheduled_arrival >= $3)
      )
    `,
      [aircraftId, maintenanceStartTime, maintenanceEndTime],
    );

    return parseInt(result.rows[0].conflicting_flights) === 0;
  }

  /**
   * Check if crew member is available for flight
   */
  async isCrewMemberAvailable(
    userId: number,
    flightDepartureTime: Date,
    flightArrivalTime: Date,
  ): Promise<boolean> {
    // Check for overlapping flights
    const result = await this.databaseService.query(
      `
      SELECT COUNT(*) as overlapping_flights
      FROM flight_crew fc
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE fc.user_id = $1
      AND f.status IN ('scheduled', 'boarding', 'departed')
      AND (
        (f.scheduled_departure BETWEEN $2 AND $3)
        OR (f.scheduled_arrival BETWEEN $2 AND $3)
        OR (f.scheduled_departure <= $2 AND f.scheduled_arrival >= $3)
      )
    `,
      [userId, flightDepartureTime, flightArrivalTime],
    );

    return parseInt(result.rows[0].overlapping_flights) === 0;
  }

  /**
   * Check if gate is available for flight
   */
  async isGateAvailable(
    gateId: number,
    flightDepartureTime: Date,
    flightArrivalTime: Date,
  ): Promise<boolean> {
    const result = await this.databaseService.query(
      `
      SELECT COUNT(*) as conflicting_flights
      FROM flights f
      WHERE f.gate_id = $1
      AND f.status IN ('scheduled', 'boarding', 'departed')
      AND (
        (f.scheduled_departure BETWEEN $2 AND $3)
        OR (f.scheduled_arrival BETWEEN $2 AND $3)
        OR (f.scheduled_departure <= $2 AND f.scheduled_arrival >= $3)
      )
    `,
      [gateId, flightDepartureTime, flightArrivalTime],
    );

    return parseInt(result.rows[0].conflicting_flights) === 0;
  }

  /**
   * Calculate aircraft utilization rate
   */
  async calculateAircraftUtilization(aircraftId: number, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.databaseService.query(
      `
      SELECT 
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure)) / 3600
        ), 0) as total_flight_hours,
        EXTRACT(EPOCH FROM ($2 - $1)) / 3600 as total_period_hours
      FROM flights f
      WHERE f.aircraft_id = $3
      AND f.scheduled_departure BETWEEN $1 AND $2
      AND f.status IN ('departed', 'arrived')
    `,
      [startDate, endDate, aircraftId],
    );

    const totalFlightHours = parseFloat(result.rows[0].total_flight_hours);
    const totalPeriodHours = parseFloat(result.rows[0].total_period_hours);

    return totalPeriodHours > 0 ? (totalFlightHours / totalPeriodHours) * 100 : 0;
  }

  /**
   * Calculate route profitability
   */
  async calculateRouteProfitability(routeId: number, startDate: Date, endDate: Date): Promise<{
    total_revenue: number;
    total_costs: number;
    profitability: number;
    profit_margin: number;
  }> {
    const result = await this.databaseService.query(
      `
      SELECT 
        COALESCE(SUM(f.price * (
          SELECT COUNT(*) FROM tickets t 
          WHERE t.flight_id = f.flight_id AND t.status = 'active'
        )), 0) as total_revenue,
        COALESCE(SUM(f.operational_cost), 0) as total_costs
      FROM flights f
      WHERE f.route_id = $1
      AND f.scheduled_departure BETWEEN $2 AND $3
      AND f.status IN ('departed', 'arrived')
    `,
      [routeId, startDate, endDate],
    );

    const totalRevenue = parseFloat(result.rows[0].total_revenue || '0');
    const totalCosts = parseFloat(result.rows[0].total_costs || '0');
    const profitability = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (profitability / totalRevenue) * 100 : 0;

    return {
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      profitability: profitability,
      profit_margin: profitMargin,
    };
  }

  /**
   * Generate unique confirmation code
   */
  generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
      ...(format === 'long' && { weekday: 'long' }),
      ...(format === 'time' && { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  /**
   * Calculate time zone offset
   */
  getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
      return (targetTime.getTime() - utc.getTime()) / (1000 * 60);
    } catch {
      return 0;
    }
  }

  /**
   * Convert time between timezones
   */
  convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
    const offsetFrom = this.getTimezoneOffset(fromTimezone);
    const offsetTo = this.getTimezoneOffset(toTimezone);
    const offsetDiff = offsetTo - offsetFrom;
    
    return new Date(date.getTime() + offsetDiff * 60000);
  }
}

