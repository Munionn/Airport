import { apiClient } from './index';
import type { User } from '../types';

export interface CreateUserDto {
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
  is_active?: boolean;
}

export const usersApi = {
  // Get all users
  getAll: async (page = 1, limit = 10) => {
    const response = await apiClient.get(`/users?page=${page}&limit=${limit}`);
    return response;
  },

  // Get user by ID
  getById: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response;
  },

  // Get user by username
  getByUsername: async (username: string) => {
    const response = await apiClient.get(`/users/username/${username}`);
    return response;
  },

  // Get user by email
  getByEmail: async (email: string) => {
    const response = await apiClient.get(`/users/email/${email}`);
    return response;
  },

  // Search users
  search: async (query: string) => {
    const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response;
  },

  // Get users by status
  getByStatus: async (status: 'active' | 'inactive') => {
    const response = await apiClient.get(`/users/status/${status}`);
    return response;
  },

  // Get users with roles
  getWithRoles: async () => {
    const response = await apiClient.get('/users/with-roles');
    return response;
  },

  // Create user
  create: async (userData: CreateUserDto) => {
    const response = await apiClient.post('/users', userData);
    return response;
  },

  // Update user
  update: async (id: number, userData: UpdateUserDto) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response;
  },

  // Activate user
  activate: async (id: number) => {
    const response = await apiClient.put(`/users/${id}/activate`);
    return response;
  },

  // Deactivate user
  deactivate: async (id: number) => {
    const response = await apiClient.put(`/users/${id}/deactivate`);
    return response;
  },

  // Assign role to user
  assignRole: async (userId: number, roleId: number, assignedBy?: number) => {
    const response = await apiClient.post(`/users/${userId}/roles`, {
      role_id: roleId,
      assigned_by: assignedBy,
    });
    return response;
  },

  // Remove role from user
  removeRole: async (userId: number, roleId: number) => {
    const response = await apiClient.delete(`/users/${userId}/roles/${roleId}`);
    return response;
  },

  // Get user roles
  getUserRoles: async (id: number) => {
    const response = await apiClient.get(`/users/${id}/roles`);
    return response;
  },

  // Delete user
  delete: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response;
  },
};