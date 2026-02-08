# 🏠 Sistema de Cadastro de Imóveis via WhatsApp

## Guia Completo de Configuração e Uso

---

## 📋 Informações do Workflow

| Campo | Valor |
|-------|-------|
| **ID do Workflow** | `lxd9Q0rz8Lm0jA8Z` |
| **Nome** | Cadastro Imóveis - WhatsApp para Sheets/Notion |
| **URL do Editor** | http://localhost:5678/workflow/lxd9Q0rz8Lm0jA8Z |
| **Status** | ⚠️ **Inativo** (precisa configurar credenciais e ativar) |

---

## 🔗 URLs do Webhook

| Tipo | URL |
|------|-----|
| **Produção** | `http://localhost:5678/webhook/cadastro-imoveis` |
| **Teste** | `http://localhost:5678/webhook-test/cadastro-imoveis` |

> **Nota:** Use a URL de **Teste** durante o desenvolvimento. A URL de **Produção** só funciona quando o workflow está ativo.

---

## 🏗️ Arquitetura do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  📱 WhatsApp                                                                    │
│      │                                                                          │
│      ▼                                                                          │
│  ┌──────────────────┐                                                           │
│  │ Evolution API    │                                                           │
│  │ (Webhook)        │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐                                                           │
│  │ Webhook N8N      │                                                           │
│  │ /cadastro-imoveis│                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌──────────────────┐                                                           │
│  │ Switch           │                                                           │
│  │ (Tipo Mensagem)  │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                     │
│     ┌─────┴─────┐                                                               │
│     │           │                                                               │
│     ▼           ▼                                                               │
│ ┌───────┐   ┌───────┐                                                           │
│ │Imagem │   │ Texto │                                                           │
│ └───┬───┘   └───┬───┘                                                           │
│     │           │                                                               │
│     ▼           ▼                                                               │
│ ┌───────────┐ ┌──────────────┐                                                  │
│ │ Download  │ │ Extrair      │                                                  │
│ │ Base64    │ │ Endereço     │                                                  │
│ └─────┬─────┘ └──────┬───────┘                                                  │
│       │              │                                                          │
│       ▼              │                                                          │
│ ┌───────────┐        │                                                          │
│ │ Upload    │        │                                                          │
│ │ Google    │        │                                                          │
│ │ Drive     │        │                                                          │
│ └─────┬─────┘        │                                                          │
│       │              │                                                          │
│       └──────┬───────┘                                                          │
│              ▼                                                                  │
│       ┌─────────────┐                                                           │
│       │   Merge     │                                                           │
│       └──────┬──────┘                                                           │
│              │                                                                  │
│              ▼                                                                  │
│       ┌─────────────┐       ┌──────────────┐       ┌─────────────┐              │
│       │   Google    │ ────▶ │    Notion    │ ────▶ │  Responder  │              │
│       │   Sheets    │       │   (Página)   │       │   Webhook   │              │
│       └─────────────┘       └──────────────┘       └─────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Passo a Passo de Configuração

### Passo 1: Criar Credenciais no N8N

1. Acesse o n8n: http://localhost:5678
2. Vá em **Settings** → **Credentials**
3. Crie as seguintes credenciais:

#### 1.1. Google Drive OAuth2
- Clique em **Add Credential**
- Busque por "Google Drive OAuth2"
- Siga o fluxo OAuth para autorizar
- **Scopes necessários**: Drive API (read/write)

#### 1.2. Google Sheets OAuth2
- Clique em **Add Credential**
- Busque por "Google Sheets OAuth2"
- Siga o fluxo OAuth para autorizar
- **Scopes necessários**: Sheets API (read/write)

#### 1.3. Notion API
- Clique em **Add Credential**
- Busque por "Notion API"
- Cole seu **Internal Integration Token** (começa com `secret_`)
- [Criar Integration no Notion](https://www.notion.so/my-integrations)

---

### Passo 2: Configurar Google Sheets

1. Crie uma planilha no Google Sheets chamada: **"Cadastro Imóveis - Prospecção"**
2. Na primeira linha (Headers), adicione as colunas:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Data/Hora | Endereço Completo | Rua | Número | Bairro | Cidade | Responsável | Telefone | Link Foto | Status | Link Notion |

3. Anote o **ID da planilha** (está na URL):
   - URL: `https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit`
   
4. No workflow, atualize o node **"Salvar Google Sheets"**:
   - **Document ID**: Cole o ID da planilha
   - **Sheet Name**: `Prospecção` (ou o nome da aba)
   - **Credential**: Selecione a credencial Google Sheets criada

---

### Passo 3: Configurar Google Drive

1. Crie uma pasta no Google Drive para armazenar as fotos
2. Anote o **ID da pasta** (está na URL):
   - URL: `https://drive.google.com/drive/folders/SEU_FOLDER_ID`
   
3. No workflow, atualize o node **"Upload Google Drive"**:
   - **Folder ID**: Cole o ID da pasta
   - **Credential**: Selecione a credencial Google Drive criada

---

### Passo 4: Configurar Notion

1. Crie um **Database** no Notion com as seguintes propriedades:

| Propriedade | Tipo |
|-------------|------|
| Endereço | Title |
| Telefone | Phone Number |
| Status | Select (opções: Novo, Em Análise, Aprovado, Rejeitado) |
| Data Cadastro | Date |
| Rua | Rich Text |
| Número | Number |
| Bairro | Select |
| Cidade | Select |
| Link Foto | URL |

2. **Compartilhe o database com sua integração**:
   - Clique em "..." no canto superior direito do database
   - Vá em "Connections"
   - Adicione sua integração Notion

3. Anote o **ID do Database** (está na URL):
   - URL: `https://notion.so/SEU_WORKSPACE/SEU_DATABASE_ID?v=...`
   
4. No workflow, atualize o node **"Criar Página Notion"**:
   - **Database ID**: Cole o ID
   - **Credential**: Selecione a credencial Notion criada

---

### Passo 5: Configurar Evolution API

1. Acesse o painel da Evolution API
2. Vá em **Webhooks** ou **Configurações**
3. Configure o webhook:

| Campo | Valor |
|-------|-------|
| **URL** | `http://localhost:5678/webhook/cadastro-imoveis` |
| **Eventos** | `messages.upsert` |
| **Método** | POST |

4. No workflow, atualize o node **"Download Imagem Evolution"**:
   - **URL base**: Sua URL da Evolution API
   - **API Key**: Sua API Key

---

### Passo 6: Ativar o Workflow

1. Abra o workflow no editor: http://localhost:5678/workflow/lxd9Q0rz8Lm0jA8Z
2. Verifique se todas as credenciais estão configuradas (ícones verdes)
3. Clique no botão **"Activate"** (canto superior direito)
4. O workflow agora está pronto para receber mensagens!

---

## 🧪 Teste do Sistema

### Teste Manual

1. Com o workflow **inativo**, abra o editor
2. Clique em **"Test Workflow"**
3. Envie um POST para `http://localhost:5678/webhook-test/cadastro-imoveis` com:

```json
{
  "instance": "minha-instancia",
  "body": {
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "msg123"
      },
      "messageType": "conversation",
      "message": {
        "conversation": "Rua das Flores, 123, Centro, São Paulo"
      }
    }
  }
}
```

### Teste com cURL

```bash
curl -X POST http://localhost:5678/webhook-test/cadastro-imoveis \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "test",
    "body": {
      "data": {
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "id": "msg123"
        },
        "messageType": "conversation",
        "message": {
          "conversation": "Avenida Paulista, 1000, Bela Vista, São Paulo"
        }
      }
    }
  }'
```

---

## 📊 Relatório de Teste

Execute o teste acima e verifique:

- [ ] Webhook recebeu a requisição
- [ ] Switch direcionou corretamente
- [ ] Endereço foi extraído
- [ ] Dados foram salvos no Google Sheets
- [ ] Página foi criada no Notion
- [ ] Webhook respondeu com sucesso

---

## ⚠️ Troubleshooting

### Erro: "Credencial não encontrada"
- Verifique se a credencial foi criada com o nome exato
- Reassocie a credencial no node

### Erro: "403 Forbidden" no Google
- Verifique se o OAuth foi autorizado corretamente
- Verifique os scopes da API

### Erro: "401 Unauthorized" no Notion
- Verifique se o token da integração está correto
- Verifique se o database foi compartilhado com a integração

### Erro: Webhook não responde
- Verifique se o workflow está ativo
- Use a URL de teste durante desenvolvimento

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs de execução no n8n
2. Consulte a documentação do n8n: https://docs.n8n.io
3. Evolution API docs: https://doc.evolution-api.com

---

## 📅 Informações da Criação

- **Data de Criação**: 2026-02-06
- **Versão do N8N**: 1.95.2
- **Criado por**: Antigravity AI Agent
