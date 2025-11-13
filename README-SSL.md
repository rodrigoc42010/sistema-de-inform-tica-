# Configuração SSL e Acesso Externo

## 🔒 Configuração Implementada

### Certificados SSL
- **Certificado**: `ssl/cert.pem`
- **Chave Privada**: `ssl/key.pem`
- **Tipo**: Auto-assinado para desenvolvimento
- **Validade**: 365 dias
- **IP Configurado**: 45.188.152.240

### Portas de Acesso
- **HTTP**: 5000 (redireciona para HTTPS)
- **HTTPS**: 5443 (criptografado)

### Segurança Implementada
- ✅ Criptografia SSL/TLS
- ✅ Verificação de IP específico (45.188.152.240)
- ✅ CORS configurado para IP autorizado
- ✅ Middleware de autenticação por IP

## 🌐 URLs de Acesso

### Acesso Local
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5443`

### Acesso Externo (IP Específico)
- **URL Principal**: `https://45.188.152.240:5443`
- **Frontend**: `https://45.188.152.240:5443`
- **API**: `https://45.188.152.240:5443/api`

## 🔧 Configurações de Ambiente

```env
HTTPS_PORT=5443
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
ALLOWED_IP=45.188.152.240
```

## 🛡️ Recursos de Segurança

1. **Criptografia End-to-End**: Todas as comunicações são criptografadas via SSL
2. **Controle de Acesso por IP**: Apenas o IP 45.188.152.240 tem acesso
3. **Certificado Personalizado**: Gerado especificamente para o IP configurado
4. **CORS Restritivo**: Configurado apenas para origens autorizadas

## 📝 Notas Importantes

- O certificado é auto-assinado, então navegadores podem mostrar aviso de segurança
- Para produção, recomenda-se usar certificado de uma CA confiável
- O acesso está restrito ao IP 45.188.152.240 conforme solicitado
- Todas as comunicações são criptografadas e seguras

## 🧪 Teste de Conectividade

Execute `node test-ssl.js` para verificar se o SSL está funcionando corretamente.