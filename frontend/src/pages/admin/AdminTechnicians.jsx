import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

export default function AdminTechnicians() {
  const [items, setItems] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      adminService.getTechnicians(),
      adminService.getUpgrades({ params: { status: 'pending' } }),
    ])
      .then(([techs, ups]) => {
        setItems(techs.data);
        setUpgrades(ups.data);
      })
      .catch((e) => setError(e?.response?.data?.message || e.message || 'Erro'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvail = async (userId, val) => {
    try {
      await adminService.setTechnicianAvailability(userId, !val);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };

  const approve = async (id) => {
    try {
      await adminService.approveUpgrade(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };
  const reject = async (id) => {
    try {
      await adminService.rejectUpgrade(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Erro');
    }
  };

  return (
    <div>
      <h2>Gestão de Técnicos</h2>
      {error && <div>Erro: {error}</div>}
      {loading && <div>Carregando...</div>}
      <h3>Técnicos</h3>
      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Disponível</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.email}</td>
              <td>{t.availability ? 'Sim' : 'Não'}</td>
              <td>
                <button onClick={() => toggleAvail(t.id, t.availability)}>
                  {t.availability ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Solicitações de Upgrade Pendentes</h3>
      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {upgrades.map((u) => (
            <tr key={u.id}>
              <td>{u.user_id}</td>
              <td>{u.status}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approve(u.id)}>Aprovar</button>
                <button onClick={() => reject(u.id)}>Reprovar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
