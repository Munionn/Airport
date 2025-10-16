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
import { BaggageService } from './baggage.service';
import {
  CreateBaggageDto,
  UpdateBaggageDto,
  SearchBaggageDto,
  BaggageStatisticsDto,
  TrackBaggageDto,
  UpdateBaggageStatusDto,
} from './dto/baggage.dto';

@Controller('baggage')
export class BaggageController {
  constructor(private readonly baggageService: BaggageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBaggageDto: CreateBaggageDto) {
    return this.baggageService.create(createBaggageDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchBaggageDto) {
    return this.baggageService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: BaggageStatisticsDto) {
    return this.baggageService.getStatistics(statisticsDto);
  }

  @Post('track')
  trackBaggage(@Body() trackDto: TrackBaggageDto) {
    return this.baggageService.trackBaggage(trackDto);
  }

  @Post('update-status')
  updateStatus(@Body() updateStatusDto: UpdateBaggageStatusDto) {
    return this.baggageService.updateStatus(updateStatusDto);
  }

  @Get('flight/:flightId')
  findByFlight(@Param('flightId', ParseIntPipe) flightId: number) {
    return this.baggageService.findByFlight(flightId);
  }

  @Get('passenger/:passengerId')
  findByPassenger(@Param('passengerId', ParseIntPipe) passengerId: number) {
    return this.baggageService.findByPassenger(passengerId);
  }

  @Get('tag/:baggageTag')
  findByTag(@Param('baggageTag') baggageTag: string) {
    return this.baggageService.findByTag(baggageTag);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.baggageService.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBaggageDto: UpdateBaggageDto) {
    return this.baggageService.update(id, updateBaggageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.baggageService.remove(id);
  }
}
