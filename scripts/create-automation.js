#!/usr/bin/env node

/**
 * Script para crear automatización Sheets + Notion + WhatsApp
 * Basado en las herramientas del MCP Server personalizado
 */

import { N8nClient } from '../dist/n8n-client.js';
import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY || N8N_API_KEY === 'tu_api_key_aqui') {
  console.error('❌ Error: Configura N8N_API_URL y N8N_API_KEY en el archivo .env primero.');
  process.exit(1);
}

const client = new N8nClient(N8N_API_URL, N8N_API_KEY);

async function createAutomation() {
  console.log('🚀 Creando automatizaciónSheets + Notion + WhatsApp...');

  const workflow = {
    name: 'Sheets -> Notion -> WhatsApp (Auto-created)',
    nodes: [
      {
        parameters: {
          pollTimes: {
            item: [
              {
                mode: 'everyMinute'
              }
            ]
          },
          documentId: {
            __rl: true,
            mode: 'id'
          },
          sheetName: {
            __rl: true,
            mode: 'name'
          }
        },
        id: 'sheets-trigger',
        name: 'Google Sheets Trigger',
        type: 'n8n-nodes-base.googleSheetsTrigger',
        typeVersion: 2,
        position: [100, 300]
      },
      {
        parameters: {
          resource: 'databaseItem',
          operation: 'create',
          databaseId: {
            __rl: true,
            mode: 'id'
          },
          propertiesUi: {
            propertyValues: [
              {
                key: 'Name',
                type: 'title',
                title: '={{ $json.Nome }}'
              }
            ]
          }
        },
        id: 'notion-node',
        name: 'Notion',
        type: 'n8n-nodes-base.notion',
        typeVersion: 2,
        position: [350, 300]
      },
      {
        parameters: {
          phoneNumberId: 'seu_phone_number_id',
          recipientPhoneNumber: '={{ $json.Telefone }}',
          template: 'hello_world',
          languageCode: 'pt_BR'
        },
        id: 'whatsapp-node',
        name: 'WhatsApp Business Cloud',
        type: 'n8n-nodes-base.whatsApp',
        typeVersion: 1,
        position: [600, 300]
      }
    ],
    connections: {
      'Google Sheets Trigger': {
        main: [
          [
            {
              node: 'Notion',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Notion': {
        main: [
          [
            {
              node: 'WhatsApp Business Cloud',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    settings: {
      executionOrder: 'v1'
    }
  };

  try {
    const result = await client.createWorkflow(workflow);
    console.log('✅ Workflow creado exitosamente!');
    console.log(`   ID: ${result.id}`);
    console.log(`   URL: ${N8N_API_URL}/workflow/${result.id}`);
    console.log('\n⚠️ Recuerda configurar las credenciales y los IDs (Document ID, Database ID, Phone ID) directamente en n8n.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAutomation();
