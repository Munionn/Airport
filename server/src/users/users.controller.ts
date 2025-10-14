import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { User, CreateUserDto, UpdateUserDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  async searchUsers(@Query('q') searchTerm: string): Promise<User[]> {
    return await this.usersService.searchUsers(searchTerm);
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: string): Promise<User[]> {
    const is_active = status === 'active';
    return await this.usersService.findByStatus(is_active);
  }

  @Get('with-roles')
  async findUsersWithRoles(): Promise<any[]> {
    return await this.usersService.findUsersWithRoles();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) user_id: number): Promise<User | null> {
    return await this.usersService.findById(user_id);
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string): Promise<User | null> {
    return await this.usersService.findByUsername(username);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<User | null> {
    return await this.usersService.findByEmail(email);
  }

  @Get(':id/roles')
  async getUserRoles(@Param('id', ParseIntPipe) user_id: number): Promise<any[]> {
    return await this.usersService.getUserRoles(user_id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) user_id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return await this.usersService.update(user_id, updateUserDto);
  }

  @Put(':id/activate')
  async activate(@Param('id', ParseIntPipe) user_id: number): Promise<{ success: boolean }> {
    const success = await this.usersService.activate(user_id);
    return { success };
  }

  @Put(':id/deactivate')
  async deactivate(@Param('id', ParseIntPipe) user_id: number): Promise<{ success: boolean }> {
    const success = await this.usersService.softDelete(user_id);
    return { success };
  }

  @Post(':id/roles')
  async assignRole(
    @Param('id', ParseIntPipe) user_id: number,
    @Body() body: { role_id: number; assigned_by?: number },
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.assignRole(user_id, body.role_id, body.assigned_by);
    return { success };
  }

  @Delete(':id/roles/:roleId')
  async removeRole(
    @Param('id', ParseIntPipe) user_id: number,
    @Param('roleId', ParseIntPipe) role_id: number,
  ): Promise<{ success: boolean }> {
    const success = await this.usersService.removeRole(user_id, role_id);
    return { success };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) user_id: number): Promise<{ success: boolean }> {
    const success = await this.usersService.hardDelete(user_id);
    return { success };
  }
}
