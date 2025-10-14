import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AirportsService } from './airports.service';
import { AirportsController } from './airports.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AirportsController],
  providers: [AirportsService],
  exports: [AirportsService],
})
export class AirportsModule {}
