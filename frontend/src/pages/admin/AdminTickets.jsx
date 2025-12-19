import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

export default function AdminTickets() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    clientId: '',
    technicianId: '',
  });
  const [selected, setSelected] = useState(null);
  const [updates, setUpdates] = useState({ status: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    adminService
      .getTickets({ params })
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Erro'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = async (id) => {
    try {
      const res = await adminService.getTicketById(id);
      setSelected(res.data);
      setUpdates({ status: res.data.status || '' });
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };

  const applyStatus = async () => {
    if (!selected?.id) return;
    try {
      await adminService.updateTicketStatus(selected.id, updates);
      load();
      alert('Status atualizado');
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };

  return (
    <div>
      <h2>Gestão de Tickets</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Status"
          value={filters.status}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: e.target.value }))
          }
        />
        <input
          placeholder="Cliente ID"
          value={filters.clientId}
          onChange={(e) =>
            setFilters((p) => ({ ...p, clientId: e.target.value }))
          }
        />
        <input
          placeholder="Técnico ID"
          value={filters.technicianId}
          onChange={(e) =>
            setFilters((p) => ({ ...p, technicianId: e.target.value }))
          }
        />
        <button onClick={load} disabled={loading}>
          Filtrar
        </button>
      </div>
      {error && <div>Erro: {error}</div>}
      {loading && <div>Carregando...</div>}
      <table width="100%" border="1" cellPadding="8" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Cliente</th>
            <th>Técnico</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.status}</td>
              <td>{t.client}</td>
              <td>{t.technician || '-'}</td>
              <td>
                <button onClick={() => view(t.id)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div style={{ marginTop: 16, border: '1px solid #ccc', padding: 12 }}>
          <h3>OS #{selected.id}</h3>
          <div>Título: {selected.title}</div>
          <div>Status atual: {selected.status}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              placeholder="Novo status"
              value={updates.status}
              onChange={(e) =>
                setUpdates((p) => ({ ...p, status: e.target.value }))
              }
            />
            <button onClick={applyStatus}>Aplicar</button>
          </div>
        </div>
      )}
    </div>
  );
}
