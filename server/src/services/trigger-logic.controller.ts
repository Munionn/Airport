import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TriggerLogicService } from './triggers.service';

@Controller('triggers')
export class TriggerLogicController {
  constructor(private readonly triggerLogicService: TriggerLogicService) {}

  @Post('run-all')
  @HttpCode(HttpStatus.OK)
  runAllTriggerLogic() {
    return this.triggerLogicService.runAllTriggerLogic();
  }

  @Post('update-flight-status')
  @HttpCode(HttpStatus.OK)
  updateFlightStatusAutomatically() {
    return this.triggerLogicService.updateFlightStatusAutomatically();
  }

  @Post('update-flight-loads')
  @HttpCode(HttpStatus.OK)
  updateFlightLoadsAndWarnings() {
    return this.triggerLogicService.updateFlightLoadsAndWarnings();
  }

  @Post('update-maintenance-schedules')
  @HttpCode(HttpStatus.OK)
  updateMaintenanceSchedules() {
    return this.triggerLogicService.updateMaintenanceSchedules();
  }

  @Post('manage-gate-assignments')
  @HttpCode(HttpStatus.OK)
  manageGateAssignments() {
    return this.triggerLogicService.manageGateAssignments();
  }

  @Post('update-ticket-prices')
  @HttpCode(HttpStatus.OK)
  updateTicketPrices() {
    return this.triggerLogicService.updateTicketPrices();
  }

  @Post('update-baggage-statuses')
  @HttpCode(HttpStatus.OK)
  updateBaggageStatuses() {
    return this.triggerLogicService.updateBaggageStatuses();
  }

  @Post('process-delay-notifications')
  @HttpCode(HttpStatus.OK)
  processDelayNotifications() {
    return this.triggerLogicService.processDelayNotifications();
  }

  @Post('validate-crew-rest-times')
  @HttpCode(HttpStatus.OK)
  validateCrewRestTimes() {
    return this.triggerLogicService.validateCrewRestTimes();
  }

  @Post('schedule-trigger-logic')
  @HttpCode(HttpStatus.OK)
  scheduleTriggerLogic() {
    return this.triggerLogicService.scheduleTriggerLogic();
  }
}

