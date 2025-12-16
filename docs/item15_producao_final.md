# Item 15 — Produção Final

## Checklist de Produção
- Headers de segurança aplicados globalmente (`nosniff`, `DENY`, `no-referrer`, `Permissions-Policy`, `HSTS` em produção).
- CORS restrito: `http://localhost:3000` em desenvolvimento; domínios configurados em produção.
- Rate limit aplicado: login/registro (10 tentativas/15 min por IP) e rotas sensíveis.
- Sanitização global de entradas (`validateInput`) sem quebrar payloads.
- Backups automáticos diários com retenção dos 7 mais recentes.
- Endpoints de exportação CSV protegidos por `adminOnly` com auditoria.
- Endpoint de verificação de sanidade do sistema.
- Configurações centralizadas em `backend/config/appConfig.js`.

## Restaurar Backup
- Local: `backups/` na raiz do projeto.
- Arquivo: `backup_YYYY-MM-DD_HH-mm.sql`.
- Restaurar com `psql`:
  - `psql "$env:DATABASE_URL" -f backups/backup_YYYY-MM-DD_HH-mm.sql` (Windows PowerShell)
  - `psql "$DATABASE_URL" -f backups/backup_YYYY-MM-DD_HH-mm.sql` (Linux/Mac)

## Exportar Dados (Admin)
- `GET /api/admin/export/users` → CSV de usuários
- `GET /api/admin/export/tickets` → CSV de tickets
- `GET /api/admin/export/payments` → CSV de pagamentos
- Requer autenticação (`protect`) e perfil admin (`adminOnly`).
- Ação registrada em auditoria administrativa.

## Endpoints Críticos
- `GET /api/admin/system-check` → `{ api, database, backups, diskSpace, lastBackup }`
- `GET /api/admin/health` → saúde de migrações e banco
- `GET /api/status` → status do servidor

## Monitoramento
- Logs: `logs/*.log` e auditoria `logs/login-audit.log`
- Backups: verificar presença em `backups/` e timestamp de `lastBackup` no `system-check`
- CORS/Segurança: validar acesso somente do frontend permitido e cabeçalhos presentes
- Taxa de erro: acompanhar respostas 4xx/5xx nas rotas sensíveis

## Operação
- Iniciar backend: `npm run server` (porta 5000)
- Iniciar frontend: `npm run client` (porta 3000)
- Backups: agendados diariamente às 03:00
- Sem necessidade de variáveis extras de ambiente

