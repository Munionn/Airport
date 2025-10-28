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
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  SearchTicketDto,
  CheckInDto,
  SeatSelectionDto,
  TicketCancellationDto,
  TicketRefundDto,
  SeatAvailabilityDto,
  TicketStatisticsDto,
  TicketPricingDto,
  TicketResponseDto,
  SeatAvailabilityResponseDto,
  TicketStatisticsResponseDto,
  TicketPricingResponseDto,
} from './dto/ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    return this.ticketsService.findAll(pageNum, limitNum);
  }

  @Get('debug/user/:userId')
  async debugUser(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    try {
      console.log('🔍 Debugging user:', userId);
      
      // Check if user exists
      const userResult = await this.ticketsService['databaseService'].query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
          user_id: userId
        };
      }
      const user = userResult.rows[0];
      // Check if passenger exists
      const passengerResult = await this.ticketsService['databaseService'].query(
        'SELECT * FROM passengers WHERE user_id = $1',
        [userId]
      );
      return {
        success: true,
        user: user,
        passenger: passengerResult.rows[0] || null,
        has_passenger_record: passengerResult.rows.length > 0
      };
    } catch (error) {
      console.error('❌ Debug user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('search')
  async searchTickets(@Query() searchDto: SearchTicketDto): Promise<any> {
    return this.ticketsService.searchTickets(searchDto);
  }

  @Get('statistics')
  async getStatistics(
    @Query() statsDto: TicketStatisticsDto,
  ): Promise<TicketStatisticsResponseDto> {
    return this.ticketsService.getTicketStatistics(statsDto);
  }

  @Get('pricing')
  async getPricing(@Query() pricingDto: TicketPricingDto): Promise<TicketPricingResponseDto> {
    return this.ticketsService.getTicketPricing(pricingDto);
  }

  @Get('seat-availability')
  async getSeatAvailability(
    @Query() availabilityDto: SeatAvailabilityDto,
  ): Promise<SeatAvailabilityResponseDto> {
    return this.ticketsService.getSeatAvailability(availabilityDto);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<TicketResponseDto | null> {
    return this.ticketsService.findById(id);
  }

  @Get('number/:ticketNumber')
  async findByTicketNumber(
    @Param('ticketNumber') ticketNumber: string,
  ): Promise<TicketResponseDto | null> {
    return this.ticketsService.findByTicketNumber(ticketNumber);
  }

  @Get('passenger/:passengerId')
  async findByPassengerId(
    @Param('passengerId', ParseIntPipe) passengerId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.ticketsService.findByPassengerId(passengerId, pageNum, limitNum);
  }

  @Get(':id/seat-availability')
  async checkSeatAvailability(
    @Param('id', ParseIntPipe) flightId: number,
    @Query('seatNumber') seatNumber: string,
  ): Promise<{ available: boolean }> {
    const available = await this.ticketsService.checkSeatAvailability(flightId, seatNumber);
    return { available };
  }

  @Post('simple-create')
  @HttpCode(HttpStatus.CREATED)
  async simpleCreateTicket(@Body() body: any): Promise<any> {
    try {
      console.log('🔄 Simple ticket creation with data:', body);
      
      // Find passenger_id by user_id
      const passengerResult = await this.ticketsService['databaseService'].query(
        'SELECT passenger_id FROM passengers WHERE user_id = $1',
        [body.passenger_id]
      );
      
      if (passengerResult.rows.length === 0) {
        throw new Error('Passenger not found for user_id: ' + body.passenger_id);
      }
      
      const actualPassengerId = passengerResult.rows[0].passenger_id;
      console.log('✅ Found passenger_id:', actualPassengerId);
      
      // Simple ticket creation with correct passenger_id
      const result = await this.ticketsService['databaseService'].query(
        `INSERT INTO tickets (passenger_id, flight_id, seat_number, class, price, ticket_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          actualPassengerId, // Use actual passenger_id
          body.flight_id,
          body.seat_number || '1A', // Correct format
          body.class || 'economy',
          body.price || 299.99,
          'TK' + Date.now().toString(36).toUpperCase(),
          'active'
        ]
      );
      
      console.log('✅ Simple ticket created:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Simple ticket creation failed:', error);
      throw error;
    }
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(@Body() checkInDto: CheckInDto): Promise<TicketResponseDto> {
    return this.ticketsService.checkIn(checkInDto);
  }

  @Post('select-seat')
  @HttpCode(HttpStatus.OK)
  async selectSeat(@Body() seatSelectionDto: SeatSelectionDto): Promise<TicketResponseDto> {
    return this.ticketsService.selectSeat(seatSelectionDto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTicket(@Body() cancellationDto: TicketCancellationDto): Promise<TicketResponseDto> {
    return this.ticketsService.cancelTicket(cancellationDto);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  async processRefund(@Body() refundDto: TicketRefundDto): Promise<TicketResponseDto> {
    return this.ticketsService.processRefund(refundDto);
  }

  @Put(':id')
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketResponseDto | null> {
    return this.ticketsService.updateTicket(id, updateTicketDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.ticketsService.deleteTicket(id);
  }
}
