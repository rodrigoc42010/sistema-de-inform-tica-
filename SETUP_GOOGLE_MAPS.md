# Guia de Instalação - Integração Google Maps

## 📦 Pacotes Necessários

### Backend
```bash
cd backend
npm install axios node-cache
```

### Frontend
```bash
cd frontend
npm install @react-google-maps/api
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

#### Backend
Crie o arquivo `backend/.env` (se não existir) e adicione:
```env
GOOGLE_MAPS_API_KEY=AIzaSyAyj0qK-Dl-vjLtepAWGDdPWuPNpOzdbNw
```

#### Frontend
Crie o arquivo `frontend/.env` e adicione:
```env
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAyj0qK-Dl-vjLtepAWGDdPWuPNpOzdbNw
```

### 2. Migração do Banco de Dados

Execute a migração para adicionar campos de geolocalização:

```bash
# Conecte ao PostgreSQL e execute:
psql -U seu_usuario -d seu_banco -f backend/migrations/add_geolocation_to_technicians.sql
```

Ou manualmente no pgAdmin/DBeaver:
```sql
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_complement TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_zipcode TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_description TEXT;

CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians(latitude, longitude);
```

### 3. Reiniciar Servidores

```bash
# Backend
cd backend
npm start

# Frontend (em outro terminal)
cd frontend
npm start
```

## 🧪 Testar a API

### Endpoint: GET /api/services/local

**Exemplo de requisição:**
```bash
curl "http://localhost:5001/api/services/local?latitude=-23.55052&longitude=-46.633308&radius=10"
```

**Parâmetros:**
- `latitude` (obrigatório): Latitude do usuário
- `longitude` (obrigatório): Longitude do usuário
- `radius` (opcional): Raio de busca em km (padrão: 10)
- `categories` (opcional): Filtrar por categorias (ex: "informatica,celular")

**Resposta esperada:**
```json
{
  "userLocation": {
    "latitude": -23.55052,
    "longitude": -46.633308
  },
  "radius": 10,
  "total": 15,
  "registered": 3,
  "external": 12,
  "services": [
    {
      "id": "123",
      "name": "TechSolutions Informática",
      "address": "Rua Exemplo, 100 - São Paulo, SP",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "distance": 0.05,
      "rating": 5.0,
      "isRegistered": true,
      "canRequestService": true,
      "source": "registered"
    },
    {
      "id": "ChIJ...",
      "name": "Assistência Técnica XYZ",
      "address": "Av. Paulista, 1000",
      "latitude": -23.5610,
      "longitude": -46.6565,
      "distance": 2.3,
      "rating": 4.5,
      "isExternal": true,
      "canRequestService": false,
      "source": "google_places"
    }
  ]
}
```

## 🔧 Solução de Problemas

### Erro: "PowerShell execution policy"
Se não conseguir executar npm, abra PowerShell como Administrador e execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Google Maps API key invalid"
1. Verifique se a API key está correta no arquivo `.env`
2. Confirme que as seguintes APIs estão ativadas no Google Cloud Console:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Erro: "Cannot find module 'axios'"
Execute a instalação dos pacotes:
```bash
cd backend
npm install axios node-cache
```

### Erro: "GOOGLE_MAPS_API_KEY is not defined"
Certifique-se de que:
1. O arquivo `.env` existe
2. A variável está definida sem espaços: `GOOGLE_MAPS_API_KEY=sua_chave`
3. O servidor foi reiniciado após criar o `.env`

## 📝 Próximos Passos

1. ✅ Instalar pacotes npm
2. ✅ Configurar variáveis de ambiente
3. ✅ Executar migração do banco de dados
4. ✅ Reiniciar servidores
5. ⏳ Atualizar formulário de cadastro de técnico (adicionar campos de endereço)
6. ⏳ Implementar frontend da página de Serviços Locais
7. ⏳ Testar geolocalização no navegador

## 🎯 Status Atual

**Backend:**
- ✅ Serviços criados (geocoding, places)
- ✅ Controller implementado
- ✅ Rotas configuradas
- ✅ Migração do banco criada
- ⏳ Pacotes npm precisam ser instalados

**Frontend:**
- ⏳ Componente LocalServices precisa ser atualizado
- ⏳ Integração com Google Maps
- ⏳ Geolocalização do usuário

**Banco de Dados:**
- ⏳ Migração precisa ser executada
