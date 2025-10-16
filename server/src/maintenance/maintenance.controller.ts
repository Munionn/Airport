import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  SearchMaintenanceDto,
  MaintenanceStatisticsDto,
  CompleteMaintenanceDto,
} from './dto/maintenance.dto';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchMaintenanceDto) {
    return this.maintenanceService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: MaintenanceStatisticsDto) {
    return this.maintenanceService.getStatistics(statisticsDto);
  }

  @Get('upcoming')
  getUpcomingMaintenance(@Query('days') days?: number) {
    return this.maintenanceService.getUpcomingMaintenance(days);
  }

  @Get('overdue')
  getOverdueMaintenance() {
    return this.maintenanceService.getOverdueMaintenance();
  }

  @Get('aircraft/:aircraftId')
  getMaintenanceForAircraft(@Param('aircraftId', ParseIntPipe) aircraftId: number) {
    return this.maintenanceService.getMaintenanceForAircraft(aircraftId);
  }

  @Post('start/:id')
  startMaintenance(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.startMaintenance(id);
  }

  @Post('complete')
  completeMaintenance(@Body() completeDto: CompleteMaintenanceDto) {
    return this.maintenanceService.completeMaintenance(completeDto);
  }

  @Post('cancel/:id')
  cancelMaintenance(@Param('id', ParseIntPipe) id: number, @Body('reason') reason?: string) {
    return this.maintenanceService.cancelMaintenance(id, reason);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.remove(id);
  }
}
