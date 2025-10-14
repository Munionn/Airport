import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { SharedModule } from './shared/shared.module';
import { FlightsModule } from './flights/flights.module';
import { PassengersModule } from './passengers/passengers.module';
import { TicketsModule } from './tickets/tickets.module';
import { AircraftModule } from './aircraft/aircraft.module';
import { CitiesModule } from './cities/cities.module';
import { AirportsModule } from './airports/airports.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    SharedModule,
    FlightsModule,
    PassengersModule,
    TicketsModule,
    AircraftModule,
    CitiesModule,
    AirportsModule,
    RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
