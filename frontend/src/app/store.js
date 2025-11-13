import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ticketReducer from '../features/tickets/ticketSlice';
import technicianReducer from '../features/technicians/technicianSlice';
import adsReducer from '../features/ads/adsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    technicians: technicianReducer,
    ads: adsReducer,
  },
});