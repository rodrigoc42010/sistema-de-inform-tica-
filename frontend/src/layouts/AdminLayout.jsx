import { Link, Outlet } from 'react-router-dom';
import '../styles/admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>Admin</h3>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Usuários</Link>
        <Link to="/admin/technicians">Técnicos</Link>
        <Link to="/admin/tickets">Tickets</Link>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
