import { api } from './client';
import type {
  LoginCredentials,
  RegisterDto,
  AuthResponse,
  User,
  Role,
} from '../types';

export const authApi = {
  // Login
  login: (loginDto: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', loginDto),

  // Register
  register: (registerDto: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', registerDto),

  // Logout
  logout: () =>
    api.post('/auth/logout'),

  // Get current user
  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  // Change password
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

  // Forgot password
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  // Reset password
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  // Verify email
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

// Mock auth API for development (since backend auth might not be implemented yet)
export const mockAuthApi = {
  login: async (loginDto: LoginCredentials): Promise<{ data: AuthResponse }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser: User = {
      user_id: 1,
      username: loginDto.email.split('@')[0],
      email: loginDto.email,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      date_of_birth: '1990-01-01',
      passport_number: 'A1234567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const mockRoles: Role[] = [
      {
        role_id: 1,
        role_name: 'passenger',
        description: 'Regular Passenger',
        permissions: { flights: ['read'], tickets: ['create', 'read', 'update'] },
        created_at: new Date().toISOString(),
      },
    ];

    // No token needed - just return user and roles
    return {
      data: {
        user: mockUser,
        roles: mockRoles,
      },
    };
  },

  register: async (registerDto: RegisterDto): Promise<{ data: AuthResponse }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    const mockUser: User = {
      user_id: 2,
      username: registerDto.username,
      email: registerDto.email,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      phone: registerDto.phone,
      date_of_birth: registerDto.date_of_birth,
      passport_number: registerDto.passport_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    const mockRoles: Role[] = [
      {
        role_id: 1,
        role_name: 'passenger',
        description: 'Regular Passenger',
        permissions: { flights: ['read'], tickets: ['create', 'read', 'update'] },
        created_at: new Date().toISOString(),
      },
    ];

    // No token needed - just return user and roles
    return {
      data: {
        user: mockUser,
        roles: mockRoles,
      },
    };
  },

  getCurrentUser: async (): Promise<{ data: User }> => {
    // Check if user is stored in session/localStorage
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      throw new Error('No user session found');
    }

    const user = JSON.parse(storedUser);
    return { data: user };
  },
};