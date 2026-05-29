import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/incidents/new', label: 'Create Incident' },
  { path: '/admin/services', label: 'Services' },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <aside style={{ width: 200, flexShrink: 0 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', color: '#888' }}>Admin</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 14,
                color: location.pathname === item.path ? '#2563eb' : '#555',
                background: location.pathname === item.path ? '#eff6ff' : 'transparent',
                fontWeight: location.pathname === item.path ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
