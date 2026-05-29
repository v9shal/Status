import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchIncidentById, patchIncident } from '../features/incidents/incidentsSlice';

const statusOptions = ['investigating', 'identified', 'monitoring', 'resolved'];

export function AdminIncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const incident = useAppSelector((s) => s.incidents.current);

  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) dispatch(fetchIncidentById(Number(id)));
  }, [dispatch, id]);

  useEffect(() => {
    if (incident) setStatus(incident.status);
  }, [incident]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setMessage('');
    try {
      const payload: Record<string, string> = {};
      if (status) payload.status = status;
      if (description) payload.description = description;
      if (status === 'resolved') payload.resolved_at = new Date().toISOString();
      await dispatch(patchIncident({ id: Number(id), ...payload })).unwrap();
      setMessage('Incident updated successfully');
      setDescription('');
    } catch {
      setMessage('Failed to update incident');
    } finally {
      setSubmitting(false);
    }
  };

  if (!incident) return <p>Loading incident...</p>;

  return (
    <div>
      <h2 style={{ margin: '0 0 8px' }}>{incident.title}</h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 4px' }}>
        Service ID: {incident.service_id} | Created: {new Date(incident.created_at).toLocaleString()}
      </p>
      <p style={{ margin: '0 0 20px' }}>
        Current status: <strong style={{ textTransform: 'capitalize' }}>{incident.status}</strong>
      </p>

      {incident.status !== 'resolved' && (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Timeline Update (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add context about what changed..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', resize: 'vertical' }}
            />
          </div>
          {message && (
            <p style={{ fontSize: 14, color: message.includes('Failed') ? '#ef4444' : '#22c55e', margin: 0 }}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              background: status === 'resolved' ? '#22c55e' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Updating...' : status === 'resolved' ? 'Resolve Incident' : 'Post Update'}
          </button>
        </form>
      )}

      {incident.status === 'resolved' && (
        <div style={{ padding: 16, background: '#ecfdf5', borderRadius: 8, color: '#065f46' }}>
          This incident has been resolved.
          {incident.resolved_at && ` (${new Date(incident.resolved_at).toLocaleString()})`}
        </div>
      )}
    </div>
  );
}
