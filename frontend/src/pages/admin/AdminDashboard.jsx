import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getSummary()
      .then((res) => setSummary(res.data))
      .catch((e) =>
        setError(e?.response?.data?.message || e.message || 'Erro')
      );
  }, []);

  if (error) return <div>Erro: {error}</div>;
  if (!summary) return <div>Carregando...</div>;

  const { totals, ticketStatus, recent } = summary;

  return (
    <div>
      <h2>Dashboard Administrativo</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>Usuários: {totals.users}</div>
        <div>Técnicos: {totals.technicians}</div>
        <div>Clientes: {totals.clients}</div>
        <div>OS: {totals.tickets}</div>
      </div>
      <h3>Status das OS</h3>
      <ul>
        {ticketStatus.map((s) => (
          <li key={s.status}>
            {s.status || 'indefinido'}: {s.c}
          </li>
        ))}
      </ul>
      <h3>Últimos usuários</h3>
      <ul>
        {recent.users.map((u) => (
          <li key={u.id}>
            {u.email} - {u.role}
          </li>
        ))}
      </ul>
      <h3>Últimas OS</h3>
      <ul>
        {recent.tickets.map((t) => (
          <li key={t.id}>
            {t.title} - {t.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
