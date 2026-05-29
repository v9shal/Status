import { createSlice } from '@reduxjs/toolkit';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface WebsocketState {
  status: ConnectionStatus;
}

const initialState: WebsocketState = {
  status: 'disconnected',
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    connected(state) {
      state.status = 'connected';
    },
    disconnected(state) {
      state.status = 'disconnected';
    },
    reconnecting(state) {
      state.status = 'reconnecting';
    },
  },
});

export const { connected, disconnected, reconnecting } = websocketSlice.actions;
export default websocketSlice.reducer;
