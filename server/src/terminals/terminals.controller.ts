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
import { TerminalsService } from './terminals.service';
import {
  CreateTerminalDto,
  UpdateTerminalDto,
  SearchTerminalsDto,
  TerminalStatisticsDto,
} from './dto/terminal.dto';

@Controller('terminals')
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTerminalDto: CreateTerminalDto) {
    return this.terminalsService.create(createTerminalDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchTerminalsDto) {
    return this.terminalsService.findAll(searchDto);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: TerminalStatisticsDto) {
    return this.terminalsService.getStatistics(statisticsDto);
  }

  @Get('airport/:airportId')
  findByAirport(@Param('airportId', ParseIntPipe) airportId: number) {
    return this.terminalsService.findByAirport(airportId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.terminalsService.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTerminalDto: UpdateTerminalDto) {
    return this.terminalsService.update(id, updateTerminalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.terminalsService.remove(id);
  }
}
