import { api } from './client';
import type {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  SearchTicketDto,
  CheckInDto,
  SeatSelectionDto,
  TicketCancellationDto,
  TicketRefundDto,
  SeatAvailabilityDto,
  SeatAvailabilityResponse,
  TicketStatisticsDto,
  TicketStatisticsResponseDto,
  TicketPricingDto,
  TicketPricingResponseDto,
  PaginatedResponse,
} from '../types';

export const ticketsApi = {
  // Get all tickets with pagination
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Ticket>>(`/tickets?page=${page}&limit=${limit}`),

  // Search tickets
  search: (searchDto: SearchTicketDto) =>
    api.get<PaginatedResponse<Ticket>>('/tickets/search', { params: searchDto }),

  // Get ticket statistics
  getStatistics: (statsDto: TicketStatisticsDto) =>
    api.get<TicketStatisticsResponseDto>('/tickets/statistics', { params: statsDto }),

  // Get ticket pricing
  getPricing: (pricingDto: TicketPricingDto) =>
    api.get<TicketPricingResponseDto>('/tickets/pricing', { params: pricingDto }),

  // Get seat availability
  getSeatAvailability: (availabilityDto: SeatAvailabilityDto) =>
    api.get<SeatAvailabilityResponse>('/tickets/seat-availability', { params: availabilityDto }),

  // Get ticket by ID
  getById: (id: number) =>
    api.get<Ticket>(`/tickets/${id}`),

  // Get ticket by ticket number
  getByTicketNumber: (ticketNumber: string) =>
    api.get<Ticket>(`/tickets/number/${ticketNumber}`),

  // Check seat availability for specific flight
  checkSeatAvailability: (flightId: number, seatNumber: string) =>
    api.get<{ available: boolean }>(`/tickets/${flightId}/seat-availability?seatNumber=${seatNumber}`),

  // Create ticket
  create: (createDto: CreateTicketDto) =>
    api.post<Ticket>('/tickets', createDto),

  // Check in
  checkIn: (checkInDto: CheckInDto) =>
    api.post<Ticket>('/tickets/check-in', checkInDto),

  // Select seat
  selectSeat: (seatSelectionDto: SeatSelectionDto) =>
    api.post<Ticket>('/tickets/select-seat', seatSelectionDto),

  // Cancel ticket
  cancel: (cancellationDto: TicketCancellationDto) =>
    api.post<Ticket>('/tickets/cancel', cancellationDto),

  // Process refund
  processRefund: (refundDto: TicketRefundDto) =>
    api.post<Ticket>('/tickets/refund', refundDto),

  // Update ticket
  update: (id: number, updateDto: UpdateTicketDto) =>
    api.put<Ticket>(`/tickets/${id}`, updateDto),

  // Delete ticket
  delete: (id: number) =>
    api.delete(`/tickets/${id}`),
};
