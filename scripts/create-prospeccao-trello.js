#!/usr/bin/env node

/**
 * Script para criar automação simplificada:
 * WhatsApp (Evolution API) → Trello
 * 
 * Pipeline de Prospecção de Imóveis:
 * 1. Novos
 * 2. 🟢 Vende
 * 3. 🟡 Em prospecção
 * 4. 🔵 Nenhum contato encontrado do PP
 * 5. 🔴 Descartado
 */

import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
    console.error('❌ Error: N8N_API_URL e N8N_API_KEY devem estar configurados no .env');
    process.exit(1);
}

function requiredEnv(name, fallback = '') {
    const value = process.env[name] ?? fallback;
    if (!value || value.startsWith('SEU_') || value.startsWith('SUA_')) {
        throw new Error(`Variável obrigatória não configurada: ${name}`);
    }
    return value;
}

let CONFIG;
try {
    // Configurações vindas do .env
    CONFIG = {
        // Evolution API
        EVOLUTION_API_URL: requiredEnv('EVOLUTION_API_URL', 'http://localhost:8080'),
        EVOLUTION_API_KEY: requiredEnv('EVOLUTION_API_KEY'),

        // Trello
        TRELLO_BOARD_ID: requiredEnv('TRELLO_BOARD_ID'),
        TRELLO_LIST_NOVOS_ID: requiredEnv('TRELLO_LIST_NOVOS_ID')
    };
} catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('   Atualize o arquivo .env antes de executar este script.');
    process.exit(1);
}

const workflow = {
    name: 'Prospecção Imóveis - WhatsApp para Trello',
    nodes: [
        // 1. WEBHOOK - Recebe mensagens do Evolution API
        {
            id: 'webhook-evolution',
            name: 'Webhook WhatsApp',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [260, 300],
            webhookId: 'prospeccao-imoveis-trello',
            parameters: {
                httpMethod: 'POST',
                path: 'prospeccao-imoveis',
                responseMode: 'responseNode',
                options: {}
            }
        },

        // 2. RESPONDER WEBHOOK
        {
            id: 'responder-webhook',
            name: 'Responder OK',
            type: 'n8n-nodes-base.respondToWebhook',
            typeVersion: 1.1,
            position: [1300, 300],
            parameters: {
                respondWith: 'json',
                responseBody: '={"status": "ok", "message": "Card criado no Trello"}'
            }
        },

        // 3. SWITCH - Filtrar tipo de mensagem
        {
            id: 'filtrar-tipo',
            name: 'Tipo de Mensagem',
            type: 'n8n-nodes-base.switch',
            typeVersion: 3.2,
            position: [460, 300],
            parameters: {
                dataType: 'string',
                value: '={{ $json.body.data.messageType }}',
                rules: {
                    rules: [
                        { operation: 'equals', value: 'imageMessage' },
                        { operation: 'equals', value: 'conversation' },
                        { operation: 'equals', value: 'extendedTextMessage' }
                    ],
                    fallbackOutput: 'extra'
                }
            }
        },

        // 4. SET - Processar Imagem
        {
            id: 'processar-imagem',
            name: 'Processar Foto',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [680, 180],
            parameters: {
                mode: 'manual',
                duplicateItem: false,
                includeOtherFields: false,
                options: {},
                assignments: {
                    assignments: [
                        { id: '1', name: 'tipo', type: 'string', value: 'imagem' },
                        { id: '2', name: 'telefone', type: 'string', value: "={{ $json.body.data.key.remoteJid.replace('@s.whatsapp.net', '') }}" },
                        { id: '3', name: 'timestamp', type: 'string', value: '={{ new Date().toLocaleString("pt-BR") }}' },
                        { id: '4', name: 'caption', type: 'string', value: "={{ $json.body.data.message.imageMessage.caption || 'Sem descrição' }}" },
                        { id: '5', name: 'messageId', type: 'string', value: '={{ $json.body.data.key.id }}' },
                        { id: '6', name: 'instanceName', type: 'string', value: '={{ $json.body.instance }}' },
                        { id: '7', name: 'temFoto', type: 'boolean', value: '={{ true }}' }
                    ]
                }
            }
        },

        // 5. SET - Processar Texto
        {
            id: 'processar-texto',
            name: 'Processar Texto',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [680, 360],
            parameters: {
                mode: 'manual',
                duplicateItem: false,
                includeOtherFields: false,
                options: {},
                assignments: {
                    assignments: [
                        { id: '1', name: 'tipo', type: 'string', value: 'texto' },
                        { id: '2', name: 'telefone', type: 'string', value: "={{ $json.body.data.key.remoteJid.replace('@s.whatsapp.net', '') }}" },
                        { id: '3', name: 'timestamp', type: 'string', value: '={{ new Date().toLocaleString("pt-BR") }}' },
                        { id: '4', name: 'mensagem', type: 'string', value: "={{ $json.body.data.message.conversation || $json.body.data.message.extendedTextMessage?.text || '' }}" },
                        { id: '5', name: 'messageId', type: 'string', value: '={{ $json.body.data.key.id }}' },
                        { id: '6', name: 'instanceName', type: 'string', value: '={{ $json.body.instance }}' },
                        { id: '7', name: 'temFoto', type: 'boolean', value: '={{ false }}' }
                    ]
                }
            }
        },

        // 6. HTTP REQUEST - Download Imagem via Evolution API (só para imagens)
        {
            id: 'download-imagem',
            name: 'Baixar Foto',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.2,
            position: [880, 180],
            parameters: {
                method: 'POST',
                url: `={{ '${CONFIG.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/' + $json.instanceName }}`,
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        { name: 'apikey', value: CONFIG.EVOLUTION_API_KEY },
                        { name: 'Content-Type', value: 'application/json' }
                    ]
                },
                sendBody: true,
                specifyBody: 'json',
                jsonBody: "={{ JSON.stringify({ message: { key: { remoteJid: $json.telefone + '@s.whatsapp.net', id: $json.messageId } } }) }}",
                options: {}
            }
        },

        // 7. CODE - Preparar dados para Trello (merge de imagem e texto)
        {
            id: 'preparar-card',
            name: 'Preparar Card',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [880, 360],
            parameters: {
                language: 'javaScript',
                jsCode: `// Prepara os dados para criar o card no Trello
const input = $input.item.json;

// Extrai endereço da mensagem (se for texto)
const mensagem = input.mensagem || input.caption || 'Novo imóvel';
const telefone = input.telefone;
const timestamp = input.timestamp;

// Título do card = primeira linha da mensagem ou "Novo imóvel"
const linhas = mensagem.split('\\n');
const titulo = linhas[0].substring(0, 100) || 'Novo imóvel - ' + timestamp;

// Descrição do card
const descricao = \`📱 **Telefone:** \${telefone}
📅 **Data:** \${timestamp}

📝 **Mensagem completa:**
\${mensagem}

---
_Cadastrado automaticamente via WhatsApp_\`;

return [{
  json: {
    titulo: titulo,
    descricao: descricao,
    telefone: telefone,
    timestamp: timestamp,
    mensagem: mensagem,
    temFoto: input.temFoto || false
  }
}];`
            }
        },

        // 8. TRELLO - Criar Card
        {
            id: 'criar-card-trello',
            name: 'Criar Card Trello',
            type: 'n8n-nodes-base.trello',
            typeVersion: 1,
            position: [1080, 300],
            credentials: {
                trelloApi: {
                    id: '',
                    name: 'Trello API'
                }
            },
            parameters: {
                resource: 'card',
                operation: 'create',
                listId: CONFIG.TRELLO_LIST_NOVOS_ID,
                name: '={{ $json.titulo }}',
                description: '={{ $json.descricao }}',
                additionalFields: {
                    pos: 'top'
                }
            }
        },

        // 9. SET - Ignorar mensagens não suportadas
        {
            id: 'ignorar',
            name: 'Ignorar',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [680, 520],
            parameters: {
                mode: 'manual',
                duplicateItem: false,
                includeOtherFields: false,
                options: {},
                assignments: {
                    assignments: [
                        { id: '1', name: 'status', type: 'string', value: 'ignored' },
                        { id: '2', name: 'reason', type: 'string', value: 'Tipo de mensagem não suportado' }
                    ]
                }
            }
        }
    ],
    connections: {
        'Webhook WhatsApp': {
            main: [[{ node: 'Tipo de Mensagem', type: 'main', index: 0 }]]
        },
        'Tipo de Mensagem': {
            main: [
                [{ node: 'Processar Foto', type: 'main', index: 0 }],      // Output 0: imageMessage
                [{ node: 'Processar Texto', type: 'main', index: 0 }],    // Output 1: conversation
                [{ node: 'Processar Texto', type: 'main', index: 0 }],    // Output 2: extendedTextMessage
                [{ node: 'Ignorar', type: 'main', index: 0 }]             // Output 3: fallback
            ]
        },
        'Processar Foto': {
            main: [[{ node: 'Baixar Foto', type: 'main', index: 0 }]]
        },
        'Baixar Foto': {
            main: [[{ node: 'Preparar Card', type: 'main', index: 0 }]]
        },
        'Processar Texto': {
            main: [[{ node: 'Preparar Card', type: 'main', index: 0 }]]
        },
        'Preparar Card': {
            main: [[{ node: 'Criar Card Trello', type: 'main', index: 0 }]]
        },
        'Criar Card Trello': {
            main: [[{ node: 'Responder OK', type: 'main', index: 0 }]]
        },
        'Ignorar': {
            main: [[{ node: 'Responder OK', type: 'main', index: 0 }]]
        }
    },
    settings: {
        executionOrder: 'v1'
    }
};

async function createWorkflow() {
    console.log('📋 Criando workflow: Prospecção Imóveis - WhatsApp → Trello');
    console.log('='.repeat(60));
    console.log('');

    try {
        const response = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': N8N_API_KEY
            },
            body: JSON.stringify(workflow)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        console.log('✅ Workflow criado com sucesso!');
        console.log('');
        console.log('📋 INFORMAÇÕES DO WORKFLOW:');
        console.log('-'.repeat(40));
        console.log(`   ID: ${result.id}`);
        console.log(`   Nome: ${result.name}`);
        console.log(`   URL Editor: ${N8N_API_URL}/workflow/${result.id}`);
        console.log('');

        // URLs do webhook
        const webhookPath = 'prospeccao-imoveis';
        const webhookUrl = `${N8N_API_URL}/webhook/${webhookPath}`;
        const webhookUrlTest = `${N8N_API_URL}/webhook-test/${webhookPath}`;

        console.log('🔗 URLs DO WEBHOOK:');
        console.log('-'.repeat(40));
        console.log(`   Produção: ${webhookUrl}`);
        console.log(`   Teste:    ${webhookUrlTest}`);
        console.log('');

        console.log('═'.repeat(60));
        console.log('📝 GUIA DE CONFIGURAÇÃO');
        console.log('═'.repeat(60));
        console.log('');

        console.log('1️⃣  CRIAR CONTA NO TRELLO:');
        console.log('-'.repeat(40));
        console.log('   a) Acesse: https://trello.com/signup');
        console.log('   b) Crie sua conta gratuita');
        console.log('');

        console.log('2️⃣  CRIAR BOARD DE PROSPECÇÃO:');
        console.log('-'.repeat(40));
        console.log('   a) Clique em "Criar novo quadro"');
        console.log('   b) Nome: "Prospecção de Imóveis"');
        console.log('   c) Crie as listas (colunas):');
        console.log('      • Novos');
        console.log('      • 🟢 Vende');
        console.log('      • 🟡 Em prospecção');
        console.log('      • 🔵 Nenhum contato encontrado do PP');
        console.log('      • 🔴 Descartado');
        console.log('');

        console.log('3️⃣  OBTER API KEY E TOKEN DO TRELLO:');
        console.log('-'.repeat(40));
        console.log('   a) Acesse: https://trello.com/power-ups/admin');
        console.log('   b) Clique em "New" para criar Power-Up');
        console.log('   c) Preencha os dados e salve');
        console.log('   d) Copie a API Key');
        console.log('   e) Clique em "Token" e autorize');
        console.log('   f) Copie o Token');
        console.log('');

        console.log('4️⃣  OBTER IDs DO BOARD E LISTA:');
        console.log('-'.repeat(40));
        console.log('   a) Abra seu board no Trello');
        console.log('   b) Adicione ".json" no final da URL');
        console.log('      Ex: https://trello.com/b/ABC123/meu-board.json');
        console.log('   c) Procure por:');
        console.log('      • "id": "..." (ID do board)');
        console.log('      • "lists" → primeiro item → "id" (ID da lista "Novos")');
        console.log('');

        console.log('5️⃣  CONFIGURAR CREDENCIAL NO N8N:');
        console.log('-'.repeat(40));
        console.log('   a) Abra n8n: http://localhost:5678');
        console.log('   b) Vá em Settings → Credentials');
        console.log('   c) Add Credential → Trello API');
        console.log('   d) Cole a API Key e Token');
        console.log('');

        console.log('6️⃣  CONFIGURAR O WORKFLOW:');
        console.log('-'.repeat(40));
        console.log('   a) Abra o workflow no editor');
        console.log('   b) Clique no node "Criar Card Trello"');
        console.log('   c) Cole o ID da lista "Novos"');
        console.log('   d) Selecione a credencial do Trello');
        console.log('');

        console.log('7️⃣  CONFIGURAR EVOLUTION API:');
        console.log('-'.repeat(40));
        console.log(`   URL do Webhook: ${webhookUrl}`);
        console.log('   Eventos: messages.upsert');
        console.log('');

        console.log('8️⃣  ATIVAR O WORKFLOW');
        console.log('-'.repeat(40));
        console.log('   Clique no botão "Activate" no canto superior direito');
        console.log('');

        console.log('═'.repeat(60));
        console.log('🎉 PRONTO! Após a configuração, envie uma mensagem');
        console.log('   no WhatsApp e ela aparecerá como card no Trello!');
        console.log('═'.repeat(60));

        return result;

    } catch (error) {
        console.error('❌ Erro ao criar workflow:', error.message);
        console.error('');
        console.error('💡 Dicas:');
        console.error('   - Verifique se o n8n está rodando');
        console.error('   - Verifique se a API key está correta');
        process.exit(1);
    }
}

createWorkflow();
