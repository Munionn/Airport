import { api } from './client';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
} from '../types';

export const usersApi = {
  // Get all users
  getAll: () =>
    api.get<User[]>('/users'),

  // Search users
  search: (searchTerm: string) =>
    api.get<User[]>(`/users/search?q=${searchTerm}`),

  // Get users by status
  getByStatus: (status: string) =>
    api.get<User[]>(`/users/status/${status}`),

  // Get users with roles
  getWithRoles: () =>
    api.get<any[]>('/users/with-roles'),

  // Get user by ID
  getById: (id: number) =>
    api.get<User>(`/users/${id}`),

  // Get user by username
  getByUsername: (username: string) =>
    api.get<User>(`/users/username/${username}`),

  // Get user by email
  getByEmail: (email: string) =>
    api.get<User>(`/users/email/${email}`),

  // Get user roles
  getUserRoles: (id: number) =>
    api.get<any[]>(`/users/${id}/roles`),

  // Create user
  create: (createDto: CreateUserDto) =>
    api.post<User>('/users', createDto),

  // Update user
  update: (id: number, updateDto: UpdateUserDto) =>
    api.put<User>(`/users/${id}`, updateDto),

  // Activate user
  activate: (id: number) =>
    api.put<{ success: boolean }>(`/users/${id}/activate`),

  // Deactivate user
  deactivate: (id: number) =>
    api.put<{ success: boolean }>(`/users/${id}/deactivate`),

  // Assign role to user
  assignRole: (id: number, roleId: number, assignedBy?: number) =>
    api.post<{ success: boolean }>(`/users/${id}/roles`, { role_id: roleId, assigned_by: assignedBy }),

  // Remove role from user
  removeRole: (id: number, roleId: number) =>
    api.delete<{ success: boolean }>(`/users/${id}/roles/${roleId}`),

  // Delete user
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/users/${id}`),
};
