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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FlightsService } from './flights.service';
import {
  CreateFlightDto,
  UpdateFlightDto,
  SearchFlightDto,
  FlightStatisticsDto,
  AssignGateDto,
  UpdateFlightStatusDto,
  FlightDelayDto,
  FlightCancellationDto,
  FlightSearchCriteriaDto,
  FlightResponseDto,
  FlightStatisticsResponseDto,
} from './dto/flight.dto';
// import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

// @ApiTags('flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get()
  // @ApiOperation({ summary: 'Get all flights with pagination' })
  // @ApiResponse({ status: 200, description: 'List of flights' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    return this.flightsService.searchFlightsPaginated({
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('search')
  // @ApiOperation({ summary: 'Search flights with advanced criteria' })
  // @ApiResponse({ status: 200, description: 'Search results' })
  async searchFlights(@Query() searchDto: SearchFlightDto): Promise<any> {
    return this.flightsService.searchFlightsPaginated(searchDto);
  }

  @Post('search/advanced')
  // @ApiOperation({ summary: 'Advanced flight search with multiple criteria' })
  // @ApiResponse({ status: 200, description: 'Advanced search results' })
  async advancedSearch(
    @Body() criteria: FlightSearchCriteriaDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.flightsService.advancedFlightSearch(criteria, pageNum, limitNum);
  }

  @Get('statistics')
  // @ApiOperation({ summary: 'Get flight statistics' })
  // @ApiResponse({ status: 200, description: 'Flight statistics' })
  async getStatistics(
    @Query() statsDto: FlightStatisticsDto,
  ): Promise<FlightStatisticsResponseDto> {
    return this.flightsService.getFlightStatistics(statsDto);
  }

  @Get(':id')
  // @ApiOperation({ summary: 'Get flight by ID' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Flight details' })
  // @ApiResponse({ status: 404, description: 'Flight not found' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<FlightResponseDto> {
    return this.flightsService.getFlightDetails(id);
  }

  @Get('number/:flightNumber')
  // @ApiOperation({ summary: 'Get flight by flight number' })
  // @ApiParam({ name: 'flightNumber', description: 'Flight number' })
  async findByFlightNumber(@Param('flightNumber') flightNumber: string): Promise<any> {
    const flight = await this.flightsService.findByFlightNumber(flightNumber);
    if (!flight) {
      return null;
    }
    return this.flightsService.getFlightDetails(flight.flight_id);
  }

  @Get('aircraft/:aircraftId')
  // @ApiOperation({ summary: 'Get flights by aircraft' })
  // @ApiParam({ name: 'aircraftId', description: 'Aircraft ID' })
  async findByAircraft(@Param('aircraftId', ParseIntPipe) aircraftId: number): Promise<any[]> {
    return this.flightsService.findByAircraft(aircraftId);
  }

  @Get('route/:routeId')
  // @ApiOperation({ summary: 'Get flights by route' })
  // @ApiParam({ name: 'routeId', description: 'Route ID' })
  async findByRoute(@Param('routeId', ParseIntPipe) routeId: number): Promise<any[]> {
    return this.flightsService.findByRoute(routeId);
  }

  @Get('status/:status')
  // @ApiOperation({ summary: 'Get flights by status' })
  // @ApiParam({ name: 'status', description: 'Flight status' })
  async findByStatus(@Param('status') status: string): Promise<any[]> {
    return this.flightsService.findByStatus(status);
  }

  @Get('date-range')
  // @ApiOperation({ summary: 'Get flights in date range' })
  // @ApiQuery({ name: 'startDate', description: 'Start date' })
  // @ApiQuery({ name: 'endDate', description: 'End date' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any[]> {
    return this.flightsService.findByDateRange(new Date(startDate), new Date(endDate));
  }

  @Post()
  // @ApiOperation({ summary: 'Create a new flight' })
  // @ApiResponse({ status: 201, description: 'Flight created' })
  // @ApiResponse({ status: 400, description: 'Invalid input' })
  @HttpCode(HttpStatus.CREATED)
  async createFlight(@Body() createFlightDto: CreateFlightDto): Promise<FlightResponseDto> {
    const flight = await this.flightsService.createFlight(createFlightDto);
    return this.flightsService.getFlightDetails(flight.flight_id);
  }

  @Put(':id')
  // @ApiOperation({ summary: 'Update flight' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Flight updated' })
  // @ApiResponse({ status: 404, description: 'Flight not found' })
  async updateFlight(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlightDto: UpdateFlightDto,
  ): Promise<FlightResponseDto> {
    await this.flightsService.updateFlight(id, updateFlightDto);
    return this.flightsService.getFlightDetails(id);
  }

  @Put(':id/status')
  // @ApiOperation({ summary: 'Update flight status' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Status updated' })
  async updateFlightStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFlightStatusDto,
  ): Promise<FlightResponseDto> {
    return this.flightsService.updateFlightStatus(updateDto);
  }

  @Put(':id/gate')
  // @ApiOperation({ summary: 'Assign gate to flight' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Gate assigned' })
  // @ApiResponse({ status: 409, description: 'Gate already assigned' })
  async assignGate(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignGateDto: AssignGateDto,
  ): Promise<FlightResponseDto> {
    return this.flightsService.assignGate(assignGateDto);
  }

  @Put(':id/delay')
  // @ApiOperation({ summary: 'Handle flight delay' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Delay processed' })
  async handleDelay(
    @Param('id', ParseIntPipe) id: number,
    @Body() delayDto: FlightDelayDto,
  ): Promise<FlightResponseDto> {
    return this.flightsService.handleFlightDelay(delayDto);
  }

  @Put(':id/cancel')
  // @ApiOperation({ summary: 'Cancel flight' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 200, description: 'Flight cancelled' })
  async cancelFlight(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancellationDto: FlightCancellationDto,
  ): Promise<FlightResponseDto> {
    return this.flightsService.cancelFlight(cancellationDto);
  }

  @Delete(':id')
  // @ApiOperation({ summary: 'Delete flight' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiResponse({ status: 204, description: 'Flight deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFlight(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.flightsService.deleteFlight(id);
  }

  @Get(':id/seat-availability')
  // @ApiOperation({ summary: 'Check seat availability' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  // @ApiQuery({ name: 'seatNumber', description: 'Seat number' })
  async checkSeatAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('seatNumber') seatNumber: string,
  ): Promise<{ available: boolean }> {
    const available = await this.flightsService.checkSeatAvailability(id, seatNumber);
    return { available };
  }

  @Get(':id/load')
  // @ApiOperation({ summary: 'Get flight load percentage' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  async getFlightLoad(@Param('id', ParseIntPipe) id: number): Promise<{ loadPercentage: number }> {
    const loadPercentage = await this.flightsService.calculateFlightLoad(id);
    return { loadPercentage };
  }

  @Get(':id/available-seats')
  // @ApiOperation({ summary: 'Get available seats count' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  async getAvailableSeats(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ availableSeats: number }> {
    const availableSeats = await this.flightsService.getAvailableSeats(id);
    return { availableSeats };
  }

  @Get(':id/passengers')
  // @ApiOperation({ summary: 'Get passenger ticket information for a flight' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  async getPassengerTicketInfo(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.flightsService.getPassengerTicketInfo(id);
  }

  @Get(':id/crew')
  // @ApiOperation({ summary: 'Get flight crew' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  async getFlightCrew(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.flightsService.getFlightCrew(id);
  }

  @Get(':id/baggage')
  // @ApiOperation({ summary: 'Get flight baggage' })
  // @ApiParam({ name: 'id', description: 'Flight ID' })
  async getFlightBaggage(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.flightsService.getFlightBaggage(id);
  }

  @Get('search/function')
  // @ApiOperation({ summary: 'Search flights using database function' })
  // @ApiQuery({ name: 'departureIata', description: 'Departure airport IATA code' })
  // @ApiQuery({ name: 'arrivalIata', description: 'Arrival airport IATA code' })
  // @ApiQuery({ name: 'departureDate', description: 'Departure date' })
  async searchFlightsFunction(
    @Query('departureIata') departureIata: string,
    @Query('arrivalIata') arrivalIata: string,
    @Query('departureDate') departureDate: string,
  ): Promise<any[]> {
    return this.flightsService.searchFlights(departureIata, arrivalIata, new Date(departureDate));
  }
}
