import { Module } from '@nestjs/common';
import { BaggageService } from './baggage.service';
import { BaggageController } from './baggage.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BaggageController],
  providers: [BaggageService],
  exports: [BaggageService],
})
export class BaggageModule {}

