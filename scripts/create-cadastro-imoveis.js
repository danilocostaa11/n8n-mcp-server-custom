#!/usr/bin/env node

/**
 * Script para criar automação de Cadastro de Imóveis via WhatsApp
 * 
 * Fluxo:
 * 1. Webhook recebe mensagem do WhatsApp (Evolution API)
 * 2. Processa imagem ou texto
 * 3. Extrai endereço da mensagem
 * 4. Upload da imagem para Google Drive
 * 5. Salva dados no Google Sheets
 * 6. Cria página no Notion
 * 7. Responde ao webhook
 */

import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
    console.error('❌ Error: N8N_API_URL e N8N_API_KEY devem estar configurados no .env');
    process.exit(1);
}

// Configurações - ALTERE ESTES VALORES
const CONFIG = {
    // Evolution API
    EVOLUTION_API_URL: 'http://localhost:8080',
    EVOLUTION_API_KEY: 'SUA_API_KEY_EVOLUTION',

    // Google Drive
    GOOGLE_DRIVE_FOLDER_ID: 'SEU_FOLDER_ID_AQUI',

    // Google Sheets
    GOOGLE_SHEETS_ID: 'SEU_SPREADSHEET_ID_AQUI',
    GOOGLE_SHEETS_NAME: 'Prospecção',

    // Notion
    NOTION_DATABASE_ID: 'SEU_DATABASE_ID_NOTION'
};

const workflow = {
    name: 'Cadastro Imóveis - WhatsApp para Sheets/Notion',
    nodes: [
        // 1. WEBHOOK - Recebe mensagens do Evolution API
        {
            id: 'webhook-evolution',
            name: 'Webhook Evolution API',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [260, 300],
            webhookId: 'cadastro-imoveis-webhook',
            parameters: {
                httpMethod: 'POST',
                path: 'cadastro-imoveis',
                responseMode: 'responseNode',
                options: {}
            }
        },

        // 2. RESPONDER WEBHOOK
        {
            id: 'responder-webhook',
            name: 'Responder Webhook',
            type: 'n8n-nodes-base.respondToWebhook',
            typeVersion: 1.1,
            position: [1700, 300],
            parameters: {
                respondWith: 'json',
                responseBody: '={"status": "ok", "message": "Imóvel cadastrado com sucesso"}'
            }
        },

        // 3. SWITCH - Filtrar tipo de mensagem
        {
            id: 'filtrar-tipo',
            name: 'Filtrar Tipo Mensagem',
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
            name: 'Processar Imagem',
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
                        { id: '3', name: 'timestamp', type: 'string', value: '={{ new Date().toISOString() }}' },
                        { id: '4', name: 'mediaUrl', type: 'string', value: '={{ $json.body.data.message.imageMessage.url }}' },
                        { id: '5', name: 'mediaKey', type: 'string', value: '={{ $json.body.data.message.imageMessage.mediaKey }}' },
                        { id: '6', name: 'mimetype', type: 'string', value: '={{ $json.body.data.message.imageMessage.mimetype }}' },
                        { id: '7', name: 'caption', type: 'string', value: "={{ $json.body.data.message.imageMessage.caption || '' }}" },
                        { id: '8', name: 'messageId', type: 'string', value: '={{ $json.body.data.key.id }}' },
                        { id: '9', name: 'instanceName', type: 'string', value: '={{ $json.body.instance }}' }
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
                        { id: '3', name: 'timestamp', type: 'string', value: '={{ new Date().toISOString() }}' },
                        { id: '4', name: 'mensagem', type: 'string', value: "={{ $json.body.data.message.conversation || $json.body.data.message.extendedTextMessage?.text || '' }}" },
                        { id: '5', name: 'messageId', type: 'string', value: '={{ $json.body.data.key.id }}' },
                        { id: '6', name: 'instanceName', type: 'string', value: '={{ $json.body.instance }}' }
                    ]
                }
            }
        },

        // 6. HTTP REQUEST - Download Imagem via Evolution API
        {
            id: 'download-imagem',
            name: 'Download Imagem Evolution',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.2,
            position: [900, 180],
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

        // 7. SET - Preparar Para Upload
        {
            id: 'preparar-upload',
            name: 'Preparar Para Upload',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [1100, 180],
            parameters: {
                mode: 'manual',
                duplicateItem: false,
                includeOtherFields: false,
                options: {},
                assignments: {
                    assignments: [
                        { id: '1', name: 'base64', type: 'string', value: '={{ $json.base64 }}' },
                        { id: '2', name: 'mimetype', type: 'string', value: '={{ $json.mimetype }}' },
                        { id: '3', name: 'fileName', type: 'string', value: "={{ 'imovel_' + Date.now() + '.jpg' }}" },
                        { id: '4', name: 'telefone', type: 'string', value: "={{ $('Processar Imagem').item.json.telefone }}" },
                        { id: '5', name: 'caption', type: 'string', value: "={{ $('Processar Imagem').item.json.caption }}" },
                        { id: '6', name: 'timestamp', type: 'string', value: "={{ $('Processar Imagem').item.json.timestamp }}" }
                    ]
                }
            }
        },

        // 8. GOOGLE DRIVE - Upload Imagem
        {
            id: 'upload-drive',
            name: 'Upload Google Drive',
            type: 'n8n-nodes-base.googleDrive',
            typeVersion: 3,
            position: [1300, 180],
            credentials: {
                googleDriveOAuth2Api: {
                    id: '',
                    name: 'Google Drive OAuth2'
                }
            },
            parameters: {
                operation: 'upload',
                name: '={{ $json.fileName }}',
                folderId: {
                    __rl: true,
                    mode: 'id',
                    value: CONFIG.GOOGLE_DRIVE_FOLDER_ID
                },
                options: {
                    convert: false
                }
            }
        },

        // 9. CODE - Extrair Endereço da Mensagem
        {
            id: 'extrair-endereco',
            name: 'Extrair Endereco',
            type: 'n8n-nodes-base.code',
            typeVersion: 2,
            position: [900, 360],
            parameters: {
                language: 'javaScript',
                jsCode: `// Recebe a mensagem de texto e extrai informações do endereço
const mensagem = $input.item.json.mensagem || '';
const telefone = $input.item.json.telefone;
const timestamp = $input.item.json.timestamp;

// Regex patterns para extrair dados
const patterns = {
  // Formato: Rua X, 123, Bairro Y, Cidade Z
  enderecoCompleto: /(.+?)(?:,\\s*|\\s+-\\s*)(\\d+)(?:,\\s*|\\s+-\\s*)([^,]+)(?:,\\s*|\\s+-\\s*)(.+)/i,
  // Apenas número
  numero: /(?:n[ºo\\.°]?|numero|número)?\\s*(\\d+)/i,
  // CEP
  cep: /(\\d{5}[-]?\\d{3})/
};

let endereco = {
  enderecoCompleto: mensagem.trim(),
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  responsavel: '',
  telefone: telefone,
  timestamp: timestamp
};

// Tenta extrair partes do endereço
const matchEndereco = mensagem.match(patterns.enderecoCompleto);
if (matchEndereco) {
  endereco.rua = matchEndereco[1].trim();
  endereco.numero = matchEndereco[2].trim();
  endereco.bairro = matchEndereco[3].trim();
  endereco.cidade = matchEndereco[4].trim();
} else {
  // Se não conseguiu parsear, usa a mensagem inteira como endereço
  endereco.enderecoCompleto = mensagem.trim();
}

// Extrai CEP se presente
const matchCep = mensagem.match(patterns.cep);
if (matchCep) {
  endereco.cep = matchCep[1];
}

return [{
  json: endereco
}];`
            }
        },

        // 10. MERGE - Combinar resultados de imagem e texto
        {
            id: 'merge-resultados',
            name: 'Merge Resultados',
            type: 'n8n-nodes-base.merge',
            typeVersion: 3,
            position: [1100, 360],
            parameters: {
                mode: 'chooseBranch',
                output: 'input1'
            }
        },

        // 11. GOOGLE SHEETS - Salvar Dados
        {
            id: 'salvar-sheets',
            name: 'Salvar Google Sheets',
            type: 'n8n-nodes-base.googleSheets',
            typeVersion: 4.5,
            position: [1300, 360],
            credentials: {
                googleSheetsOAuth2Api: {
                    id: '',
                    name: 'Google Sheets OAuth2'
                }
            },
            parameters: {
                operation: 'appendOrUpdate',
                documentId: {
                    __rl: true,
                    mode: 'id',
                    value: CONFIG.GOOGLE_SHEETS_ID
                },
                sheetName: {
                    __rl: true,
                    mode: 'name',
                    value: CONFIG.GOOGLE_SHEETS_NAME
                },
                columns: {
                    mappingMode: 'defineBelow',
                    value: {
                        'Data/Hora': '={{ $json.timestamp }}',
                        'Endereço Completo': '={{ $json.enderecoCompleto }}',
                        'Rua': '={{ $json.rua }}',
                        'Número': '={{ $json.numero }}',
                        'Bairro': '={{ $json.bairro }}',
                        'Cidade': '={{ $json.cidade }}',
                        'Responsável': '={{ $json.responsavel }}',
                        'Telefone': '={{ $json.telefone }}',
                        'Link Foto': "={{ $('Upload Google Drive').item.json?.webViewLink || '' }}",
                        'Status': 'Novo',
                        'Link Notion': ''
                    }
                },
                options: {
                    cellFormat: 'USER_ENTERED'
                }
            }
        },

        // 12. NOTION - Criar Página
        {
            id: 'criar-notion',
            name: 'Criar Página Notion',
            type: 'n8n-nodes-base.notion',
            typeVersion: 2.2,
            position: [1500, 300],
            credentials: {
                notionApi: {
                    id: '',
                    name: 'Notion API'
                }
            },
            parameters: {
                resource: 'page',
                operation: 'create',
                databaseId: {
                    __rl: true,
                    mode: 'id',
                    value: CONFIG.NOTION_DATABASE_ID
                },
                propertiesUi: {
                    propertyValues: [
                        { key: 'Endereço|title', title: "={{ $('Extrair Endereco').item.json.enderecoCompleto }}" },
                        { key: 'Telefone|phone_number', phoneValue: "={{ $('Extrair Endereco').item.json.telefone }}" },
                        { key: 'Status|select', selectValue: 'Novo' },
                        { key: 'Data Cadastro|date', date: '={{ new Date().toISOString() }}', includeTime: true },
                        { key: 'Rua|rich_text', textContent: "={{ $('Extrair Endereco').item.json.rua }}" },
                        { key: 'Número|number', numberValue: "={{ parseInt($('Extrair Endereco').item.json.numero) || 0 }}" },
                        { key: 'Bairro|select', selectValue: "={{ $('Extrair Endereco').item.json.bairro }}" },
                        { key: 'Cidade|select', selectValue: "={{ $('Extrair Endereco').item.json.cidade }}" },
                        { key: 'Link Foto|url', urlValue: "={{ $('Upload Google Drive').item.json?.webViewLink || '' }}" }
                    ]
                },
                options: {}
            }
        },

        // 13. SET - Notificar Erro
        {
            id: 'notificar-erro',
            name: 'Notificar Erro',
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
        'Webhook Evolution API': {
            main: [[{ node: 'Filtrar Tipo Mensagem', type: 'main', index: 0 }]]
        },
        'Filtrar Tipo Mensagem': {
            main: [
                [{ node: 'Processar Imagem', type: 'main', index: 0 }],      // Output 0: imageMessage
                [{ node: 'Processar Texto', type: 'main', index: 0 }],       // Output 1: conversation
                [{ node: 'Processar Texto', type: 'main', index: 0 }],       // Output 2: extendedTextMessage
                [{ node: 'Notificar Erro', type: 'main', index: 0 }]         // Output 3: fallback
            ]
        },
        'Processar Imagem': {
            main: [[{ node: 'Download Imagem Evolution', type: 'main', index: 0 }]]
        },
        'Download Imagem Evolution': {
            main: [[{ node: 'Preparar Para Upload', type: 'main', index: 0 }]]
        },
        'Preparar Para Upload': {
            main: [[{ node: 'Upload Google Drive', type: 'main', index: 0 }]]
        },
        'Upload Google Drive': {
            main: [[{ node: 'Merge Resultados', type: 'main', index: 0 }]]
        },
        'Processar Texto': {
            main: [[{ node: 'Extrair Endereco', type: 'main', index: 0 }]]
        },
        'Extrair Endereco': {
            main: [[{ node: 'Merge Resultados', type: 'main', index: 1 }]]
        },
        'Merge Resultados': {
            main: [[{ node: 'Salvar Google Sheets', type: 'main', index: 0 }]]
        },
        'Salvar Google Sheets': {
            main: [[{ node: 'Criar Página Notion', type: 'main', index: 0 }]]
        },
        'Criar Página Notion': {
            main: [[{ node: 'Responder Webhook', type: 'main', index: 0 }]]
        },
        'Notificar Erro': {
            main: [[{ node: 'Responder Webhook', type: 'main', index: 0 }]]
        }
    },
    settings: {
        executionOrder: 'v1'
    }
};

async function createWorkflow() {
    console.log('🏠 Criando workflow: Cadastro Imóveis - WhatsApp');
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

        // Obter URL do webhook
        const webhookPath = 'cadastro-imoveis';
        const webhookUrl = `${N8N_API_URL}/webhook/${webhookPath}`;
        const webhookUrlTest = `${N8N_API_URL}/webhook-test/${webhookPath}`;

        console.log('🔗 URLs DO WEBHOOK:');
        console.log('-'.repeat(40));
        console.log(`   Produção: ${webhookUrl}`);
        console.log(`   Teste:    ${webhookUrlTest}`);
        console.log('');

        console.log('⚠️  PRÓXIMOS PASSOS:');
        console.log('-'.repeat(40));
        console.log('   1. Abra o workflow no n8n');
        console.log('   2. Configure as credenciais:');
        console.log('      - Google Drive OAuth2');
        console.log('      - Google Sheets OAuth2');
        console.log('      - Notion API');
        console.log('   3. Atualize os IDs nos nodes:');
        console.log(`      - Google Drive Folder ID: ${CONFIG.GOOGLE_DRIVE_FOLDER_ID}`);
        console.log(`      - Google Sheets ID: ${CONFIG.GOOGLE_SHEETS_ID}`);
        console.log(`      - Notion Database ID: ${CONFIG.NOTION_DATABASE_ID}`);
        console.log('   4. Configure o webhook na Evolution API');
        console.log('   5. Ative o workflow');
        console.log('');

        console.log('📱 CONFIGURAÇÃO EVOLUTION API:');
        console.log('-'.repeat(40));
        console.log('   No painel da Evolution API, configure o webhook:');
        console.log(`   URL: ${webhookUrl}`);
        console.log('   Eventos: messages.upsert');
        console.log('');

        console.log('📊 ESTRUTURA GOOGLE SHEETS NECESSÁRIA:');
        console.log('-'.repeat(40));
        console.log('   Colunas (Headers):');
        console.log('   | Data/Hora | Endereço Completo | Rua | Número | Bairro |');
        console.log('   | Cidade | Responsável | Telefone | Link Foto | Status | Link Notion |');
        console.log('');

        console.log('🗃️ PROPRIEDADES NOTION NECESSÁRIAS:');
        console.log('-'.repeat(40));
        console.log('   - Endereço (Title)');
        console.log('   - Telefone (Phone Number)');
        console.log('   - Status (Select: Novo, Em Análise, Aprovado, Rejeitado)');
        console.log('   - Data Cadastro (Date)');
        console.log('   - Rua (Rich Text)');
        console.log('   - Número (Number)');
        console.log('   - Bairro (Select)');
        console.log('   - Cidade (Select)');
        console.log('   - Link Foto (URL)');
        console.log('');

        return result;

    } catch (error) {
        console.error('❌ Erro ao criar workflow:', error.message);
        console.error('');
        console.error('💡 Dicas:');
        console.error('   - Verifique se o n8n está rodando');
        console.error('   - Verifique se a API key está correta');
        console.error('   - Tente reiniciar o n8n');
        process.exit(1);
    }
}

createWorkflow();
