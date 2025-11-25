// Test para verificar todas las herramientas del servidor MCP
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Enviar solicitud para listar herramientas
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  
  try {
    const response = JSON.parse(output);
    if (response.result && response.result.tools) {
      console.log('\n✅ SERVIDOR MCP N8N - HERRAMIENTAS DISPONIBLES\n');
      console.log(`Total de herramientas: ${response.result.tools.length}\n`);
      
      // Agrupar por categoría
      const groups = {
        'A: Instancia': [],
        'B: Workflows': [],
        'C: Ejecuciones': [],
        'D: Tags': [],
        'E: Credenciales': [],
        'F: Node Types': [],
        'G: Variables': [],
        'H: Activación': [],
        'I: Sistema': []
      };
      
      response.result.tools.forEach(tool => {
        if (tool.name.includes('instance')) groups['A: Instancia'].push(tool.name);
        else if (tool.name.includes('workflow')) groups['B: Workflows'].push(tool.name);
        else if (tool.name.includes('execution')) groups['C: Ejecuciones'].push(tool.name);
        else if (tool.name.includes('tag')) groups['D: Tags'].push(tool.name);
        else if (tool.name.includes('credential')) groups['E: Credenciales'].push(tool.name);
        else if (tool.name.includes('node')) groups['F: Node Types'].push(tool.name);
        else if (tool.name.includes('variable')) groups['G: Variables'].push(tool.name);
        else if (tool.name.includes('activate') || tool.name.includes('deactivate')) groups['H: Activación'].push(tool.name);
        else if (tool.name.includes('self_test')) groups['I: Sistema'].push(tool.name);
      });
      
      Object.entries(groups).forEach(([group, tools]) => {
        if (tools.length > 0) {
          console.log(`${group} (${tools.length}):`);
          tools.forEach(tool => console.log(`  - ${tool}`));
          console.log('');
        }
      });
      
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Esperando más datos
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

setTimeout(() => {
  console.error('Timeout - El servidor no respondió');
  server.kill();
  process.exit(1);
}, 5000);
