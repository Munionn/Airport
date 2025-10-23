import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { FlightsModule } from './flights/flights.module';
import { PassengersModule } from './passengers/passengers.module';
import { TicketsModule } from './tickets/tickets.module';
import { AircraftModule } from './aircraft/aircraft.module';
import { CitiesModule } from './cities/cities.module';
import { AirportsModule } from './airports/airports.module';
import { RoutesModule } from './routes/routes.module';
import { TerminalsModule } from './terminals/terminals.module';
import { BaggageModule } from './baggage/baggage.module';
import { FlightCrewModule } from './flight-crew/flight-crew.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    SharedModule,
    FlightsModule,
    PassengersModule,
    TicketsModule,
    AircraftModule,
    CitiesModule,
    AirportsModule,
    RoutesModule,
    TerminalsModule,
    BaggageModule,
        FlightCrewModule,
        MaintenanceModule,
        AuditModule,
        AnalyticsModule,
        ReportsModule,
        ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
