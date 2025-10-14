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

  @Get(':id/seat-availability')
  async checkSeatAvailability(
    @Param('id', ParseIntPipe) flightId: number,
    @Query('seatNumber') seatNumber: string,
  ): Promise<{ available: boolean }> {
    const available = await this.ticketsService.checkSeatAvailability(flightId, seatNumber);
    return { available };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() createTicketDto: CreateTicketDto): Promise<TicketResponseDto> {
    return this.ticketsService.createTicket(createTicketDto);
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
