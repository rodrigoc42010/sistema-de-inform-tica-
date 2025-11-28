import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adsService from './adsService';

const initialState = {
  items: [],
  myAds: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Buscar anúncios ativos
export const fetchActiveAds = createAsyncThunk('ads/fetchActive', async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const token = state.auth?.user?.token || localStorage.getItem('token');
    if (!token) {
      return thunkAPI.rejectWithValue('Não autenticado');
    }
    return await adsService.getActiveAds(token);
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Buscar meus anúncios
export const fetchMyAds = createAsyncThunk('ads/fetchMyAds', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await adsService.getMyAds(token);
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Criar anúncio
export const createAd = createAsyncThunk('ads/create', async (adData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await adsService.createAd({ token, payload: adData });
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Atualizar anúncio
export const updateAd = createAsyncThunk('ads/update', async ({ id, adData }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    return await adsService.updateAd({ token, id, payload: adData });
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
      state.myAds = [];
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
      })
      .addCase(fetchMyAds.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyAds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myAds = action.payload || [];
      })
      .addCase(fetchMyAds.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createAd.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAd.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myAds.push(action.payload);
        state.message = 'Anúncio criado com sucesso!';
      })
      .addCase(createAd.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateAd.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAd.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.myAds = state.myAds.map((ad) =>
          ad.id === action.payload.id ? action.payload : ad
        );
        state.message = 'Anúncio atualizado com sucesso!';
      })
      .addCase(updateAd.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAds } = adsSlice.actions;
export default adsSlice.reducer;