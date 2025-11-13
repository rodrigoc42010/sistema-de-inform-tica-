# 🚀 Guia de Acesso para Equipe - Sistema de Informática

## 🌐 URLs de Acesso

### Acesso Principal (HTTPS Seguro)
- **URL**: `https://45.188.152.240:5443`
- **Frontend**: Interface principal do sistema
- **API**: `https://45.188.152.240:5443/api`

### Acesso Local (Para desenvolvimento)
- **HTTPS**: `https://localhost:5443`
- **HTTP**: `http://localhost:5000` (redireciona para HTTPS)

## 🔐 Configurações de Segurança

### ✅ Implementado
- **Criptografia SSL/TLS**: Todas as comunicações são criptografadas
- **IP Mascarado**: O IP real (45.188.152.240) é mascarado como 192.168.1.100 nos logs
- **Auditoria Completa**: Todos os logins são registrados automaticamente
- **Headers Anti-Kaspersky**: Configurações específicas para evitar bloqueios

### 🛡️ Sistema de Auditoria
- **Logs de Login**: Registra todos os acessos (sucessos e falhas)
- **Informações Capturadas**:
  - Data/hora do acesso
  - Email do usuário
  - IP de origem (mascarado)
  - User-Agent do navegador
  - Status da tentativa (sucesso/falha)
  - Motivo da falha (se aplicável)

## 🔧 Configuração do Kaspersky

### ⚠️ IMPORTANTE: NÃO DESATIVE O KASPERSKY!

Siga estas configurações para permitir acesso sem desativar a proteção:

#### 1. Adicionar Exceções de Rede
1. Abra o Kaspersky Internet Security
2. Vá em **Configurações** → **Proteção** → **Firewall**
3. Clique em **Configurar regras de rede**
4. Adicione nova regra:
   - **Nome**: Sistema Informática
   - **Protocolo**: TCP
   - **Porta**: 5443
   - **Ação**: Permitir

#### 2. Exceções Web
1. **Proteção** → **Navegação Segura** → **Configurações**
2. Na seção **Exceções**, adicione:
   - `https://45.188.152.240:5443`
   - `https://localhost:5443`

#### 3. Certificado SSL
- O sistema usa certificado auto-assinado
- Navegador pode mostrar aviso de segurança
- Clique em **Avançado** → **Continuar para o site**

## 👥 Como Fazer Login

### Para Usuários Comuns
1. Acesse: `https://45.188.152.240:5443`
2. Use email e senha cadastrados

### Para Técnicos
1. Acesse: `https://45.188.152.240:5443`
2. Clique na aba **Técnico**
3. Use seu **Login ID** e senha
4. Formato do Login ID: `TEC[timestamp][número]`

## 📊 Monitoramento de Acesso

### Logs Disponíveis
- **Arquivo**: `logs/login-audit.log`
- **Formato**: JSON por linha
- **Informações**: Timestamp, usuário, IP, status, etc.

### Exemplo de Log
```json
{
  "timestamp": "2025-09-18T00:20:20.779Z",
  "event": "LOGIN",
  "user": {
    "id": "user123",
    "email": "usuario@empresa.com",
    "name": "João Silva"
  },
  "connection": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "method": "POST",
    "path": "/api/users/login"
  },
  "success": true
}
```

## 🧪 Teste de Conectividade

### Script de Teste
Execute no servidor: `node test-login-audit.js`

### Verificações Manuais
1. **SSL**: Verifique se o cadeado aparece no navegador
2. **Logs**: Confirme se tentativas aparecem nos logs
3. **Mascaramento**: IP deve aparecer como 192.168.1.100

## 🆘 Solução de Problemas

### Problema: Kaspersky bloqueia acesso
**Solução**: Siga as configurações de exceção acima

### Problema: Certificado SSL inválido
**Solução**: Aceite o certificado no navegador (é esperado)

### Problema: Não consegue conectar
**Verificações**:
1. Servidor está rodando na porta 5443?
2. Firewall do Windows permite a porta?
3. Kaspersky configurado corretamente?

### Problema: Login não funciona
**Verificações**:
1. Usuário está cadastrado?
2. Senha está correta?
3. Verifique logs de auditoria

## 📞 Suporte

- **Logs de Sistema**: Console do servidor
- **Logs de Auditoria**: `logs/login-audit.log`
- **Configurações**: Arquivo `.env`

## 🔄 Status dos Serviços

Para verificar se tudo está funcionando:
1. **Backend**: Porta 5443 (HTTPS)
2. **Frontend**: Porta 3000 (desenvolvimento)
3. **MongoDB**: Porta 27017 (local)
4. **Logs**: Pasta `logs/`

---

**✅ Sistema configurado e pronto para testes da equipe!**