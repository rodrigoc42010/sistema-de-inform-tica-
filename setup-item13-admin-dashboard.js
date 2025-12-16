const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Item 13 - Admin Dashboard');

const base = path.join(__dirname, 'frontend', 'src');

const dirs = [
  'pages/admin',
  'services',
  'routes',
  'layouts',
  'styles'
];

dirs.forEach(dir => {
  const fullPath = path.join(base, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log('📁 Criado:', fullPath);
  }
});

fs.writeFileSync(
  path.join(base, 'services', 'adminService.js'),
`import api from './api';

const adminService = {
  getUsers: () => api.get('/admin/users'),
  getTechnicians: () => api.get('/admin/technicians'),
  getTickets: () => api.get('/admin/tickets'),
  getUpgrades: () => api.get('/admin/technician-upgrades')
};

export default adminService;
`
);

fs.writeFileSync(
  path.join(base, 'routes', 'AdminRoute.jsx'),
`export default function AdminRoute({ children }) {
  return children;
}
`
);

fs.writeFileSync(
  path.join(base, 'layouts', 'AdminLayout.jsx'),
`export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Admin</h3>
        <a href="/admin">Dashboard</a>
        <a href="/admin/users">Usuários</a>
        <a href="/admin/technicians">Técnicos</a>
        <a href="/admin/tickets">Tickets</a>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
`
);

fs.writeFileSync(
  path.join(base, 'pages', 'admin', 'AdminDashboard.jsx'),
`export default function AdminDashboard() {
  return <h2>Dashboard Administrativo</h2>;
}
`
);

fs.writeFileSync(
  path.join(base, 'pages', 'admin', 'AdminUsers.jsx'),
`export default function AdminUsers() {
  return <h2>Gestão de Usuários</h2>;
}
`
);

fs.writeFileSync(
  path.join(base, 'pages', 'admin', 'AdminTechnicians.jsx'),
`export default function AdminTechnicians() {
  return <h2>Gestão de Técnicos</h2>;
}
`
);

fs.writeFileSync(
  path.join(base, 'pages', 'admin', 'AdminTickets.jsx'),
`export default function AdminTickets() {
  return <h2>Gestão de Tickets</h2>;
}
`
);

fs.writeFileSync(
  path.join(base, 'styles', 'admin.css'),
`.admin-layout { display: flex; }
.admin-sidebar { width: 220px; background: #1e1e1e; color: white; padding: 20px; }
.admin-sidebar a { display: block; color: white; margin: 10px 0; }
.admin-content { padding: 20px; flex: 1; }
`
);

console.log('✅ Item 13 finalizado com sucesso!');
