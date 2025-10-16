import { Module } from '@nestjs/common';
import { FlightCrewService } from './flight-crew.service';
import { FlightCrewController } from './flight-crew.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FlightCrewController],
  providers: [FlightCrewService],
  exports: [FlightCrewService],
})
export class FlightCrewModule {}
