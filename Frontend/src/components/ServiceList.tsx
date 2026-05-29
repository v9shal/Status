import type { Service } from '../types';

const statusConfig: Record<string, { color: string; label: string }> = {
  operational: { color: '#22c55e', label: 'Operational' },
  degraded: { color: '#eab308', label: 'Degraded Performance' },
  major_outage: { color: '#ef4444', label: 'Major Outage' },
  maintenance: { color: '#3b82f6', label: 'Maintenance' },
};

interface Props {
  services: Service[];
}

export function ServiceList({ services }: Props) {
  if (services.length === 0) {
    return <p style={{ color: '#888' }}>No services registered.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {services.map((svc) => {
        const cfg = statusConfig[svc.status] ?? statusConfig.operational;
        return (
          <div
            key={svc.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              background: '#fff',
              borderBottom: '1px solid #eee',
            }}
          >
            <div>
              <strong>{svc.name}</strong>
              {svc.description && <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{svc.description}</span>}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: cfg.color,
                padding: '4px 10px',
                borderRadius: 12,
                background: `${cfg.color}15`,
              }}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
