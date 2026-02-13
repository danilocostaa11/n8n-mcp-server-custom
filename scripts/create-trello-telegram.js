#!/usr/bin/env node

/**
 * Script para criar automação simples:
 * Telegram (grupo) -> Trello -> Telegram (confirmação)
 *
 * Uso no grupo:
 * /card Titulo do card | Descrição opcional
 */

import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
    console.error('❌ Error: N8N_API_URL e N8N_API_KEY devem estar configurados no .env');
    process.exit(1);
}

function requiredEnv(name) {
    const value = process.env[name] ?? '';
    if (!value || value.startsWith('SEU_') || value.startsWith('SUA_')) {
        throw new Error(`Variável obrigatória não configurada: ${name}`);
    }
    return value;
}

let CONFIG;
try {
    CONFIG = {
        TRELLO_LIST_NOVOS_ID: requiredEnv('TRELLO_LIST_NOVOS_ID'),
        TELEGRAM_ALLOWED_CHAT_ID: process.env.TELEGRAM_ALLOWED_CHAT_ID || ''
    };
} catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('   Atualize o arquivo .env antes de executar este script.');
    process.exit(1);
}

const extractCardCode = `const msg = $input.item.json.message || {};
const text = (msg.text || msg.caption || '').trim();
const chatId = String(msg.chat?.id || '');
const chatType = String(msg.chat?.type || '');
const user = msg.from?.username
  ? '@' + msg.from.username
  : [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ').trim() || 'usuario';

const allowedChat = '${CONFIG.TELEGRAM_ALLOWED_CHAT_ID}';
if (allowedChat && chatId !== allowedChat) {
  return [];
}

if (!['group', 'supergroup'].includes(chatType)) {
  return [];
}

if (!text.toLowerCase().startsWith('/card ')) {
  return [];
}

const content = text.slice(6).trim();
if (!content) {
  return [];
}

const parts = content.split('|');
const title = (parts[0] || '').trim().slice(0, 120) || 'Novo card';
const detail = (parts[1] || '').trim();
const description = [
  detail ? detail : 'Sem descricao adicional',
  '',
  'Solicitante: ' + user,
  'Origem: Telegram grupo',
  'Data: ' + new Date().toISOString()
].join('\\n');

return [{
  json: {
    trelloTitle: title,
    trelloDescription: description,
    telegramChatId: chatId
  }
}];`;

const workflow = {
    name: 'Telegram Grupo -> Trello (Simples)',
    nodes: [
        {
            id: 'telegram-trigger',
            name: 'Telegram Trigger',
            type: 'n8n-nodes-base.telegramTrigger',
            typeVersion: 1.1,
            position: [260, 300],
            credentials: {
                telegramApi: {
                    id: '',
                    name: 'Telegram API'
                }
            },
            parameters: {
                updates: ['message'],
                additionalFields: {}
            }
        },
        {
            id: 'extrair-card',
            name: 'Extrair Card',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [520, 300],
            parameters: {
                language: 'javaScript',
                jsCode: extractCardCode
            }
        },
        {
            id: 'criar-card',
            name: 'Criar Card Trello',
            type: 'n8n-nodes-base.trello',
            typeVersion: 1,
            position: [780, 300],
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
                name: '={{ $json.trelloTitle }}',
                description: '={{ $json.trelloDescription }}',
                additionalFields: {
                    pos: 'top'
                }
            }
        },
        {
            id: 'confirmar-telegram',
            name: 'Confirmar no Telegram',
            type: 'n8n-nodes-base.telegram',
            typeVersion: 1.2,
            position: [1040, 300],
            credentials: {
                telegramApi: {
                    id: '',
                    name: 'Telegram API'
                }
            },
            parameters: {
                resource: 'message',
                operation: 'sendMessage',
                chatId: '={{ $json.telegramChatId }}',
                text: '={{ "Card criado no Trello: " + $json.trelloTitle }}',
                additionalFields: {}
            }
        }
    ],
    connections: {
        'Telegram Trigger': {
            main: [[{ node: 'Extrair Card', type: 'main', index: 0 }]]
        },
        'Extrair Card': {
            main: [[{ node: 'Criar Card Trello', type: 'main', index: 0 }]]
        },
        'Criar Card Trello': {
            main: [[{ node: 'Confirmar no Telegram', type: 'main', index: 0 }]]
        }
    },
    settings: {
        executionOrder: 'v1'
    }
};

async function createWorkflow() {
    console.log('📋 Criando workflow: Telegram Grupo -> Trello (Simples)');
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
        console.log(`   ID: ${result.id}`);
        console.log(`   Nome: ${result.name}`);
        console.log(`   URL Editor: ${N8N_API_URL}/workflow/${result.id}`);
        console.log('');
        console.log('Próximos passos no n8n:');
        console.log('1. Configurar credencial "Telegram API" no node Telegram Trigger e Confirmar no Telegram');
        console.log('2. Configurar credencial "Trello API" no node Criar Card Trello');
        console.log('3. Ativar o workflow');
        console.log('4. No grupo do Telegram, enviar: /card Titulo | Descricao opcional');
        console.log('');
        if (CONFIG.TELEGRAM_ALLOWED_CHAT_ID) {
            console.log(`Filtro de grupo ativo: TELEGRAM_ALLOWED_CHAT_ID=${CONFIG.TELEGRAM_ALLOWED_CHAT_ID}`);
        } else {
            console.log('Sem filtro de grupo: qualquer grupo com o bot pode criar card.');
        }
    } catch (error) {
        console.error('❌ Erro ao criar workflow:', error.message);
        process.exit(1);
    }
}

createWorkflow();
