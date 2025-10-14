import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AircraftService } from './aircraft.service';
import {
  CreateAircraftDto,
  UpdateAircraftDto,
  SearchAircraftDto,
  AircraftStatisticsDto,
  AircraftEfficiencyDto,
  MaintenanceScheduleDto,
} from './dto/aircraft.dto';
import { AircraftStatus } from '../shared/enums';

@Controller('aircraft')
export class AircraftController {
  constructor(private readonly aircraftService: AircraftService) {}

  @Post()
  create(@Body() createAircraftDto: CreateAircraftDto) {
    return this.aircraftService.create(createAircraftDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchAircraftDto) {
    return this.aircraftService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: AircraftStatisticsDto) {
    return this.aircraftService.getStatistics(statisticsDto);
  }

  @Get('efficiency')
  getEfficiencyAnalysis(@Query() efficiencyDto: AircraftEfficiencyDto) {
    return this.aircraftService.getEfficiencyAnalysis(efficiencyDto);
  }

  @Get('maintenance-schedule')
  getMaintenanceSchedule(@Query() scheduleDto: MaintenanceScheduleDto) {
    return this.aircraftService.getMaintenanceSchedule(scheduleDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aircraftService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAircraftDto: UpdateAircraftDto) {
    return this.aircraftService.update(+id, updateAircraftDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: AircraftStatus) {
    return this.aircraftService.updateStatus(+id, status);
  }

  @Patch(':id/maintenance')
  scheduleMaintenance(
    @Param('id') id: string,
    @Body('maintenance_date') maintenance_date: Date,
    @Body('notes') notes?: string,
  ) {
    return this.aircraftService.scheduleMaintenance(+id, maintenance_date, notes);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.aircraftService.remove(+id);
  }
}
