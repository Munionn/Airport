import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Flight, FlightFilters, SearchFlightDto } from '../../types';

interface FlightsState {
  flights: Flight[];
  selectedFlight: Flight | null;
  filters: FlightFilters;
  searchCriteria: SearchFlightDto;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: FlightsState = {
  flights: [],
  selectedFlight: null,
  filters: {},
  searchCriteria: {},
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

const flightsSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFlights: (state, action: PayloadAction<Flight[]>) => {
      state.flights = action.payload;
    },
    setSelectedFlight: (state, action: PayloadAction<Flight | null>) => {
      state.selectedFlight = action.payload;
    },
    setFilters: (state, action: PayloadAction<FlightFilters>) => {
      state.filters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ key: keyof FlightFilters; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSearchCriteria: (state, action: PayloadAction<SearchFlightDto>) => {
      state.searchCriteria = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number; total: number }>) => {
      state.pagination = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setFlights,
  setSelectedFlight,
  setFilters,
  updateFilter,
  clearFilters,
  setSearchCriteria,
  setPagination,
  clearError,
} = flightsSlice.actions;

export default flightsSlice.reducer;
