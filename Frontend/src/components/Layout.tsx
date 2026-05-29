import { Outlet, Link } from 'react-router-dom';
import { ConnectionStatus } from './ConnectionStatus';
import { Toast } from './Toast';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: '#111', textDecoration: 'none' }}>
            StatusPage
          </Link>
          <Link to="/" style={{ color: '#555', textDecoration: 'none', fontSize: 14 }}>Status</Link>
          <Link to="/history" style={{ color: '#555', textDecoration: 'none', fontSize: 14 }}>History</Link>
          <Link to="/admin" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Admin</Link>
        </nav>
        <ConnectionStatus />
      </header>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
