import { Module } from '@nestjs/common';
import { FlightOperationsService } from './flight-operations.service';
import { HelperFunctionsService } from './helpers.service';
import { TriggerLogicService } from './triggers.service';
import { FlightOperationsController } from './flight-operations.controller';
import { HelperFunctionsController } from './helper-functions.controller';
import { TriggerLogicController } from './trigger-logic.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [
    FlightOperationsController,
    HelperFunctionsController,
    TriggerLogicController,
  ],
  providers: [FlightOperationsService, HelperFunctionsService, TriggerLogicService],
  exports: [FlightOperationsService, HelperFunctionsService, TriggerLogicService],
})
export class ServicesModule {}
