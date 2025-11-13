import React from 'react';
import { Chip } from '@mui/material';

// Componente para exibir o status do chamado com cores diferentes
function TicketStatusBadge({ status }) {
  // Definição das cores e labels para cada status
  const statusConfig = {
    novo: {
      color: 'info',
      label: 'Novo'
    },
    em_andamento: {
      color: 'warning',
      label: 'Em Andamento'
    },
    aguardando_aprovação: {
      color: 'secondary',
      label: 'Aguardando Aprovação'
    },
    aprovado: {
      color: 'success',
      label: 'Aprovado'
    },
    reprovado: {
      color: 'error',
      label: 'Reprovado'
    },
    concluído: {
      color: 'success',
      label: 'Concluído'
    },
    cancelado: {
      color: 'error',
      label: 'Cancelado'
    },
    default: {
      color: 'default',
      label: 'Desconhecido'
    }
  };

  // Obter configuração do status ou usar default se não existir
  const config = statusConfig[status] || statusConfig.default;

  return (
    <Chip 
      label={config.label} 
      color={config.color} 
      size="small" 
      variant="filled"
      className="status-badge"
    />
  );
}

export default TicketStatusBadge;