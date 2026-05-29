import type { Incident } from '../types';

const statusColors: Record<string, string> = {
  investigating: '#ef4444',
  identified: '#f97316',
  monitoring: '#eab308',
  resolved: '#22c55e',
};

interface Props {
  incident: Incident;
  onClick?: () => void;
}

export function IncidentCard({ incident, onClick }: Props) {
  const color = statusColors[incident.status] ?? '#888';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        background: '#fff',
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        marginBottom: 10,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{incident.title}</h4>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            color,
            padding: '3px 8px',
            borderRadius: 4,
            background: `${color}15`,
          }}
        >
          {incident.status}
        </span>
      </div>
      {incident.description && (
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555' }}>{incident.description}</p>
      )}
      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#999' }}>
        {new Date(incident.created_at).toLocaleString()}
      </p>
    </div>
  );
}
