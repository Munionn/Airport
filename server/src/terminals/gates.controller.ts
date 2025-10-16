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
import { GatesService } from './gates.service';
import {
  CreateGateDto,
  UpdateGateDto,
  SearchGatesDto,
  GateStatisticsDto,
  AutoAssignGateDto,
  ReleaseGateDto,
} from './dto/gate.dto';

@Controller('gates')
export class GatesController {
  constructor(private readonly gatesService: GatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGateDto: CreateGateDto) {
    return this.gatesService.create(createGateDto);
  }

  @Get()
  findAll(@Query() searchDto: SearchGatesDto) {
    return this.gatesService.findAll(searchDto);
  }

  @Get('available')
  getAvailableGates(@Query('terminal_id') terminalId?: number, @Query('airport_id') airportId?: number) {
    return this.gatesService.getAvailableGates(terminalId, airportId);
  }

  @Get('statistics')
  getStatistics(@Query() statisticsDto: GateStatisticsDto) {
    return this.gatesService.getStatistics(statisticsDto);
  }

  @Get('terminal/:terminalId')
  findByTerminal(@Param('terminalId', ParseIntPipe) terminalId: number) {
    return this.gatesService.findByTerminal(terminalId);
  }

  @Post('auto-assign')
  autoAssignGate(@Body() autoAssignDto: AutoAssignGateDto) {
    return this.gatesService.autoAssignGate(autoAssignDto);
  }

  @Post('release')
  releaseGate(@Body() releaseDto: ReleaseGateDto) {
    return this.gatesService.releaseGate(releaseDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gatesService.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGateDto: UpdateGateDto) {
    return this.gatesService.update(id, updateGateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gatesService.remove(id);
  }
}

