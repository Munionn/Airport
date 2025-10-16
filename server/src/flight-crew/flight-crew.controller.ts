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
import { FlightCrewService } from './flight-crew.service';
import {
  CreateFlightCrewDto,
  UpdateFlightCrewDto,
  SearchFlightCrewDto,
  CrewStatisticsDto,
  CrewAvailabilityDto,
} from './dto/flight-crew.dto';

@Controller('flight-crew')
export class FlightCrewController {
  constructor(private readonly flightCrewService: FlightCrewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFlightCrewDto: CreateFlightCrewDto) {
    return this.flightCrewService.create(createFlightCrewDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchFlightCrewDto) {
    return this.flightCrewService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: CrewStatisticsDto) {
    return this.flightCrewService.getStatistics(statisticsDto);
  }

  @Post('check-availability')
  checkAvailability(@Body() availabilityDto: CrewAvailabilityDto) {
    return this.flightCrewService.checkCrewAvailability(availabilityDto.user_id);
  }

  @Get('flight/:flightId')
  getCrewForFlight(@Param('flightId', ParseIntPipe) flightId: number) {
    return this.flightCrewService.getCrewForFlight(flightId);
  }

  @Get('user/:userId')
  getCrewAssignmentsForUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.flightCrewService.getCrewAssignmentsForUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flightCrewService.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFlightCrewDto: UpdateFlightCrewDto) {
    return this.flightCrewService.update(id, updateFlightCrewDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.flightCrewService.remove(id);
  }
}
