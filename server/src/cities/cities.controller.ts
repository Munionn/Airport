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
import { CitiesService } from './cities.service';
import {
  CreateCityDto,
  UpdateCityDto,
  SearchCitiesDto,
  CityStatisticsDto,
} from './dto/city.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Post()
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchCitiesDto) {
    return this.citiesService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: CityStatisticsDto) {
    return this.citiesService.getStatistics(statisticsDto);
  }

  @Get('with-airports')
  getCitiesWithAirports() {
    return this.citiesService.getCitiesWithAirports();
  }

  @Get('country/:country')
  findByCountry(@Param('country') country: string) {
    return this.citiesService.findByCountry(country);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citiesService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(+id, updateCityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.citiesService.remove(+id);
  }
}
