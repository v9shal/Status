import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchHistory } from '../features/incidents/incidentsSlice';
import { HistoryTimeline } from '../components/HistoryTimeline';

export function HistoryPage() {
  const dispatch = useAppDispatch();
  const history = useAppSelector((s) => s.incidents.history);

  useEffect(() => {
    dispatch(fetchHistory());
  }, [dispatch]);

  return (
    <div>
      <h2 style={{ margin: '0 0 16px' }}>Incident History</h2>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Past 90 days</p>
      <HistoryTimeline incidents={history} />
    </div>
  );
}
