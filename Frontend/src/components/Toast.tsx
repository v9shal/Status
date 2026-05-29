import { useAppSelector, useAppDispatch } from '../app/hooks';
import { dismissToast } from '../features/incidents/incidentsSlice';
import { useEffect } from 'react';

export function Toast() {
  const toasts = useAppSelector((s) => s.incidents.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      dispatch(dismissToast(0));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.slice(0, 5).map((t, i) => (
        <div
          key={`${t.incidentId}-${t.timestamp}`}
          style={{
            background: '#1a1a2e',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            borderLeft: '4px solid #fbbf24',
            cursor: 'pointer',
          }}
          onClick={() => dispatch(dismissToast(i))}
        >
          <strong>Incident #{t.incidentId}</strong> — {t.status}
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>{t.message}</p>
        </div>
      ))}
    </div>
  );
}
