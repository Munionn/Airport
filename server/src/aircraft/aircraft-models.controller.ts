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
import { AircraftModelsService } from './aircraft-models.service';
import {
  CreateAircraftModelDto,
  UpdateAircraftModelDto,
  SearchAircraftModelsDto,
  AircraftModelStatisticsDto,
} from './dto/aircraft-model.dto';

@Controller('aircraft-models')
export class AircraftModelsController {
  constructor(private readonly aircraftModelsService: AircraftModelsService) {}

  @Post()
  create(@Body() createAircraftModelDto: CreateAircraftModelDto) {
    return this.aircraftModelsService.create(createAircraftModelDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchAircraftModelsDto) {
    return this.aircraftModelsService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: AircraftModelStatisticsDto) {
    return this.aircraftModelsService.getStatistics(statisticsDto);
  }

  @Get('popular')
  getMostPopular(@Query('limit') limit?: number) {
    return this.aircraftModelsService.getMostPopular(limit);
  }

  @Get('manufacturer/:manufacturer')
  findByManufacturer(@Param('manufacturer') manufacturer: string) {
    return this.aircraftModelsService.findByManufacturer(manufacturer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aircraftModelsService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAircraftModelDto: UpdateAircraftModelDto) {
    return this.aircraftModelsService.update(+id, updateAircraftModelDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.aircraftModelsService.remove(+id);
  }
}
