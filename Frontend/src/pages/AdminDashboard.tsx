import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchStatus } from '../features/incidents/incidentsSlice';
import { fetchServices } from '../features/services/servicesSlice';
import { ActiveIncidents } from '../components/ActiveIncidents';
import { ServiceList } from '../components/ServiceList';

export function AdminDashboard() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);
  const activeIncidents = useAppSelector((s) => s.incidents.active);

  useEffect(() => {
    dispatch(fetchStatus());
    dispatch(fetchServices());
  }, [dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h2 style={{ margin: 0 }}>Admin Dashboard</h2>

      <section>
        <h3 style={{ margin: '0 0 8px' }}>Services ({services.length})</h3>
        <ServiceList services={services} />
      </section>

      <section>
        <ActiveIncidents incidents={activeIncidents} />
      </section>
    </div>
  );
}
