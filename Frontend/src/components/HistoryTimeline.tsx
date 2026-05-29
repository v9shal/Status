import type { Incident } from '../types';
import { IncidentCard } from './IncidentCard';

interface Props {
  incidents: Incident[];
}

export function HistoryTimeline({ incidents }: Props) {
  const grouped = incidents.reduce<Record<string, Incident[]>>((acc, inc) => {
    const date = new Date(inc.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(inc);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (sortedDates.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center' }}>No incidents in the past 90 days.</p>;
  }

  return (
    <div>
      {sortedDates.map((date) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 8px', color: '#555', borderBottom: '1px solid #eee', paddingBottom: 6 }}>
            {date}
          </h4>
          {grouped[date].map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      ))}
    </div>
  );
}
