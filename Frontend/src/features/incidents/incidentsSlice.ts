import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type { Incident, IncidentUpdateEvent } from '../../types';

interface IncidentsState {
  active: Incident[];
  history: Incident[];
  current: Incident | null;
  loading: boolean;
  error: string | null;
  toasts: IncidentUpdateEvent[];
}

const initialState: IncidentsState = {
  active: [],
  history: [],
  current: null,
  loading: false,
  error: null,
  toasts: [],
};

export const fetchStatus = createAsyncThunk('incidents/fetchStatus', async () => {
  return await api.getStatus();
});

export const fetchHistory = createAsyncThunk('incidents/fetchHistory', async () => {
  const res = await api.getHistory();
  return res.incidents;
});

export const fetchIncidentById = createAsyncThunk(
  'incidents/fetchById',
  async (id: number) => {
    return await api.getIncidentById(id);
  }
);

export const createIncident = createAsyncThunk(
  'incidents/create',
  async (data: { service_id: number; title: string; description: string }) => {
    const res = await api.createIncident(data);
    return res.incident;
  }
);

export const patchIncident = createAsyncThunk(
  'incidents/patch',
  async ({ id, ...data }: { id: number; title?: string; description?: string; status?: string; resolved_at?: string }) => {
    const res = await api.patchIncident(id, data);
    return res;
  }
);

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    realTimeUpdate(state, action: PayloadAction<IncidentUpdateEvent>) {
      const event = action.payload;
      const idx = state.active.findIndex((i) => i.id === event.incidentId);
      if (idx !== -1) {
        state.active[idx].status = event.status as Incident['status'];
        if (event.status === 'resolved') {
          state.active.splice(idx, 1);
        }
      }
      state.toasts.push(event);
    },
    dismissToast(state, action: PayloadAction<number>) {
      state.toasts.splice(action.payload, 1);
    },
    clearToasts(state) {
      state.toasts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.active = action.payload.activeIncidents;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch status';
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createIncident.fulfilled, (state, action) => {
        state.active.push(action.payload);
      })
      .addCase(patchIncident.fulfilled, (state, action) => {
        const updated = Array.isArray(action.payload) ? action.payload[0] : action.payload;
        const idx = state.active.findIndex((i) => i.id === updated.id);
        if (idx !== -1) {
          if (updated.status === 'resolved') {
            state.active.splice(idx, 1);
          } else {
            state.active[idx] = updated;
          }
        }
        if (state.current?.id === updated.id) {
          state.current = updated;
        }
      });
  },
});

export const { realTimeUpdate, dismissToast, clearToasts } = incidentsSlice.actions;
export default incidentsSlice.reducer;
