# Configuração do Kaspersky para Acesso ao Sistema

## 🛡️ Configurações Recomendadas (SEM DESATIVAR O KASPERSKY)

### 1. Adicionar Exceções de Aplicativo
1. Abra o Kaspersky Internet Security
2. Vá em **Configurações** → **Proteção** → **Firewall**
3. Clique em **Configurar regras de aplicativo**
4. Adicione uma nova regra para:
   - **Aplicativo**: Navegador (Chrome, Firefox, Edge)
   - **Ação**: Permitir
   - **Porta**: 5443 (HTTPS)
   - **Protocolo**: TCP

### 2. Configurar Exceções de Rede
1. No Kaspersky, vá em **Proteção** → **Firewall**
2. Clique em **Configurar regras de rede**
3. Adicione uma nova regra:
   - **Nome**: Sistema Informática
   - **Direção**: Entrada e Saída
   - **Protocolo**: TCP
   - **Porta local**: 5443
   - **Ação**: Permitir

### 3. Adicionar Site às Exceções Web
1. Vá em **Proteção** → **Navegação Segura**
2. Clique em **Configurações**
3. Na seção **Exceções**, adicione:
   - `https://localhost:5443`
   - `https://192.168.1.100:5443`
   - Seu domínio/IP específico

### 4. Configurar Verificação de Certificados
1. Em **Proteção** → **Navegação Segura**
2. Clique em **Configurações avançadas**
3. Desmarque **Verificar certificados SSL** apenas para os sites do sistema
4. Ou adicione o certificado do sistema como confiável

### 5. Configurações de Aplicativo Web
1. Vá em **Proteção** → **Controle de Aplicativos**
2. Encontre seu navegador na lista
3. Configure como **Permitir** para conexões de rede
4. Adicione exceção para a porta 5443

## 🔧 Headers de Segurança Implementados

O sistema já foi configurado com headers específicos para o Kaspersky:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Kaspersky-Safe: true
X-Antivirus-Safe: verified
```

## 📋 Checklist de Configuração

- [ ] Regra de aplicativo criada para o navegador
- [ ] Regra de rede criada para porta 5443
- [ ] Site adicionado às exceções web
- [ ] Certificado SSL configurado como confiável
- [ ] Controle de aplicativos configurado
- [ ] Teste de acesso realizado

## 🚨 Importante

- **NÃO desative o Kaspersky completamente**
- Apenas configure exceções específicas
- Mantenha todas as outras proteções ativas
- Teste o acesso após cada configuração

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do Kaspersky
2. Confirme se todas as regras foram aplicadas
3. Reinicie o navegador após as configurações
4. Teste com diferentes navegadores se necessário