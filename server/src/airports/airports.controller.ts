import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AirportsService } from './airports.service';
import {
  CreateAirportDto,
  UpdateAirportDto,
  SearchAirportsDto,
  AirportStatisticsDto,
  AirportDistanceDto,
} from './dto/airport.dto';

@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Post()
  create(@Body() createAirportDto: CreateAirportDto) {
    return this.airportsService.create(createAirportDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchAirportsDto) {
    return this.airportsService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: AirportStatisticsDto) {
    return this.airportsService.getStatistics(statisticsDto);
  }

  @Post('distance')
  calculateDistance(@Body() distanceDto: AirportDistanceDto) {
    return this.airportsService.calculateDistance(distanceDto);
  }

  @Get('country/:country')
  findByCountry(@Param('country') country: string) {
    return this.airportsService.findByCountry(country);
  }

  @Get('city/:cityId')
  findByCity(@Param('cityId') cityId: string) {
    return this.airportsService.findByCity(+cityId);
  }

  @Get('iata/:iataCode')
  findByIataCode(@Param('iataCode') iataCode: string) {
    return this.airportsService.findByIataCode(iataCode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.airportsService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAirportDto: UpdateAirportDto) {
    return this.airportsService.update(+id, updateAirportDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.airportsService.remove(+id);
  }
}
