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
import { RoutesService } from './routes.service';
import {
  CreateRouteDto,
  UpdateRouteDto,
  SearchRoutesDto,
  RouteStatisticsDto,
  PopularRoutesDto,
} from './dto/route.dto';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchRoutesDto) {
    return this.routesService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: RouteStatisticsDto) {
    return this.routesService.getStatistics(statisticsDto);
  }

  @Get('popular')
  getPopularRoutes(@Query() popularDto: PopularRoutesDto) {
    return this.routesService.getPopularRoutes(popularDto);
  }

  @Get('departure/:airportId')
  findByDepartureAirport(@Param('airportId') airportId: string) {
    return this.routesService.findByDepartureAirport(+airportId);
  }

  @Get('arrival/:airportId')
  findByArrivalAirport(@Param('airportId') airportId: string) {
    return this.routesService.findByArrivalAirport(+airportId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routesService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(+id, updateRouteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.routesService.remove(+id);
  }
}
