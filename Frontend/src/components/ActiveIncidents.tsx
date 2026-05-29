import type { Incident } from '../types';
import { IncidentCard } from './IncidentCard';
import { useNavigate } from 'react-router-dom';

interface Props {
  incidents: Incident[];
}

export function ActiveIncidents({ incidents }: Props) {
  const navigate = useNavigate();

  if (incidents.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>
        All systems operational — no active incidents.
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 12px' }}>Active Incidents</h3>
      {incidents.map((inc) => (
        <IncidentCard
          key={inc.id}
          incident={inc}
          onClick={() => navigate(`/admin/incidents/${inc.id}`)}
        />
      ))}
    </div>
  );
}
