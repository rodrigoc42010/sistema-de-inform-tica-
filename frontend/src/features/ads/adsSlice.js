import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adsService from './adsService';

const initialState = {
  items: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Buscar anúncios ativos
export const fetchActiveAds = createAsyncThunk('ads/fetchActive', async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth?.user?.token;
    return await adsService.getActiveAds(token);
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    resetAds: (state) => {
      state.items = [];
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveAds.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchActiveAds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = action.payload || [];
      })
      .addCase(fetchActiveAds.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAds } = adsSlice.actions;
export default adsSlice.reducer;