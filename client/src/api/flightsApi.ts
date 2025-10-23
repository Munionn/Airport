import { api } from './client';
import type {
  CreateFlightDto,
  UpdateFlightDto,
  SearchFlightDto,
  FlightSearchCriteriaDto,
  FlightStatisticsDto,
  AssignGateDto,
  UpdateFlightStatusDto,
  FlightDelayDto,
  FlightCancellationDto,
} from '../types';

export const flightsApi = {
  // Get all flights with pagination
  getAll: (page = 1, limit = 10) =>
    api.get<any>(`/flights?page=${page}&limit=${limit}`),

  // Search flights
  search: (searchDto: SearchFlightDto) =>
    api.get<any>('/flights/search', { params: searchDto }),

  // Advanced flight search
  advancedSearch: (criteria: FlightSearchCriteriaDto, page = 1, limit = 10) =>
    api.post<any>(`/flights/search/advanced?page=${page}&limit=${limit}`, criteria),

  // Get flight by ID
  getById: (id: number) =>
    api.get<any>(`/flights/${id}`),

  // Get flight by flight number
  getByFlightNumber: (flightNumber: string) =>
    api.get<any>(`/flights/number/${flightNumber}`),

  // Get flights by aircraft
  getByAircraft: (aircraftId: number) =>
    api.get<any[]>(`/flights/aircraft/${aircraftId}`),

  // Get flights by route
  getByRoute: (routeId: number) =>
    api.get<any[]>(`/flights/route/${routeId}`),

  // Get flights by status
  getByStatus: (status: string) =>
    api.get<any[]>(`/flights/status/${status}`),

  // Get flights in date range
  getByDateRange: (startDate: string, endDate: string) =>
    api.get<any[]>(`/flights/date-range?startDate=${startDate}&endDate=${endDate}`),

  // Create flight
  create: (createDto: CreateFlightDto) =>
    api.post<any>('/flights', createDto),

  // Update flight
  update: (id: number, updateDto: UpdateFlightDto) =>
    api.put<any>(`/flights/${id}`, updateDto),

  // Update flight status
  updateStatus: (id: number, updateDto: UpdateFlightStatusDto) =>
    api.put<any>(`/flights/${id}/status`, updateDto),

  // Assign gate
  assignGate: (id: number, assignDto: AssignGateDto) =>
    api.put<any>(`/flights/${id}/gate`, assignDto),

  // Handle delay
  handleDelay: (id: number, delayDto: FlightDelayDto) =>
    api.put<any>(`/flights/${id}/delay`, delayDto),

  // Cancel flight
  cancel: (id: number, cancellationDto: FlightCancellationDto) =>
    api.put<any>(`/flights/${id}/cancel`, cancellationDto),

  // Delete flight
  delete: (id: number) =>
    api.delete(`/flights/${id}`),

  // Check seat availability
  checkSeatAvailability: (id: number, seatNumber: string) =>
    api.get<{ available: boolean }>(`/flights/${id}/seat-availability?seatNumber=${seatNumber}`),

  // Get flight load percentage
  getFlightLoad: (id: number) =>
    api.get<{ loadPercentage: number }>(`/flights/${id}/load`),

  // Get available seats count
  getAvailableSeats: (id: number) =>
    api.get<{ availableSeats: number }>(`/flights/${id}/available-seats`),

  // Get passenger ticket information
  getPassengerTicketInfo: (id: number) =>
    api.get<any[]>(`/flights/${id}/passengers`),

  // Get flight crew
  getFlightCrew: (id: number) =>
    api.get<any[]>(`/flights/${id}/crew`),

  // Get flight baggage
  getFlightBaggage: (id: number) =>
    api.get<any[]>(`/flights/${id}/baggage`),

  // Search flights using database function
  searchFlightsFunction: (departureIata: string, arrivalIata: string, departureDate: string) =>
    api.get<any[]>(`/flights/search/function?departureIata=${departureIata}&arrivalIata=${arrivalIata}&departureDate=${departureDate}`),

  // Get flight statistics
  getStatistics: (statsDto: FlightStatisticsDto) =>
    api.get<any>('/flights/statistics', { params: statsDto }),
};
