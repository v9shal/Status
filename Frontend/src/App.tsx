import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { StatusPage } from './pages/StatusPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCreateIncident } from './pages/AdminCreateIncident';
import { AdminIncidentDetail } from './pages/AdminIncidentDetail';
import { AdminServices } from './pages/AdminServices';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StatusPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="incidents/new" element={<AdminCreateIncident />} />
          <Route path="incidents/:id" element={<AdminIncidentDetail />} />
          <Route path="services" element={<AdminServices />} />
        </Route>
      </Route>
    </Routes>
  );
}
