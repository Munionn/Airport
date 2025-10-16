import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { HelperFunctionsService } from './helpers.service';

@Controller('helpers')
export class HelperFunctionsController {
  constructor(private readonly helperFunctionsService: HelperFunctionsService) {}

  @Get('seat-availability/:flightId/:seatNumber')
  checkSeatAvailability(
    @Param('flightId', ParseIntPipe) flightId: number,
    @Param('seatNumber') seatNumber: string,
  ) {
    return this.helperFunctionsService.isSeatAvailable(flightId, seatNumber);
  }

  @Get('flight-load/:flightId')
  getFlightLoadPercentage(@Param('flightId', ParseIntPipe) flightId: number) {
    return this.helperFunctionsService.calculateFlightLoadPercentage(flightId);
  }

  @Get('generate-ticket-number')
  generateTicketNumber() {
    return { ticket_number: this.helperFunctionsService.generateTicketNumber() };
  }

  @Get('generate-baggage-tag')
  generateBaggageTagNumber() {
    return { baggage_tag: this.helperFunctionsService.generateBaggageTagNumber() };
  }

  @Get('aircraft-availability/:aircraftId')
  checkAircraftAvailabilityForMaintenance(
    @Param('aircraftId', ParseIntPipe) aircraftId: number,
    @Query('startTime') startTime: string,
    @Query('durationHours') durationHours: number,
  ) {
    return this.helperFunctionsService.isAircraftAvailableForMaintenance(
      aircraftId,
      new Date(startTime),
      durationHours,
    );
  }

  @Get('crew-availability/:userId')
  checkCrewMemberAvailability(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('departureTime') departureTime: string,
    @Query('arrivalTime') arrivalTime: string,
  ) {
    return this.helperFunctionsService.isCrewMemberAvailable(
      userId,
      new Date(departureTime),
      new Date(arrivalTime),
    );
  }

  @Get('gate-availability/:gateId')
  checkGateAvailability(
    @Param('gateId', ParseIntPipe) gateId: number,
    @Query('departureTime') departureTime: string,
    @Query('arrivalTime') arrivalTime: string,
  ) {
    return this.helperFunctionsService.isGateAvailable(
      gateId,
      new Date(departureTime),
      new Date(arrivalTime),
    );
  }

  @Get('aircraft-utilization/:aircraftId')
  getAircraftUtilization(
    @Param('aircraftId', ParseIntPipe) aircraftId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.helperFunctionsService.calculateAircraftUtilization(
      aircraftId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('route-profitability/:routeId')
  getRouteProfitability(
    @Param('routeId', ParseIntPipe) routeId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.helperFunctionsService.calculateRouteProfitability(
      routeId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('calculate-ticket-price')
  calculateTicketPrice(@Body() body: {
    basePrice: number;
    ticketClass: 'economy' | 'business' | 'first';
    bookingTime?: string;
    departureTime?: string;
  }) {
    return {
      price: this.helperFunctionsService.calculateTicketPrice(
        body.basePrice,
        body.ticketClass,
        body.bookingTime ? new Date(body.bookingTime) : undefined,
        body.departureTime ? new Date(body.departureTime) : undefined,
      ),
    };
  }

  @Post('calculate-refund')
  calculateRefundAmount(@Body() body: {
    ticketPrice: number;
    cancellationTime: string;
    departureTime: string;
  }) {
    return {
      refundAmount: this.helperFunctionsService.calculateRefundAmount(
        body.ticketPrice,
        new Date(body.cancellationTime),
        new Date(body.departureTime),
      ),
    };
  }

  @Get('validate-email/:email')
  validateEmail(@Param('email') email: string) {
    return { isValid: this.helperFunctionsService.isValidEmail(email) };
  }

  @Get('validate-phone/:phone')
  validatePhoneNumber(@Param('phone') phone: string) {
    return { isValid: this.helperFunctionsService.isValidPhoneNumber(phone) };
  }

  @Post('format-currency')
  formatCurrency(@Body() body: { amount: number; currency?: string }) {
    return { formatted: this.helperFunctionsService.formatCurrency(body.amount, body.currency) };
  }

  @Post('format-date')
  formatDate(@Body() body: { date: string; format?: 'short' | 'long' | 'time' }) {
    return { formatted: this.helperFunctionsService.formatDate(new Date(body.date), body.format) };
  }
}

