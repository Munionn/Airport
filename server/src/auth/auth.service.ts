import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LoginDto, AuthResponseDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      passport_number,
    } = registerDto;

    try {
      console.log('🔄 Registering new user:', { username, email, first_name, last_name });

      // Check if user already exists
      const existingUserQuery = `
        SELECT user_id FROM Users 
        WHERE email = $1 OR username = $2
      `;
      const existingUserResult = await this.databaseService.query(existingUserQuery, [email, username,]);
      
      if (existingUserResult.rows.length > 0) {
        throw new ConflictException('User with this email or username already exists');
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const createUserQuery = `
        INSERT INTO Users (
          username, email, password_hash, first_name, last_name,
          phone, date_of_birth, passport_number, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING user_id, username, email, first_name, last_name, phone, 
                  date_of_birth, passport_number, created_at, updated_at, is_active
      `;

      const userResult = await this.databaseService.query(createUserQuery, [
        username,
        email,
        password_hash,
        first_name,
        last_name,
        phone || null,
        date_of_birth || null,
        passport_number || null,
        true,
      ]);

      const newUser = userResult.rows[0];
      console.log('✅ User created successfully:', newUser.user_id);

      // Assign default passenger role (role_id = 3)
      // Use system user (admin) as assigned_by, or NULL if no admin exists
      const assignRoleQuery = `
        INSERT INTO User_Roles (user_id, role_id, assigned_by)
        VALUES ($1, 3, NULL)
      `;
      await this.databaseService.query(assignRoleQuery, [newUser.user_id]);
      console.log('✅ Default passenger role assigned');

      // Create passenger record for the new user
      const createPassengerQuery = `
        INSERT INTO passengers (user_id, first_name, last_name, passport_number, nationality, date_of_birth, phone, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING passenger_id
      `;
      const passengerResult = await this.databaseService.query(createPassengerQuery, [
        newUser.user_id,
        newUser.first_name,
        newUser.last_name,
        newUser.passport_number || 'PASS' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        'Unknown',
        newUser.date_of_birth || '1990-01-01',
        newUser.phone || '+1234567890',
        newUser.email,
      ]);
      console.log('✅ Passenger record created with ID:', passengerResult.rows[0].passenger_id);

      // Get user roles for response
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

      const rolesResult = await this.databaseService.query(rolesQuery, [newUser.user_id]);
      const roles = rolesResult.rows;

      console.log('✅ Registration completed successfully');
      return {
        user: newUser,
        roles: roles,
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

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
