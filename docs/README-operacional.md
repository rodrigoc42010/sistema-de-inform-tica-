# Sistema de Assistência Técnica / Informática

## Visão Geral

Sistema completo para operação por um único operador (não SaaS), com cadastro de clientes, técnicos e gestão de Ordens de Serviço (OS). Backend em Node.js/Express/PostgreSQL e frontend em React.

## Núcleo Consolidado

- Clientes: cadastro com `CPF/CNPJ`, telefone, endereço.
- Técnicos: perfil técnico vinculado a usuário, serviços/especialidades e login técnico.
- Ordens de Serviço (OS): criação, edição e atualização de status, vinculadas ao cliente e ao técnico.
- Alias de OS: endpoints em `/api/os` espelham `/api/tickets`.

## Endpoints Principais

- Autenticação:
  - `POST /api/users/login`
  - `POST /api/users/technician-login`
  - `POST /api/users/logout`
- Clientes/Técnicos:
  - `GET /api/technicians` (consulta)
  - `POST /api/technician-upgrade/request` (solicitar upgrade)
- OS (Tickets):
  - `GET /api/tickets` | `GET /api/os`
  - `POST /api/tickets` | `POST /api/os`
  - `GET /api/tickets/:id` | `GET /api/os/:id`
  - `PUT /api/tickets/:id` | `PUT /api/os/:id`
- Admin (operador com `role=admin`):
  - `GET /api/admin/users`
  - `GET /api/admin/technicians`
  - `GET /api/admin/tickets`
  - `GET /api/admin/technician-upgrades`
  - `POST /api/admin/users/:id/role`

## Padrão de Erros

Todas as respostas de erro seguem envelope JSON:

```json
{ "message": "Descrição do erro", "code": 403 }
```

Para rotas inexistentes sob `/api`, retorna:

```json
{ "message": "Endpoint não encontrado", "code": 404 }
```

## Operação (Passo a Passo)

1. Iniciar backend: `npm run server` (porta 5000)
2. Iniciar frontend: `npm run client` (porta 3000)
3. Login com usuário `admin` para acessar `/admin`.
4. Criar OS:
   - Como cliente ou técnico: utilizar `/api/tickets` no app (Nova OS)
   - Como admin: consultar em `/admin/tickets`
5. Atualizar OS:
   - `PUT /api/tickets/:id` com campos permitidos (status, serviceItems, attachments, finalReport, paymentStatus)

## Frontend

- Rotas admin:
  - `/admin` (Dashboard)
  - `/admin/users`
  - `/admin/technicians`
  - `/admin/tickets`
- Serviço admin: `frontend/src/services/adminService.js` integrado ao backend.
- Layout admin: `frontend/src/layouts/AdminLayout.jsx` com navegação lateral.

## Auditoria

- Logs administrativos: `admin_audit_logs` (PostgreSQL) e `logs/admin-audit.log`.
- Login/logout/auditoria de acesso: `logs/login-audit.log`.

## Segurança e Limites

- Rate limit aplicado em rotas sensíveis.
- Sanitização de entradas (`xss`, `mongo-sanitize`, `hpp`).
- CORS controlado por `ALLOWED_ORIGINS` (produção) e whitelist em desenvolvimento.

## Observações

- Sistema pronto para operação diária por um único operador.
- Alias `/api/os` criado para alinhar linguagem de negócio (OS).
- Sem alterações destrutivas; funcionalidades existentes preservadas.

