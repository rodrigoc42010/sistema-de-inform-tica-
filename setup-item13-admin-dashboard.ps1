Write-Host "🚀 Iniciando Item 13 - Dashboard Admin"

$base = "frontend/src"

$paths = @(
  "$base/pages/admin",
  "$base/services",
  "$base/routes",
  "$base/layouts",
  "$base/styles"
)

foreach ($path in $paths) {
  if (!(Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    Write-Host "📁 Criado: $path"
  }
}

Set-Content "$base/services/adminService.js" @"
import api from './api';

const adminService = {
  getUsers: () => api.get('/admin/users'),
  getTechnicians: () => api.get('/admin/technicians'),
  getTickets: () => api.get('/admin/tickets'),
  getUpgrades: () => api.get('/admin/technician-upgrades')
};

export default adminService;
"@

Set-Content "$base/routes/AdminRoute.jsx" @"
import Navigate from 'react-router-dom';

export default function AdminRoute(props) {
  return props.children;
}
"@

Set-Content "$base/layouts/AdminLayout.jsx" @"
export default function AdminLayout(props) {
  return (
    <div className='admin-layout'>
      <aside className='admin-sidebar'>
        <h3>Admin</h3>
        <a href='/admin'>Dashboard</a>
        <a href='/admin/users'>Usuários</a>
        <a href='/admin/technicians'>Técnicos</a>
        <a href='/admin/tickets'>Tickets</a>
      </aside>
      <main className='admin-content'>
        {props.children}
      </main>
    </div>
  );
}
"@

Set-Content "$base/pages/admin/AdminDashboard.jsx" @"
export default function AdminDashboard() {
  return <h2>Dashboard Administrativo</h2>;
}
"@

Set-Content "$base/pages/admin/AdminUsers.jsx" @"
export default function AdminUsers() {
  return <h2>Gestão de Usuários</h2>;
}
"@

Set-Content "$base/pages/admin/AdminTechnicians.jsx" @"
export default function AdminTechnicians() {
  return <h2>Gestão de Técnicos</h2>;
}
"@

Set-Content "$base/pages/admin/AdminTickets.jsx" @"
export default function AdminTickets() {
  return <h2>Gestão de Tickets</h2>;
}
"@

Set-Content "$base/styles/admin.css" @"
.admin-layout { display: flex; }
.admin-sidebar { width: 220px; background: #1e1e1e; color: white; padding: 20px; }
.admin-sidebar a { display: block; color: white; margin: 10px 0; }
.admin-content { padding: 20px; flex: 1; }
"@

Write-Host "✅ Item 13 criado com sucesso!"
