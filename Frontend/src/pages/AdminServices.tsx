import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchServices, createService, updateService } from '../features/services/servicesSlice';

const statusOptions = ['operational', 'degraded_performance', 'partial_outage', 'major_outage', 'maintenance'];

export function AdminServices() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCreating(true);
    try {
      await dispatch(createService({ name, description })).unwrap();
      setName('');
      setDescription('');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (id: number) => {
    if (!editStatus) return;
    await dispatch(updateService({ id, status: editStatus })).unwrap();
    setEditingId(null);
    setEditStatus('');
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>Services</h2>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Service name"
          required
          style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', flex: '1 1 150px' }}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', flex: '2 1 200px' }}
        />
        <button
          type="submit"
          disabled={creating}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {creating ? 'Adding...' : 'Add Service'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {services.map((service) => (
          <div
            key={service.id}
            style={{
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <strong>{service.name}</strong>
              {service.description && <span style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{service.description}</span>}
            </div>
            {editingId === service.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }}
                >
                  <option value="">Select status</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button onClick={() => handleStatusUpdate(service.id)} style={{ fontSize: 13, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, textTransform: 'capitalize', color: service.status === 'operational' ? '#22c55e' : '#f59e0b' }}>
                  {service.status.replace(/_/g, ' ')}
                </span>
                <button onClick={() => { setEditingId(service.id); setEditStatus(service.status); }} style={{ fontSize: 13, cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && <p style={{ color: '#888' }}>No services yet. Add one above.</p>}
      </div>
    </div>
  );
}
