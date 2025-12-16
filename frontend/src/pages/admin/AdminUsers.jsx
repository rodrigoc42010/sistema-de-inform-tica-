import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    adminService
      .getUsers({ params })
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Erro'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (fn, id) => {
    try {
      await fn(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };

  return (
    <div>
      <h2>Gestão de Usuários</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Todos</option>
          <option value="client">Clientes</option>
          <option value="technician">Técnicos</option>
          <option value="admin">Admins</option>
        </select>
        <button onClick={load} disabled={loading}>
          Carregar
        </button>
      </div>
      {error && <div>Erro: {error}</div>}
      {loading && <div>Carregando...</div>}
      <table width="100%" border="1" cellPadding="8" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => act(adminService.blockUser, u.id)}>
                  Bloquear
                </button>
                <button onClick={() => act(adminService.unblockUser, u.id)}>
                  Desbloquear
                </button>
                <button
                  onClick={() => act(adminService.promoteTechnician, u.id)}
                >
                  Promover p/ Técnico
                </button>
                <button
                  onClick={() =>
                    act((id) => adminService.setRole(id, 'admin'), u.id)
                  }
                >
                  Promover p/ Admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
