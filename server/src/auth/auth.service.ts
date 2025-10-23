import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const userQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.password_hash,
        u.first_name,
        u.last_name,
        u.phone,
        u.date_of_birth,
        u.passport_number,
        u.created_at,
        u.updated_at,
        u.is_active
      FROM Users u
      WHERE u.email = $1 AND u.is_active = true
    `;

    const userResult = await this.databaseService.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user roles
    const rolesQuery = `
      SELECT 
        r.role_id,
        r.role_name,
        r.description,
        r.permissions,
        r.created_at
      FROM Roles r
      INNER JOIN User_Roles ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1
    `;

    const rolesResult = await this.databaseService.query(rolesQuery, [user.user_id]);
    const roles = rolesResult.rows;

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      roles: roles,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const loginDto = { email, password };
    try {
      return await this.login(loginDto);
    } catch (error) {
      return null;
    }
  }
}
