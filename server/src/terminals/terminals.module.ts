import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { GatesService } from './gates.service';
import { TerminalsController } from './terminals.controller';
import { GatesController } from './gates.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TerminalsController, GatesController],
  providers: [TerminalsService, GatesService],
  exports: [TerminalsService, GatesService],
})
export class TerminalsModule {}
