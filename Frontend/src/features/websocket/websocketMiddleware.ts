import type { Middleware } from '@reduxjs/toolkit';
import { socket } from '../../services/socket';
import { connected, disconnected, reconnecting } from './websocketSlice';
import { realTimeUpdate } from '../incidents/incidentsSlice';
import { fetchStatus } from '../incidents/incidentsSlice';
import type { IncidentUpdateEvent } from '../../types';

export const websocketMiddleware: Middleware = (storeApi) => {
  let initialized = false;

  return (next) => (action) => {
    if (!initialized) {
      initialized = true;

      socket.on('connect', () => {
        storeApi.dispatch(connected());
      });

      socket.on('disconnect', () => {
        storeApi.dispatch(disconnected());
      });

      socket.io.on('reconnect_attempt', () => {
        storeApi.dispatch(reconnecting());
      });

      socket.io.on('reconnect', () => {
        storeApi.dispatch(connected());
        storeApi.dispatch(fetchStatus() as never);
      });

      socket.on('incident-updates', (data: IncidentUpdateEvent) => {
        storeApi.dispatch(realTimeUpdate(data));
      });

      socket.connect();
    }

    return next(action);
  };
};
