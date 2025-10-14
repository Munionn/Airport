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
import { PassengersService } from './passengers.service';
import {
  CreatePassengerDto,
  UpdatePassengerDto,
  SearchPassengerDto,
  PassengerStatisticsDto,
  RegisterPassengerForFlightDto,
  PassengerFlightHistoryDto,
  PassengerResponseDto,
  PassengerStatisticsResponseDto,
} from './dto/passenger.dto';

@Controller('passengers')
export class PassengersController {
  constructor(private readonly passengersService: PassengersService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string): Promise<any> {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    return this.passengersService.findAll(pageNum, limitNum);
  }

  @Get('search')
  async searchPassengers(@Query() searchDto: SearchPassengerDto): Promise<any> {
    return this.passengersService.searchPassengers(searchDto);
  }

  @Get('statistics')
  async getStatistics(
    @Query() statsDto: PassengerStatisticsDto,
  ): Promise<PassengerStatisticsResponseDto> {
    return this.passengersService.getPassengerStatistics(statsDto);
  }

  @Get('european')
  async getEuropeanPassengers(): Promise<any[]> {
    return this.passengersService.getEuropeanPassengers();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<PassengerResponseDto | null> {
    return this.passengersService.findById(id);
  }

  @Get(':id/details')
  async getPassengerDetails(@Param('id', ParseIntPipe) id: number): Promise<PassengerResponseDto> {
    return this.passengersService.getPassengerDetails(id);
  }

  @Get(':id/history')
  async getPassengerHistory(@Query() historyDto: PassengerFlightHistoryDto): Promise<any[]> {
    return this.passengersService.getPassengerFlightHistory(historyDto);
  }

  @Get(':id/info-with-history')
  async getPassengerInfoWithHistory(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.passengersService.getPassengerInfoWithHistory(id);
  }

  @Get('passport/:passportNumber')
  async findByPassportNumber(
    @Param('passportNumber') passportNumber: string,
  ): Promise<PassengerResponseDto | null> {
    return this.passengersService.findByPassportNumber(passportNumber);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<PassengerResponseDto | null> {
    return this.passengersService.findByEmail(email);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPassenger(
    @Body() createPassengerDto: CreatePassengerDto,
  ): Promise<PassengerResponseDto> {
    return this.passengersService.createPassenger(createPassengerDto);
  }

  @Post('register-for-flight')
  @HttpCode(HttpStatus.CREATED)
  async registerPassengerForFlight(
    @Body() registerDto: RegisterPassengerForFlightDto,
  ): Promise<any> {
    return this.passengersService.registerPassengerForFlight(registerDto);
  }

  @Put(':id')
  async updatePassenger(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePassengerDto: UpdatePassengerDto,
  ): Promise<PassengerResponseDto | null> {
    return this.passengersService.updatePassenger(id, updatePassengerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePassenger(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.passengersService.deletePassenger(id);
  }
}
