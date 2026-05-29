import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { createIncident } from '../features/incidents/incidentsSlice';
import { fetchServices } from '../features/services/servicesSlice';
import { useNavigate } from 'react-router-dom';

export function AdminCreateIncident() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const services = useAppSelector((s) => s.services.items);

  const [serviceId, setServiceId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !title || !description) return;
    setSubmitting(true);
    setError('');
    try {
      await dispatch(createIncident({ service_id: Number(serviceId), title, description })).unwrap();
      navigate('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>Create Incident</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Service</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(Number(e.target.value))}
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd' }}
          >
            <option value="">Select service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief incident title"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe what is happening..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {submitting ? 'Creating...' : 'Create Incident'}
        </button>
      </form>
    </div>
  );
}
