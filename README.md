# Sistema de Informática - Gestão de Chamados Técnicos

## Descrição
Sistema completo para gerenciamento de chamados técnicos na área de informática, conectando clientes e técnicos. O sistema permite o acompanhamento em tempo real dos chamados, com suporte a anexos de fotos e vídeos, geolocalização para encontrar técnicos próximos, e sistema de aprovação/reprovação de orçamentos.

## Tecnologias Utilizadas
- **Frontend**: React.js, Material-UI
- **Backend**: Node.js, Express
- **Banco de Dados**: MongoDB (dev) e PostgreSQL (prod opcional)
- **Autenticação**: JWT
- **Geolocalização**: Google Maps API
- **Upload de Arquivos**: Multer, AWS S3
- **Pagamentos**: Stripe API (produção)

## Funcionalidades Principais
- Login e registro de usuários (clientes e técnicos)
- Registro e login apenas com email e senha
- Recuperação de senha
- Painel do cliente com visualização de chamados
- Painel do técnico com serviços oferecidos
- Sistema de geolocalização
- Upload de fotos e vídeos
- Sistema de pagamentos
- Barra lateral para divulgação de serviços locais

## Instalação
```bash
# Instalar dependências do frontend
cd frontend
npm install

# Instalar dependências do backend
cd backend
npm install
```

## Execução
```bash
# Executar o backend (dev com Mongo)
npm run server

# Executar o frontend
npm run client
```

## Deploy no Render (PostgreSQL)
- Defina as variáveis de ambiente (exemplo em `.env.example`):
  - `NODE_ENV=production`
  - `DB_TYPE=postgres`
  - `DATABASE_URL` (string de conexão do Postgres)
  - `POSTGRES_SSL=true`
  - `JWT_SECRET` (chave segura)
  - `ALLOWED_ORIGINS` com os domínios do frontend/back
  - `STRIPE_SECRET_KEY` com a chave de produção
  - `REACT_APP_API_BASE_URL` no frontend apontando para o backend

- Na inicialização, o backend cria automaticamente as tabelas necessárias no Postgres (users, technicians, tickets, ads, payments, blacklisted_tokens).

- Observação: a persistência principal do código atual usa MongoDB. O suporte a Postgres criado garante estrutura de tabelas para migração/relatórios e pode evoluir para persistência completa.

## Estrutura do Projeto
- `/frontend`: Código fonte do frontend em React
- `/backend`: Código fonte do backend em Node.js/Express
- `/docs`: Documentação adicional do projeto