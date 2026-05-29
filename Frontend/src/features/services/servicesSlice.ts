import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { Service } from '../../types';

interface ServicesState {
  items: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServicesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchServices = createAsyncThunk('services/fetch', async () => {
  const res = await api.getStatus();
  return res.services;
});

export const createService = createAsyncThunk(
  'services/create',
  async (data: { name: string; description: string }) => {
    const res = await api.createService(data);
    return res;
  }
);

export const updateService = createAsyncThunk(
  'services/update',
  async ({ id, ...data }: { id: number; name?: string; description?: string; status?: string }) => {
    const res = await api.updateService(id, data);
    return res;
  }
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch services';
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export const { setServices } = servicesSlice.actions;
export default servicesSlice.reducer;
