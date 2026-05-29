import { useAppSelector } from '../app/hooks';

const statusColors: Record<string, string> = {
  connected: '#22c55e',
  reconnecting: '#eab308',
  disconnected: '#ef4444',
};

export function ConnectionStatus() {
  const status = useAppSelector((s) => s.websocket.status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: statusColors[status],
          display: 'inline-block',
        }}
      />
      <span style={{ textTransform: 'capitalize', opacity: 0.7 }}>{status}</span>
    </div>
  );
}
