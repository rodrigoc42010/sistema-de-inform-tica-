# Sistema de Pagamento PIX - v1.5.0

## Novas Funcionalidades

### Sistema de Cobrança com PIX
- ✅ Geração automática de QR Code PIX
- ✅ Seleção de método de pagamento (PIX, Cartão, Transferência)
- ✅ Campo de chave PIX no perfil do técnico
- ✅ Integração completa frontend/backend

### Melhorias no Sistema de Pagamentos
- ✅ Interface profissional de cobrança
- ✅ Recibos aprimorados com design profissional
- ✅ Envio de lembretes por email
- ✅ Envio de recibos por email

### Banco de Dados
- ✅ Nova coluna `pix_key` na tabela `technicians`
- ✅ Migração automática no deploy

## Arquivos Modificados
- `frontend/src/pages/Payments.jsx` - Reescrito com sistema PIX
- `frontend/package.json` - Adicionado qrcode.react
- `backend/controllers/userController.js` - Suporte a chave PIX
- `backend/migrations/add_pix_key_to_technicians.sql` - Nova migração

## Data de Deploy
2025-11-28 08:21:00 BRT

## Versão Anterior
v1.4.0 - Sistema de Anúncios Premium com Rich Text Editor
