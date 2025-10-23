import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../features/auth/authSlice';
import flightsSlice from '../features/flights/flightsSlice';
import ticketsSlice from '../features/tickets/ticketsSlice';
import uiSlice from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    flights: flightsSlice,
    tickets: ticketsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
