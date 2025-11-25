#!/usr/bin/env node

/**
 * Test script to verify workflow creation
 */

import { N8nClient } from './dist/n8n-client.js';
import dotenv from 'dotenv';

dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

console.log('🧪 Testing Workflow Creation');
console.log('='.repeat(50));

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error('❌ Error: N8N_API_URL and N8N_API_KEY must be set');
  process.exit(1);
}

const client = new N8nClient(N8N_API_URL, N8N_API_KEY);

async function testWorkflowCreation() {
  try {
    console.log('📝 Creating a simple test workflow...');
    
    // Create a simple workflow with a manual trigger and webhook
    const newWorkflow = await client.createWorkflow({
      name: 'AI Created Test Workflow - ' + new Date().toISOString(),
      nodes: [
        {
          parameters: {},
          id: 'manual-trigger',
          name: 'When clicking "Test workflow"',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [250, 300]
        },
        {
          parameters: {
            values: {
              string: [
                {
                  name: 'message',
                  value: '¡Workflow creado con IA exitosamente!'
                }
              ]
            }
          },
          id: 'set-data',
          name: 'Set Message',
          type: 'n8n-nodes-base.set',
          typeVersion: 1,
          position: [450, 300]
        }
      ],
      connections: {
        'When clicking "Test workflow"': {
          main: [
            [
              {
                node: 'Set Message',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      },
      active: false
    });

    console.log('✅ Workflow created successfully!');
    console.log(`   ID: ${newWorkflow.id}`);
    console.log(`   Name: ${newWorkflow.name}`);
    console.log(`   Nodes: ${newWorkflow.nodes?.length || 0}`);
    console.log('');

    // Update the workflow
    console.log('🔄 Updating the workflow...');
    const updatedWorkflow = await client.updateWorkflow(newWorkflow.id, {
      name: newWorkflow.name + ' (Updated)'
    });
    console.log('✅ Workflow updated successfully!');
    console.log(`   New name: ${updatedWorkflow.name}`);
    console.log('');

    // Clean up - delete the test workflow
    console.log('🗑️  Cleaning up - deleting test workflow...');
    await client.deleteWorkflow(newWorkflow.id);
    console.log('✅ Test workflow deleted successfully!');
    console.log('');

    console.log('='.repeat(50));
    console.log('✅ All workflow creation tests passed!');
    console.log('');
    console.log('🎉 You can now create workflows with AI!');

  } catch (error) {
    console.error('');
    console.error('❌ Test failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

testWorkflowCreation();
