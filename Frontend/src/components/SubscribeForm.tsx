import { useState } from 'react';
import { api } from '../services/api';
import { useAppSelector } from '../app/hooks';

export function SubscribeForm() {
  const services = useAppSelector((s) => s.services.items);
  const [email, setEmail] = useState('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !serviceId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.subscribe(email, Number(serviceId));
      setMessage(res.message);
      setEmail('');
      setServiceId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Subscription failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20, background: '#f8f9fa', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 12px' }}>Subscribe to Updates</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd', flex: 1, minWidth: 200 }}
        />
        <select
          value={serviceId}
          onChange={(e) => setServiceId(Number(e.target.value))}
          required
          style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd' }}
        >
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>
      {message && <p style={{ color: '#22c55e', marginTop: 8, fontSize: 14 }}>{message}</p>}
      {error && <p style={{ color: '#ef4444', marginTop: 8, fontSize: 14 }}>{error}</p>}
    </form>
  );
}
