import { api } from './client';
import type {
  Aircraft,
  AircraftModel,
  CreateAircraftDto,
  UpdateAircraftDto,
  PaginatedResponse,
} from '../types';

export const aircraftApi = {
  // Get all aircraft with pagination
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Aircraft>>(`/aircraft?page=${page}&limit=${limit}`),

  // Get aircraft by ID
  getById: (id: number) =>
    api.get<Aircraft>(`/aircraft/${id}`),

  // Get all aircraft models
  getModels: () =>
    api.get<AircraftModel[]>('/aircraft-models'),

  // Create new aircraft
  create: (createDto: CreateAircraftDto) =>
    api.post<Aircraft>('/aircraft', createDto),

  // Update aircraft
  update: (id: number, updateDto: UpdateAircraftDto) =>
    api.put<Aircraft>(`/aircraft/${id}`, updateDto),

  // Delete aircraft
  delete: (id: number) =>
    api.delete(`/aircraft/${id}`),

  // Get aircraft statistics
  getStatistics: () =>
    api.get<{
      total: number;
      active: number;
      maintenance: number;
      retired: number;
      totalCapacity: number;
    }>('/aircraft/statistics'),

  // Search aircraft
  search: (query: string, page = 1, limit = 10) =>
    api.get<PaginatedResponse<Aircraft>>(`/aircraft/search?q=${query}&page=${page}&limit=${limit}`),
};
