import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: Date;
  passport_number?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: Date;
  passport_number?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: Date;
  passport_number?: string;
  is_active?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    const result = await this.databaseService.query<User>(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active FROM Users ORDER BY created_at DESC',
    );
    return result.rows;
  }

  /**
   * Get a user by ID
   */
  async findById(user_id: number): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active FROM Users WHERE user_id = $1',
      [user_id],
    );
    return result.rows[0] || null;
  }

  /**
   * Get a user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active FROM Users WHERE username = $1',
      [username],
    );
    return result.rows[0] || null;
  }

  /**
   * Get a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService.query<User>(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active FROM Users WHERE email = $1',
      [email],
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserDto): Promise<User> {
    const result = await this.databaseService.query<User>(
      `INSERT INTO Users (username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active`,
      [
        userData.username,
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.phone,
        userData.date_of_birth,
        userData.passport_number,
      ],
    );
    return result.rows[0];
  }

  /**
   * Update a user
   */
  async update(user_id: number, userData: UpdateUserDto): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided fields
    if (userData.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(userData.username);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.password_hash !== undefined) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(userData.password_hash);
    }
    if (userData.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.first_name);
    }
    if (userData.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.last_name);
    }
    if (userData.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(userData.phone);
    }
    if (userData.date_of_birth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex++}`);
      values.push(userData.date_of_birth);
    }
    if (userData.passport_number !== undefined) {
      fields.push(`passport_number = $${paramIndex++}`);
      values.push(userData.passport_number);
    }
    if (userData.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(userData.is_active);
    }

    if (fields.length === 0) {
      return this.findById(user_id);
    }

    // Add updated_at field
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user_id);

    const query = `UPDATE Users SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active`;

    const result = await this.databaseService.query<User>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a user (soft delete by setting is_active to false)
   */
  async softDelete(user_id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      'UPDATE Users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user_id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Hard delete a user (permanently remove from database)
   */
  async hardDelete(user_id: number): Promise<boolean> {
    const result = await this.databaseService.query('DELETE FROM Users WHERE user_id = $1', [
      user_id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Activate a user
   */
  async activate(user_id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      'UPDATE Users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user_id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get users with their roles
   */
  async findUsersWithRoles(): Promise<any[]> {
    const result = await this.databaseService.query(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.date_of_birth,
        u.passport_number,
        u.created_at,
        u.updated_at,
        u.is_active,
        r.role_name,
        r.description as role_description,
        ur.assigned_at
      FROM Users u
      LEFT JOIN User_Roles ur ON u.user_id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.role_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  /**
   * Assign role to user
   */
  async assignRole(user_id: number, role_id: number, assigned_by?: number): Promise<boolean> {
    try {
      await this.databaseService.query(
        'INSERT INTO User_Roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3)',
        [user_id, role_id, assigned_by],
      );
      return true;
    } catch (error: unknown) {
      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return false; // Role already assigned
      }
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(user_id: number, role_id: number): Promise<boolean> {
    const result = await this.databaseService.query(
      'DELETE FROM User_Roles WHERE user_id = $1 AND role_id = $2',
      [user_id, role_id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get user roles
   */
  async getUserRoles(user_id: number): Promise<any[]> {
    const result = await this.databaseService.query(
      `
      SELECT 
        r.role_id,
        r.role_name,
        r.description,
        r.permissions,
        ur.assigned_at,
        ur.assigned_by
      FROM User_Roles ur
      JOIN Roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = $1
      ORDER BY ur.assigned_at DESC
    `,
      [user_id],
    );
    return result.rows;
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    const result = await this.databaseService.query<User>(
      `
      SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active 
      FROM Users 
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1)
      ORDER BY first_name, last_name
    `,
      [`%${searchTerm}%`],
    );
    return result.rows;
  }

  /**
   * Get users by status (active/inactive)
   */
  async findByStatus(is_active: boolean): Promise<User[]> {
    const result = await this.databaseService.query<User>(
      'SELECT user_id, username, email, password_hash, first_name, last_name, phone, date_of_birth, passport_number, created_at, updated_at, is_active FROM Users WHERE is_active = $1 ORDER BY created_at DESC',
      [is_active],
    );
    return result.rows;
  }
}
