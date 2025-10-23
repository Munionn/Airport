import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ticket, TicketFilters } from '../../types';

interface TicketsState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  bookingFlow: {
    currentStep: number;
    passengerInfo: any;
    selectedSeat: string | null;
    paymentInfo: any;
  };
}

const initialState: TicketsState = {
  tickets: [],
  selectedTicket: null,
  filters: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  bookingFlow: {
    currentStep: 1,
    passengerInfo: null,
    selectedSeat: null,
    paymentInfo: null,
  },
};

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTickets: (state, action: PayloadAction<Ticket[]>) => {
      state.tickets = action.payload;
    },
    setSelectedTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.selectedTicket = action.payload;
    },
    setFilters: (state, action: PayloadAction<TicketFilters>) => {
      state.filters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: keyof TicketFilters; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number }>) => {
      state.pagination = action.payload;
    },
    // Booking flow actions
    setBookingStep: (state, action: PayloadAction<number>) => {
      state.bookingFlow.currentStep = action.payload;
    },
    setPassengerInfo: (state, action: PayloadAction<any>) => {
      state.bookingFlow.passengerInfo = action.payload;
    },
    setSelectedSeat: (state, action: PayloadAction<string | null>) => {
      state.bookingFlow.selectedSeat = action.payload;
    },
    setPaymentInfo: (state, action: PayloadAction<any>) => {
      state.bookingFlow.paymentInfo = action.payload;
    },
    resetBookingFlow: (state) => {
      state.bookingFlow = {
        currentStep: 1,
        passengerInfo: null,
        selectedSeat: null,
        paymentInfo: null,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setTickets,
  setSelectedTicket,
  setFilters,
  updateFilter,
  clearFilters,
  setPagination,
  setBookingStep,
  setPassengerInfo,
  setSelectedSeat,
  setPaymentInfo,
  resetBookingFlow,
  clearError,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
