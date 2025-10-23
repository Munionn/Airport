import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FlightOperationsService } from './flight-operations.service';
import type {
  RegisterPassengerForFlightDto,
  CancelFlightDto,
  SearchFlightsDto,
  FlightStatisticsDto,
  UpdateFlightStatusDto,
} from './flight-operations.service';

@Controller('flight-operations')
export class FlightOperationsController {
  constructor(private readonly flightOperationsService: FlightOperationsService) {}

  @Post('register-passenger')
  @HttpCode(HttpStatus.CREATED)
  registerPassengerForFlight(@Body() dto: RegisterPassengerForFlightDto) {
    return this.flightOperationsService.registerPassengerForFlight(dto);
  }

  @Post('cancel-flight')
  @HttpCode(HttpStatus.OK)
  cancelFlight(@Body() dto: CancelFlightDto) {
    return this.flightOperationsService.cancelFlight(dto);
  }

  @Get('search-flights')
  searchFlights(@Query() dto: SearchFlightsDto) {
    return this.flightOperationsService.searchFlights(dto);
  }

  @Get('statistics')
  getFlightStatistics(@Query() dto: FlightStatisticsDto) {
    return this.flightOperationsService.calculateFlightStatistics(dto);
  }

  @Post('update-status')
  @HttpCode(HttpStatus.OK)
  updateFlightStatus(@Body() dto: UpdateFlightStatusDto) {
    return this.flightOperationsService.updateFlightStatusManual(dto);
  }
}

