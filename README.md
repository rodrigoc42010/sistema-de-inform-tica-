# Sistema de Informática - Gestão de Chamados Técnicos

## Descrição
Sistema completo para gerenciamento de chamados técnicos na área de informática, conectando clientes e técnicos. O sistema permite o acompanhamento em tempo real dos chamados, com suporte a anexos de fotos e vídeos, geolocalização para encontrar técnicos próximos, e sistema de aprovação/reprovação de orçamentos.

## Tecnologias Utilizadas
- **Frontend**: React.js, Material-UI
- **Backend**: Node.js, Express
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT
- **Geolocalização**: Google Maps API
- **Upload de Arquivos**: Multer, AWS S3
- **Pagamentos**: Stripe API

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
# Executar o backend
cd backend
npm start

# Executar o frontend
cd frontend
npm start
```

## Estrutura do Projeto
- `/frontend`: Código fonte do frontend em React
- `/backend`: Código fonte do backend em Node.js/Express
- `/docs`: Documentação adicional do projeto