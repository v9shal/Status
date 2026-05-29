import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchStatus } from '../features/incidents/incidentsSlice';
import { fetchServices } from '../features/services/servicesSlice';
import { ServiceList } from '../components/ServiceList';
import { ActiveIncidents } from '../components/ActiveIncidents';
import { SubscribeForm } from '../components/SubscribeForm';

export function StatusPage() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);
  const activeIncidents = useAppSelector((s) => s.incidents.active);
  const loading = useAppSelector((s) => s.incidents.loading);

  useEffect(() => {
    dispatch(fetchStatus());
    dispatch(fetchServices());
  }, [dispatch]);

  if (loading) {
    return <p>Loading status...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <h2 style={{ margin: '0 0 12px' }}>Current Status</h2>
        <ServiceList services={services} />
      </section>

      <section>
        <ActiveIncidents incidents={activeIncidents} />
      </section>

      <section>
        <SubscribeForm />
      </section>
    </div>
  );
}
