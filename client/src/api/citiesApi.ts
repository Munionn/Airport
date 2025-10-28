import { api } from './client';
import type {
  CreateCityDto,
  UpdateCityDto,
  SearchCitiesDto,
  CityStatisticsDto,
  City,
  CityStatisticsResponse,
  PaginatedResponse,
} from '../types';

export const citiesApi = {
  // Get all cities with pagination and filtering
  getAll: (searchDto: SearchCitiesDto = {}) =>
    api.get<PaginatedResponse<City>>('/cities', { params: searchDto }),

  // Get city by ID
  getById: (id: number) =>
    api.get<City>(`/cities/${id}`),

  // Create city
  create: (createDto: CreateCityDto) =>
    api.post<City>('/cities', createDto),

  // Update city
  update: (id: number, updateDto: UpdateCityDto) =>
    api.patch<City>(`/cities/${id}`, updateDto),

  // Delete city
  delete: (id: number) =>
    api.delete(`/cities/${id}`),

  // Get cities with airports
  getCitiesWithAirports: () =>
    api.get<City[]>('/cities/with-airports'),

  // Get cities by country
  getByCountry: (country: string) =>
    api.get<City[]>(`/cities/country/${country}`),

  // Get city statistics
  getStatistics: (statsDto: CityStatisticsDto) =>
    api.get<CityStatisticsResponse>('/cities/statistics', { params: statsDto }),
};
