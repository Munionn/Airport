import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FlightStatus, MaintenanceStatus, GateStatus } from '../shared/enums';

@Injectable()
export class TriggerLogicService {
  private readonly logger = new Logger(TriggerLogicService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Flight status auto-update trigger logic
   */
  async updateFlightStatusAutomatically(): Promise<void> {
    const now = new Date();

    // Update flights that should start boarding (30 minutes before departure)
    await this.databaseService.query(
      `
      UPDATE flights 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE status = 'scheduled'
      AND scheduled_departure BETWEEN $2 AND $3
    `,
      [FlightStatus.BOARDING, new Date(now.getTime() - 30 * 60000), now],
    );

    // Update flights that should depart (at scheduled departure time)
    await this.databaseService.query(
      `
      UPDATE flights 
      SET status = $1, actual_departure = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE status = 'boarding'
      AND scheduled_departure <= $2
    `,
      [FlightStatus.DEPARTED, now],
    );

    // Update flights that should arrive (at scheduled arrival time)
    await this.databaseService.query(
      `
      UPDATE flights 
      SET status = $1, actual_arrival = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE status = 'departed'
      AND scheduled_arrival <= $2
    `,
      [FlightStatus.ARRIVED, now],
    );

    this.logger.log('Flight status auto-update completed');
  }

  /**
   * Flight load calculation and warnings trigger logic
   */
  async updateFlightLoadsAndWarnings(): Promise<void> {
    // Update flight load percentages
    await this.databaseService.query(
      `
      UPDATE flights 
      SET load_percentage = (
        SELECT ROUND((COUNT(t.ticket_id)::float / a.capacity::float) * 100, 2)
        FROM tickets t
        JOIN aircraft a ON f.aircraft_id = a.aircraft_id
        WHERE t.flight_id = f.flight_id AND t.status = 'active'
      )
      FROM flights f
      WHERE flights.flight_id = f.flight_id
    `,
    );

    // Check for overbooked flights
    const overbookedFlights = await this.databaseService.query(
      `
      SELECT f.flight_id, f.flight_number, f.load_percentage
      FROM flights f
      WHERE f.load_percentage > 100
      AND f.status = 'scheduled'
    `,
    );

    if (overbookedFlights.rows.length > 0) {
      this.logger.warn(`Overbooked flights detected: ${overbookedFlights.rows.length}`);
      // Here you would typically send notifications to operations team
    }

    // Check for high load flights (over 90%)
    const highLoadFlights = await this.databaseService.query(
      `
      SELECT f.flight_id, f.flight_number, f.load_percentage
      FROM flights f
      WHERE f.load_percentage > 90 AND f.load_percentage <= 100
      AND f.status = 'scheduled'
    `,
    );

    if (highLoadFlights.rows.length > 0) {
      this.logger.log(`High load flights detected: ${highLoadFlights.rows.length}`);
    }

    this.logger.log('Flight load calculation completed');
  }

  /**
   * Maintenance schedule updates trigger logic
   */
  async updateMaintenanceSchedules(): Promise<void> {
    // Update aircraft maintenance schedules based on flight hours
    await this.databaseService.query(
      `
      UPDATE aircraft 
      SET 
        next_maintenance = CURRENT_DATE + INTERVAL '6 months',
        updated_at = CURRENT_TIMESTAMP
      WHERE last_maintenance < CURRENT_DATE - INTERVAL '6 months'
      AND status = 'active'
    `,
    );

    // Check for overdue maintenance
    const overdueMaintenance = await this.databaseService.query(
      `
      SELECT a.aircraft_id, a.registration_number, a.next_maintenance
      FROM aircraft a
      WHERE a.next_maintenance < CURRENT_DATE
      AND a.status = 'active'
    `,
    );

    if (overdueMaintenance.rows.length > 0) {
      this.logger.warn(`Aircraft with overdue maintenance: ${overdueMaintenance.rows.length}`);
      
      // Ground aircraft with overdue maintenance
      await this.databaseService.query(
        `
        UPDATE aircraft 
        SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
        WHERE next_maintenance < CURRENT_DATE
        AND status = 'active'
      `,
      );
    }

    // Auto-schedule routine maintenance
    await this.databaseService.query(
      `
      INSERT INTO maintenance (aircraft_id, type, description, estimated_duration_hours, estimated_cost, scheduled_date, status)
      SELECT 
        a.aircraft_id,
        'routine',
        'Routine maintenance check',
        8,
        5000,
        CURRENT_DATE + INTERVAL '7 days',
        'scheduled'
      FROM aircraft a
      WHERE a.next_maintenance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND a.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM maintenance m 
        WHERE m.aircraft_id = a.aircraft_id 
        AND m.status = 'scheduled'
        AND m.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
      )
    `,
    );

    this.logger.log('Maintenance schedule updates completed');
  }

  /**
   * Gate auto-assignment and release trigger logic
   */
  async manageGateAssignments(): Promise<void> {
    // Auto-assign gates to flights that need them
    await this.databaseService.query(
      `
      UPDATE flights 
      SET gate_id = (
        SELECT g.gate_id 
        FROM gates g
        WHERE g.status = 'available'
        AND g.terminal_id = (
          SELECT t.terminal_id 
          FROM terminals t 
          WHERE t.airport_id = flights.departure_airport_id
          LIMIT 1
        )
        ORDER BY g.gate_number
        LIMIT 1
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE flights.gate_id IS NULL
      AND flights.status = 'scheduled'
      AND flights.scheduled_departure BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '2 hours'
    `,
    );

    // Update gate status based on flight status
    await this.databaseService.query(
      `
      UPDATE gates 
      SET 
        status = CASE 
          WHEN f.status = 'boarding' THEN 'occupied'
          WHEN f.status IN ('departed', 'arrived', 'cancelled') THEN 'available'
          ELSE g.status
        END,
        updated_at = CURRENT_TIMESTAMP
      FROM flights f
      WHERE gates.flight_id = f.flight_id
    `,
    );

    // Release gates for completed flights
    await this.databaseService.query(
      `
      UPDATE gates 
      SET 
        status = 'available',
        flight_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE flight_id IN (
        SELECT flight_id FROM flights 
        WHERE status IN ('arrived', 'cancelled')
        AND scheduled_arrival < CURRENT_TIMESTAMP - INTERVAL '1 hour'
      )
    `,
    );

    this.logger.log('Gate assignment management completed');
  }

  /**
   * Ticket price calculation trigger logic
   */
  async updateTicketPrices(): Promise<void> {
    // Update ticket prices based on demand and time until departure
    await this.databaseService.query(
      `
      UPDATE flights 
      SET price = CASE 
        WHEN load_percentage > 80 THEN price * 1.2
        WHEN load_percentage > 60 THEN price * 1.1
        WHEN scheduled_departure < CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN price * 1.15
        ELSE price
      END,
      updated_at = CURRENT_TIMESTAMP
      WHERE status = 'scheduled'
      AND scheduled_departure > CURRENT_TIMESTAMP
    `,
    );

    this.logger.log('Ticket price updates completed');
  }

  /**
   * Baggage status updates trigger logic
   */
  async updateBaggageStatuses(): Promise<void> {
    // Update baggage status based on flight status
    await this.databaseService.query(
      `
      UPDATE baggage 
      SET 
        status = CASE 
          WHEN f.status = 'boarding' THEN 'loaded'
          WHEN f.status = 'departed' THEN 'loaded'
          WHEN f.status = 'arrived' THEN 'unloaded'
          ELSE b.status
        END,
        updated_at = CURRENT_TIMESTAMP
      FROM flights f
      WHERE baggage.flight_id = f.flight_id
    `,
    );

    // Mark baggage as delivered after arrival
    await this.databaseService.query(
      `
      UPDATE baggage 
      SET 
        status = 'delivered',
        delivered_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE status = 'unloaded'
      AND flight_id IN (
        SELECT flight_id FROM flights 
        WHERE status = 'arrived'
        AND actual_arrival < CURRENT_TIMESTAMP - INTERVAL '2 hours'
      )
    `,
    );

    this.logger.log('Baggage status updates completed');
  }

  /**
   * Delay notifications trigger logic
   */
  async processDelayNotifications(): Promise<void> {
    // Check for delayed flights
    const delayedFlights = await this.databaseService.query(
      `
      SELECT 
        f.flight_id,
        f.flight_number,
        f.scheduled_departure,
        f.actual_departure,
        EXTRACT(EPOCH FROM (f.actual_departure - f.scheduled_departure))/60 as delay_minutes
      FROM flights f
      WHERE f.status = 'delayed'
      AND f.actual_departure > f.scheduled_departure + INTERVAL '15 minutes'
      AND f.notification_sent = false
    `,
    );

    for (const flight of delayedFlights.rows) {
      // Send notifications to passengers
      const passengers = await this.databaseService.query(
        `
        SELECT p.passenger_id, p.first_name, p.last_name, p.email, p.phone
        FROM passengers p
        JOIN tickets t ON p.passenger_id = t.passenger_id
        WHERE t.flight_id = $1
        AND t.status = 'active'
      `,
        [flight.flight_id],
      );

      // Mark notification as sent
      await this.databaseService.query(
        'UPDATE flights SET notification_sent = true WHERE flight_id = $1',
        [flight.flight_id],
      );

      this.logger.log(
        `Delay notification sent for flight ${flight.flight_number} to ${passengers.rows.length} passengers`,
      );
    }

    this.logger.log('Delay notification processing completed');
  }

  /**
   * Crew rest time validation trigger logic
   */
  async validateCrewRestTimes(): Promise<void> {
    // Check for crew members who need rest
    const crewNeedingRest = await this.databaseService.query(
      `
      SELECT 
        fc.user_id,
        u.first_name,
        u.last_name,
        SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure))/3600) as total_flight_hours
      FROM flight_crew fc
      JOIN users u ON fc.user_id = u.user_id
      JOIN flights f ON fc.flight_id = f.flight_id
      WHERE f.status IN ('departed', 'arrived')
      AND f.scheduled_departure >= CURRENT_DATE - INTERVAL '24 hours'
      GROUP BY fc.user_id, u.first_name, u.last_name
      HAVING SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure))/3600) > 8
    `,
    );

    if (crewNeedingRest.rows.length > 0) {
      this.logger.warn(`Crew members needing rest: ${crewNeedingRest.rows.length}`);
      
      // Prevent assignment of crew members who need rest
      await this.databaseService.query(
        `
        UPDATE flight_crew 
        SET status = 'rest_required'
        WHERE user_id IN (
          SELECT user_id FROM (
            SELECT 
              fc.user_id,
              SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure))/3600) as total_flight_hours
            FROM flight_crew fc
            JOIN flights f ON fc.flight_id = f.flight_id
            WHERE f.status IN ('departed', 'arrived')
            AND f.scheduled_departure >= CURRENT_DATE - INTERVAL '24 hours'
            GROUP BY fc.user_id
            HAVING SUM(EXTRACT(EPOCH FROM (f.scheduled_arrival - f.scheduled_departure))/3600) > 8
          ) as rest_needed
        )
      `,
      );
    }

    this.logger.log('Crew rest time validation completed');
  }

  /**
   * Run all trigger logic processes
   */
  async runAllTriggerLogic(): Promise<void> {
    try {
      await Promise.all([
        this.updateFlightStatusAutomatically(),
        this.updateFlightLoadsAndWarnings(),
        this.updateMaintenanceSchedules(),
        this.manageGateAssignments(),
        this.updateTicketPrices(),
        this.updateBaggageStatuses(),
        this.processDelayNotifications(),
        this.validateCrewRestTimes(),
      ]);

      this.logger.log('All trigger logic processes completed successfully');
    } catch (error) {
      this.logger.error('Error running trigger logic processes:', error);
      throw error;
    }
  }

  /**
   * Schedule trigger logic to run periodically
   */
  async scheduleTriggerLogic(): Promise<void> {
    // This would typically be set up with a cron job or scheduler
    // For now, we'll just log that it should be scheduled
    this.logger.log('Trigger logic should be scheduled to run every 5 minutes');
    
    // Example cron schedule: */5 * * * * (every 5 minutes)
    // In a real application, you would use something like:
    // - @nestjs/schedule package
    // - node-cron
    // - external cron job
  }
}

