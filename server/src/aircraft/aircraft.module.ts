import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AircraftService } from './aircraft.service';
import { AircraftController } from './aircraft.controller';
import { AircraftModelsService } from './aircraft-models.service';
import { AircraftModelsController } from './aircraft-models.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AircraftController, AircraftModelsController],
  providers: [AircraftService, AircraftModelsService],
  exports: [AircraftService, AircraftModelsService],
})
export class AircraftModule {}
