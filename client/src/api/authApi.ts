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
    
    // Mock users database - check against real users
    const mockUsers = [
      {
        email: 'admin.manager@airport.com',
        password: 'password123',
        role: 'admin',
        user_id: 13,
        username: 'admin_manager',
        first_name: 'Admin',
        last_name: 'Manager',
        phone: '+1-555-0124',
        passport_number: 'E1234567',
      },
      {
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'passenger',
        user_id: 12,
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1-555-0123',
        passport_number: 'D1234567',
      },
      {
        email: 'operator@airport.com',
        password: 'password123',
        role: 'operator',
        user_id: 14,
        username: 'operator_user',
        first_name: 'Operator',
        last_name: 'User',
        phone: '+1-555-0125',
        passport_number: 'F1234567',
      }
    ];

    // Find user by email and password
    const user = mockUsers.find(u => u.email === loginDto.email && u.password === loginDto.password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Mock user data
    const mockUser: User = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      date_of_birth: '1990-01-01',
      passport_number: user.passport_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      roles: [], // Will be set below
    };

    const mockRoles: Role[] = [
      {
        role_id: user.role === 'admin' ? 1 : user.role === 'operator' ? 2 : 3,
        role_name: user.role,
        description: user.role === 'admin' ? 'System Administrator' : user.role === 'operator' ? 'Airport Operator' : 'Regular Passenger',
        permissions: user.role === 'admin' 
          ? { users: true, flights: true, passengers: true, aircraft: true, cities: true, analytics: true }
          : user.role === 'operator'
          ? { flights: true, passengers: true, aircraft: true }
          : { flights: true, tickets: true },
        created_at: new Date().toISOString(),
      },
    ];

    // Add roles to user
    mockUser.roles = mockRoles;

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