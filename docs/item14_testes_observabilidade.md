# Item 14 — Testes e Observabilidade

## Objetivo
- Padronizar testes de backend e instrumentar observabilidade mínima do sistema.
- Entregas: suíte de testes Jest, endpoints de saúde, logger estruturado com `requestId` e documentação de uso.

## Testes (Backend)
- Configuração:
  - Jest config: `backend/jest.config.js:1-45`
  - Setup de ambiente: `backend/tests/setup.js:1-30` (NODE_ENV=test, JWT_SECRET seguro, TEST_DATABASE_URL opcional)
- Suítes implementadas:
  - Resumo Admin: `backend/tests/admin/adminService.summary.test.js:1-36`
  - Usuários Admin: `backend/tests/admin/adminService.users.test.js:1-55`
  - Tickets Admin: `backend/tests/admin/adminService.tickets.test.js:1-39`
  - Autenticação Usuário (básico): `backend/tests/services/userService.test.js:1-82`
- Comandos:
  - `npm run test` (backend)
  - `npm run test -- -t AdminService` (filtra testes Admin)
  - `npm run test:coverage` (relatório de cobertura)

## Observabilidade
- Logger central (Winston): `backend/config/logger.js:154-198`
  - Arquivos:
    - `logs/error.log` (erros)
    - `logs/combined.log` (geral)
    - `logs/login-audit.log` (logins) via `backend/middleware/auditLogger.js:1-159`
    - `logs/admin-audit.log` (admin) via `backend/utils/adminAudit.js:1-22`
    - `logs/structured.log` (JSON line)
- Logger estruturado (JSON): `backend/config/logger.js:186-205`
  - Método: `logger.logStructured({ level, requestId, userId, action, message })`
  - Formato:
    ```json
    { "timestamp": "2025-12-16T18:39:23.566Z", "level": "info", "requestId": "...", "userId": "...", "action": "...", "message": "..." }
    ```
- Request ID middleware: `backend/middleware/requestId.js:1-11`
  - Define `req.requestId` e header `X-Request-Id` em toda requisição
- Endpoints de saúde:
  - Geral: `GET /api/status` em `backend/server.js:420-428`
  - Admin: `GET /api/admin/health` em `backend/routes/adminRoutes.js:64`
    - Resposta: `{ status, database, migrations, timestamp }`

## Como Validar
- Testes:
  - `npm run test -- -t AdminService`
  - Ver o resultado e garantir `PASS` nas suítes admin
- Health:
  - `curl -H "Authorization: Bearer <token_admin>" http://localhost:5000/api/admin/health`
  - Esperado: `{ "status": "ok", "database": "connected", "migrations": "ok", "timestamp": "..." }`
- Logs estruturados:
  - Gerar um log manual: `node -e "require('./backend/config/logger').logStructured({level:'info',requestId:'manual',userId:'admin',action:'TEST',message:'demo'})"`
  - Inspecionar: `type logs\structured.log` (Windows) ou `tail -n 50 logs/structured.log`

## Cobertura de Funcionalidades
- Admin Dashboard (Frontend):
  - Serviço: `frontend/src/services/adminService.js:1-24`
  - Páginas: `frontend/src/pages/admin/*.jsx` (Dashboard, Users, Technicians, Tickets)
  - Rotas protegidas: `frontend/src/App.js:73-80`
- Backend Admin:
  - Rotas: `backend/routes/adminRoutes.js:1-72`
  - Controller: `backend/controllers/adminController.js:1-127`
  - Service: `backend/services/adminService.js:1-232`

## Troubleshooting
- 401 em `/api/admin/*`:
  - Verificar token e `role='admin'`
- `migrations` ≠ `ok`:
  - Conferir criação de tabelas essenciais (`users`, `technicians`, `tickets`, `admin_audit_logs`)
- Logs não criados:
  - Garantir permissão de escrita em `./logs`

## Observações
- Sem bibliotecas pesadas adicionadas; reuso de Winston e Jest existentes.
- Estrutura compatível com o projeto e sem quebra de funcionalidades.
