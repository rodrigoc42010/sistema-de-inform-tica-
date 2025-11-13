import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import technicianService from './technicianService';

const initialState = {
  technicians: [],
  topTechnicians: [],
  technician: {},
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

// Obter técnicos próximos
export const getNearbyTechnicians = createAsyncThunk(
  'technicians/getNearby',
  async (location, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await technicianService.getNearbyTechnicians(location, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Obter técnico por ID
export const getTechnician = createAsyncThunk(
  'technicians/get',
  async (technicianId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await technicianService.getTechnician(technicianId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Novo: top técnicos por região
export const getTopTechniciansByRegion = createAsyncThunk(
  'technicians/getTopByRegion',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      return await technicianService.getTopTechniciansByRegion(params, token);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Novo: enviar review
export const addTechnicianReview = createAsyncThunk(
  'technicians/addReview',
  async ({ technicianId, ticketId, rating, comment }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await technicianService.addTechnicianReview(technicianId, { ticketId, rating, comment }, token);
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const technicianSlice = createSlice({
  name: 'technician',
  initialState,
  reducers: {
    reset: (state) => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNearbyTechnicians.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNearbyTechnicians.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.technicians = action.payload;
      })
      .addCase(getNearbyTechnicians.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getTechnician.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTechnician.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.technician = action.payload;
      })
      .addCase(getTechnician.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Top técnicos por região
      .addCase(getTopTechniciansByRegion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTopTechniciansByRegion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Garante que topTechnicians seja sempre um array
        state.topTechnicians = Array.isArray(action.payload)
          ? action.payload
          : (Array.isArray(action.payload?.data) ? action.payload.data : []);
      })
      .addCase(getTopTechniciansByRegion.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Falha ao carregar melhores técnicos';
        state.topTechnicians = [];
      })
      // Review
      .addCase(addTechnicianReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addTechnicianReview.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(addTechnicianReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset } = technicianSlice.actions;
export default technicianSlice.reducer;