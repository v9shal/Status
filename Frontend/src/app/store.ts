import { configureStore } from '@reduxjs/toolkit';
import servicesReducer from '../features/services/servicesSlice';
import incidentsReducer from '../features/incidents/incidentsSlice';
import websocketReducer from '../features/websocket/websocketSlice';
import { websocketMiddleware } from '../features/websocket/websocketMiddleware';

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    incidents: incidentsReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
