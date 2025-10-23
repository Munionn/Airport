import { api } from './client';
import type {
  Passenger,
  CreatePassengerDto,
  UpdatePassengerDto,
  SearchPassengerDto,
  PassengerStatisticsDto,
  PassengerStatisticsResponseDto,
  RegisterPassengerForFlightDto,
  PassengerFlightHistoryDto,
  PaginatedResponse,
} from '../types';

export const passengersApi = {
  // Get all passengers with pagination
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Passenger>>(`/passengers?page=${page}&limit=${limit}`),

  // Search passengers
  search: (searchDto: SearchPassengerDto) =>
    api.get<PaginatedResponse<Passenger>>('/passengers/search', { params: searchDto }),

  // Get passenger statistics
  getStatistics: (statsDto: PassengerStatisticsDto) =>
    api.get<PassengerStatisticsResponseDto>('/passengers/statistics', { params: statsDto }),

  // Get European passengers
  getEuropean: () =>
    api.get<Passenger[]>('/passengers/european'),

  // Get passenger by ID
  getById: (id: number) =>
    api.get<Passenger>(`/passengers/${id}`),

  // Get passenger details
  getDetails: (id: number) =>
    api.get<Passenger>(`/passengers/${id}/details`),

  // Get passenger flight history
  getHistory: (historyDto: PassengerFlightHistoryDto) =>
    api.get<any[]>('/passengers/history', { params: historyDto }),

  // Get passenger info with history
  getInfoWithHistory: (id: number) =>
    api.get<any>(`/passengers/${id}/info-with-history`),

  // Get passenger by passport number
  getByPassportNumber: (passportNumber: string) =>
    api.get<Passenger>(`/passengers/passport/${passportNumber}`),

  // Get passenger by email
  getByEmail: (email: string) =>
    api.get<Passenger>(`/passengers/email/${email}`),

  // Create passenger
  create: (createDto: CreatePassengerDto) =>
    api.post<Passenger>('/passengers', createDto),

  // Register passenger for flight
  registerForFlight: (registerDto: RegisterPassengerForFlightDto) =>
    api.post<any>('/passengers/register-for-flight', registerDto),

  // Update passenger
  update: (id: number, updateDto: UpdatePassengerDto) =>
    api.put<Passenger>(`/passengers/${id}`, updateDto),

  // Delete passenger
  delete: (id: number) =>
    api.delete(`/passengers/${id}`),
};
