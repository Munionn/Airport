import { api } from './client';
import type {
  Airport,
  CreateAirportDto,
  UpdateAirportDto,
  SearchAirportsDto,
  AirportStatisticsDto,
  AirportDistanceDto,
  City,
} from '../types';

export const airportsApi = {
  // Get all airports
  getAll: (searchDto?: SearchAirportsDto) =>
    api.get<Airport[]>('/airports', { params: searchDto }),

  // Get airport statistics
  getStatistics: (statsDto: AirportStatisticsDto) =>
    api.get<any>('/airports/statistics', { params: statsDto }),

  // Calculate distance between airports
  calculateDistance: (distanceDto: AirportDistanceDto) =>
    api.post<any>('/airports/distance', distanceDto),

  // Get airports by country
  getByCountry: (country: string) =>
    api.get<Airport[]>(`/airports/country/${country}`),

  // Get airports by city
  getByCity: (cityId: number) =>
    api.get<Airport[]>(`/airports/city/${cityId}`),

  // Get airport by IATA code
  getByIataCode: (iataCode: string) =>
    api.get<Airport>(`/airports/iata/${iataCode}`),

  // Get airport by ID
  getById: (id: number) =>
    api.get<Airport>(`/airports/${id}`),

  // Create airport
  create: (createDto: CreateAirportDto) =>
    api.post<Airport>('/airports', createDto),

  // Update airport
  update: (id: number, updateDto: UpdateAirportDto) =>
    api.patch<Airport>(`/airports/${id}`, updateDto),

  // Delete airport
  delete: (id: number) =>
    api.delete(`/airports/${id}`),
};

export const citiesApi = {
  // Get all cities
  getAll: () =>
    api.get<City[]>('/cities'),

  // Get city by ID
  getById: (id: number) =>
    api.get<City>(`/cities/${id}`),

  // Search cities
  search: (searchTerm: string) =>
    api.get<City[]>(`/cities/search?q=${searchTerm}`),

  // Get cities by country
  getByCountry: (country: string) =>
    api.get<City[]>(`/cities/country/${country}`),
};
