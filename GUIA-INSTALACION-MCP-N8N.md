# 🚀 Guía Completa: Instalación y Configuración de MCP Server para n8n

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Crear el Proyecto](#paso-1-crear-el-proyecto)
4. [Paso 2: Configurar el Entorno](#paso-2-configurar-el-entorno)
5. [Paso 3: Implementar el Cliente n8n](#paso-3-implementar-el-cliente-n8n)
6. [Paso 4: Implementar el Servidor MCP](#paso-4-implementar-el-servidor-mcp)
7. [Paso 5: Compilar y Probar](#paso-5-compilar-y-probar)
8. [Paso 6: Configurar MCP en Antigravity](#paso-6-configurar-mcp-en-antigravity)
9. [Paso 7: Verificar Funcionamiento](#paso-7-verificar-funcionamiento)
10. [Herramientas Disponibles](#herramientas-disponibles)
11. [Troubleshooting](#troubleshooting)

---

## Introducción

Esta guía documenta el proceso completo de creación de un **servidor MCP (Model Context Protocol) personalizado** para n8n, que permite a asistentes de IA (como Antigravity) interactuar directamente con tu instancia de n8n.

### ¿Qué es MCP?

MCP (Model Context Protocol) es un protocolo estándar que permite a los sistemas de IA conectarse con herramientas y fuentes de datos externas. En este caso, conectamos un asistente de IA con n8n.

### ¿Por qué Custom vs Oficial?

- ✅ **Control total** sobre el código y funcionalidades
- ✅ **Aprendizaje** profundo de cómo funciona MCP
- ✅ **Personalización** según necesidades específicas
- ✅ **Independencia** de actualizaciones de terceros
- ✅ **Compatibilidad** garantizada con tu instancia de n8n

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

### Software Necesario

- ✅ **Node.js** (v18 o superior)
- ✅ **npm** (incluido con Node.js)
- ✅ **TypeScript** (se instalará como dependencia)
- ✅ **VS Code** o tu editor preferido
- ✅ **Git** (opcional, pero recomendado)

### Información de n8n

- ✅ **URL de tu instancia n8n** (ej: `https://tu-instancia.n8n.cloud`)
- ✅ **API Key de n8n** (generar desde Settings → API)

### Conocimientos Básicos

- 📚 JavaScript/TypeScript básico
- 📚 Línea de comandos
- 📚 Conceptos básicos de APIs REST

---

## Paso 1: Crear el Proyecto

### 1.1 Crear la Carpeta del Proyecto

```bash
# Navegar a tu carpeta de documentos (reemplaza [YOUR_USERNAME] con tu usuario)
cd D:\Users\[YOUR_USERNAME]\Documents

# Crear la carpeta del proyecto
mkdir MCPN8N
cd MCPN8N
```

### 1.2 Inicializar el Proyecto Node.js

```bash
# Inicializar package.json
npm init -y
```

### 1.3 Instalar Dependencias

```bash
# Instalar dependencias principales
npm install @modelcontextprotocol/sdk dotenv

# Instalar dependencias de desarrollo
npm install -D typescript @types/node
```

### 1.4 Configurar TypeScript

Crear archivo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.5 Configurar package.json

Actualizar `package.json` con scripts y configuración:

```json
{
  "name": "n8n-mcp-server",
  "version": "1.1.0",
  "description": "Servidor MCP personalizado para n8n",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "n8n-mcp-server": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js",
    "test": "node test-create-workflow.js"
  },
  "keywords": ["n8n", "mcp", "automation"],
  "author": "Tu Nombre",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "typescript": "^5.7.2"
  }
}
```

### 1.6 Crear Estructura de Carpetas

```bash
# Crear carpeta src
mkdir src
```

Tu estructura debería verse así:

```
MCPN8N/
├── src/
├── node_modules/
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## Paso 2: Configurar el Entorno

### 2.1 Crear Archivo .env

Crear archivo `.env` en la raíz del proyecto:

```env
# URL de tu instancia n8n (sin barra final)
N8N_API_URL=https://tu-instancia.n8n.cloud

# API Key de n8n (generar desde Settings → API)
N8N_API_KEY=tu_api_key_aqui
```

⚠️ **IMPORTANTE**: Nunca compartas tu API Key públicamente.

### 2.2 Crear .gitignore

Crear archivo `.gitignore`:

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### 2.3 Obtener API Key de n8n

1. Abre tu instancia de n8n
2. Ve a **Settings** → **API**
3. Haz clic en **Create API Key**
4. Copia la clave y pégala en tu archivo `.env`

---

## Paso 3: Implementar el Cliente n8n

### 3.1 Crear n8n-client.ts

Crear archivo `src/n8n-client.ts`:

```typescript
// src/n8n-client.ts
// Cliente ligero para el REST API de n8n

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-N8N-API-KEY": this.apiKey,
      ...(options.headers as Record<string, string> | undefined),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `n8n API error ${response.status} ${response.statusText}: ${text}`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }

  // ========== INFORMACIÓN DE INSTANCIA ==========

  async getInstanceInfo() {
    return this.request("/rest/health");
  }

  async getInstanceVersion() {
    return this.request("/rest/settings");
  }

  // ========== WORKFLOWS ==========

  async listWorkflows() {
    return this.request("/rest/workflows");
  }

  async getWorkflow(id: string) {
    return this.request(`/rest/workflows/${encodeURIComponent(id)}`);
  }

  async createWorkflow(data: any) {
    return this.request("/rest/workflows", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkflow(id: string, data: any) {
    return this.request(`/rest/workflows/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/rest/workflows/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async executeWorkflow(id: string, data: any = {}) {
    return this.request(`/rest/workflows/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async activateWorkflow(id: string) {
    return this.updateWorkflow(id, { active: true });
  }

  async deactivateWorkflow(id: string) {
    return this.updateWorkflow(id, { active: false });
  }

  // ========== EJECUCIONES ==========

  async getExecutions(params: { limit?: number; lastId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.lastId != null) query.set("lastId", params.lastId);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request(`/rest/executions${suffix}`);
  }

  async getExecution(id: string) {
    return this.request(`/rest/executions/${encodeURIComponent(id)}`);
  }

  async stopExecution(id: string) {
    return this.request(`/rest/executions/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ stop: true }),
    });
  }

  // ========== TAGS ==========

  async listTags() {
    return this.request("/rest/tags");
  }

  // ========== CREDENCIALES ==========

  async listCredentials() {
    return this.request("/rest/credentials");
  }

  async getCredential(id: string) {
    return this.request(`/rest/credentials/${encodeURIComponent(id)}`);
  }

  async createCredential(data: any) {
    return this.request("/rest/credentials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCredential(id: string, data: any) {
    return this.request(`/rest/credentials/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCredential(id: string) {
    return this.request(`/rest/credentials/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // ========== NODE TYPES ==========

  async listNodeTypes() {
    return this.request("/rest/node-types");
  }

  async getNodeType(name: string) {
    const types = await this.request("/rest/node-types");
    return types.find((t: any) => t.name === name);
  }

  // ========== VARIABLES ==========

  async listVariables() {
    return this.request("/rest/variables");
  }

  async getVariable(id: string) {
    return this.request(`/rest/variables/${encodeURIComponent(id)}`);
  }

  async createVariable(data: { key: string; value: string; type?: string }) {
    return this.request("/rest/variables", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVariable(
    id: string,
    data: { key?: string; value?: string; type?: string }
  ) {
    return this.request(`/rest/variables/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVariable(id: string) {
    return this.request(`/rest/variables/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // ========== SELF-TEST ==========

  async selfTest() {
    try {
      const health = await this.getInstanceInfo();
      const workflows = await this.listWorkflows();
      return {
        status: "ok",
        message: "Connection successful",
        details: {
          health,
          workflowCount: Array.isArray(workflows) ? workflows.length : 0,
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message || "Connection failed",
        details: { error: String(error) },
      };
    }
  }
}
```

---

## Paso 4: Implementar el Servidor MCP

### 4.1 Crear index.ts

Crear archivo `src/index.ts`:

```typescript
#!/usr/bin/env node
import dotenv from "dotenv";
import { N8nClient } from "./n8n-client.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

// Cargar variables de entorno
const N8N_API_URL = process.env.N8N_API_URL || "";
const N8N_API_KEY = process.env.N8N_API_KEY || "";

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error(
    "[n8n-mcp] ERROR: Debes definir N8N_API_URL y N8N_API_KEY en el entorno o en .env"
  );
  process.exit(1);
}

// Cliente ligero para el REST API
const n8n = new N8nClient(N8N_API_URL, N8N_API_KEY);

// Crear servidor MCP
const server = new Server(
  {
    name: "n8n-mcp-custom",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definición de herramientas MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // GRUPO A: Información instancia
      {
        name: "n8n_get_instance_info",
        description: "Obtener información de salud de la instancia n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_instance_version",
        description: "Obtener versión y ajustes de la instancia n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // GRUPO B: Workflows
      {
        name: "n8n_list_workflows",
        description: "Listar todos los workflows de n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_workflow",
        description: "Obtener un workflow concreto por id.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow.",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "n8n_create_workflow",
        description: "Crear un workflow nuevo en n8n.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Nombre del workflow.",
            },
            nodes: {
              type: "array",
              description: "Array de nodos del workflow.",
            },
            connections: {
              type: "object",
              description: "Conexiones entre nodos.",
            },
            active: {
              type: "boolean",
              description:
                "Si el workflow empieza activo o no (por defecto false).",
            },
            settings: {
              type: "object",
              description: "Configuración opcional del workflow.",
            },
          },
          required: ["name", "nodes"],
        },
      },
      {
        name: "n8n_update_workflow",
        description: "Actualizar un workflow existente.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow.",
            },
            name: {
              type: "string",
              description: "Nuevo nombre del workflow (opcional).",
            },
            nodes: {
              type: "array",
              description: "Nodos actualizados (opcional).",
            },
            connections: {
              type: "object",
              description: "Conexiones actualizadas (opcional).",
            },
            active: {
              type: "boolean",
              description: "Activar / desactivar workflow (opcional).",
            },
            settings: {
              type: "object",
              description: "Ajustes adicionales (opcional).",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "n8n_delete_workflow",
        description: "Eliminar un workflow.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow.",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "n8n_execute_workflow",
        description: "Ejecutar un workflow con datos de entrada opcionales.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow a ejecutar.",
            },
            payload: {
              type: "object",
              description: "Datos de entrada para la ejecución.",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "n8n_activate_workflow",
        description: "Activar un workflow específico.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow a activar.",
            },
          },
          required: ["workflow_id"],
        },
      },
      {
        name: "n8n_deactivate_workflow",
        description: "Desactivar un workflow específico.",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow a desactivar.",
            },
          },
          required: ["workflow_id"],
        },
      },

      // GRUPO C: Ejecuciones
      {
        name: "n8n_get_executions",
        description: "Listar ejecuciones recientes.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description:
                "Máximo número de ejecuciones a devolver (por defecto 20).",
            },
            workflow_id: {
              type: "string",
              description: "Opcional: filtrar por ID de workflow.",
            },
            status: {
              type: "string",
              description:
                "Opcional: filtrar por estado (success, error, waiting, etc).",
            },
          },
        },
      },
      {
        name: "n8n_get_execution",
        description: "Obtener detalles de una ejecución concreta.",
        inputSchema: {
          type: "object",
          properties: {
            execution_id: {
              type: "string",
              description: "ID de la ejecución.",
            },
          },
          required: ["execution_id"],
        },
      },
      {
        name: "n8n_stop_execution",
        description: "Intentar parar una ejecución en curso.",
        inputSchema: {
          type: "object",
          properties: {
            execution_id: {
              type: "string",
              description: "ID de la ejecución a detener.",
            },
          },
          required: ["execution_id"],
        },
      },

      // GRUPO D: Tags
      {
        name: "n8n_list_tags",
        description: "Listar todos los tags configurados en n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // GRUPO E: Credenciales
      {
        name: "n8n_list_credentials",
        description:
          "Listar todas las credenciales (solo metadatos, no secretos).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_credential",
        description: "Obtener una credencial concreta por id.",
        inputSchema: {
          type: "object",
          properties: {
            credential_id: {
              type: "string",
              description: "ID de la credencial.",
            },
          },
          required: ["credential_id"],
        },
      },
      {
        name: "n8n_create_credential",
        description: "Crear una credencial nueva.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Nombre de la credencial.",
            },
            type: {
              type: "string",
              description:
                "Tipo de la credencial (ej: httpBasicAuth, apiKey, etc).",
            },
            data: {
              type: "object",
              description: "Objeto con los datos de la credencial.",
            },
          },
          required: ["name", "type", "data"],
        },
      },
      {
        name: "n8n_update_credential",
        description: "Actualizar una credencial existente.",
        inputSchema: {
          type: "object",
          properties: {
            credential_id: {
              type: "string",
              description: "ID de la credencial.",
            },
            name: {
              type: "string",
              description: "Nuevo nombre (opcional).",
            },
            data: {
              type: "object",
              description: "Datos actualizados (opcional).",
            },
          },
          required: ["credential_id"],
        },
      },
      {
        name: "n8n_delete_credential",
        description: "Eliminar una credencial.",
        inputSchema: {
          type: "object",
          properties: {
            credential_id: {
              type: "string",
              description: "ID de la credencial.",
            },
          },
          required: ["credential_id"],
        },
      },

      // GRUPO F: Node Types
      {
        name: "n8n_list_node_types",
        description:
          "Listar todos los tipos de nodo disponibles en la instancia.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_node_type",
        description: "Obtener información sobre un tipo de nodo concreto.",
        inputSchema: {
          type: "object",
          properties: {
            node_type: {
              type: "string",
              description:
                "Nombre interno del nodo (ej: n8n-nodes-base.httpRequest).",
            },
          },
          required: ["node_type"],
        },
      },

      // GRUPO G: Variables
      {
        name: "n8n_list_variables",
        description:
          "Listar todas las variables de entorno configuradas en n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_variable",
        description: "Obtener una variable específica por su ID.",
        inputSchema: {
          type: "object",
          properties: {
            variable_id: {
              type: "string",
              description: "ID de la variable.",
            },
          },
          required: ["variable_id"],
        },
      },
      {
        name: "n8n_create_variable",
        description: "Crear una nueva variable de entorno.",
        inputSchema: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Nombre/clave de la variable.",
            },
            value: {
              type: "string",
              description: "Valor de la variable.",
            },
            type: {
              type: "string",
              description: "Tipo de variable (opcional).",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "n8n_update_variable",
        description: "Actualizar una variable existente.",
        inputSchema: {
          type: "object",
          properties: {
            variable_id: {
              type: "string",
              description: "ID de la variable.",
            },
            key: {
              type: "string",
              description: "Nueva clave (opcional).",
            },
            value: {
              type: "string",
              description: "Nuevo valor (opcional).",
            },
            type: {
              type: "string",
              description: "Nuevo tipo (opcional).",
            },
          },
          required: ["variable_id"],
        },
      },
      {
        name: "n8n_delete_variable",
        description: "Eliminar una variable.",
        inputSchema: {
          type: "object",
          properties: {
            variable_id: {
              type: "string",
              description: "ID de la variable.",
            },
          },
          required: ["variable_id"],
        },
      },

      // GRUPO H: Sistema
      {
        name: "n8n_self_test",
        description:
          "Probar la conectividad y permisos del servidor MCP con n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Implementación de cada herramienta
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ========= A: Instancia =========
      case "n8n_get_instance_info": {
        const info = await n8n.getInstanceInfo();
        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      }

      case "n8n_get_instance_version": {
        const version = await n8n.getInstanceVersion();
        return {
          content: [{ type: "text", text: JSON.stringify(version, null, 2) }],
        };
      }

      // ========= B: Workflows =========
      case "n8n_list_workflows": {
        const workflows = await n8n.listWorkflows();
        return {
          content: [{ type: "text", text: JSON.stringify(workflows, null, 2) }],
        };
      }

      case "n8n_get_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        const wf = await n8n.getWorkflow(workflow_id);
        return {
          content: [{ type: "text", text: JSON.stringify(wf, null, 2) }],
        };
      }

      case "n8n_create_workflow": {
        const typed = args as {
          name: string;
          nodes: any[];
          connections?: any;
          active?: boolean;
          settings?: any;
        };

        const newWf = await n8n.createWorkflow({
          name: typed.name,
          nodes: typed.nodes,
          connections: typed.connections ?? {},
          active: typed.active ?? false,
          settings: typed.settings ?? {},
        });

        return {
          content: [{ type: "text", text: JSON.stringify(newWf, null, 2) }],
        };
      }

      case "n8n_update_workflow": {
        const typed = args as {
          workflow_id: string;
          name?: string;
          nodes?: any[];
          connections?: any;
          active?: boolean;
          settings?: any;
        };

        const update: any = {};
        if (typed.name !== undefined) update.name = typed.name;
        if (typed.nodes !== undefined) update.nodes = typed.nodes;
        if (typed.connections !== undefined)
          update.connections = typed.connections;
        if (typed.active !== undefined) update.active = typed.active;
        if (typed.settings !== undefined) update.settings = typed.settings;

        const updated = await n8n.updateWorkflow(typed.workflow_id, update);

        return {
          content: [{ type: "text", text: JSON.stringify(updated, null, 2) }],
        };
      }

      case "n8n_delete_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        await n8n.deleteWorkflow(workflow_id);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflow_id} eliminado correctamente.`,
            },
          ],
        };
      }

      case "n8n_execute_workflow": {
        const typed = args as { workflow_id: string; payload?: any };
        const exec = await n8n.executeWorkflow(
          typed.workflow_id,
          typed.payload ?? {}
        );
        return {
          content: [{ type: "text", text: JSON.stringify(exec, null, 2) }],
        };
      }

      case "n8n_activate_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        const result = await n8n.activateWorkflow(workflow_id);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflow_id} activado correctamente.\n${JSON.stringify(
                result,
                null,
                2
              )}`,
            },
          ],
        };
      }

      case "n8n_deactivate_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        const result = await n8n.deactivateWorkflow(workflow_id);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflow_id} desactivado correctamente.\n${JSON.stringify(
                result,
                null,
                2
              )}`,
            },
          ],
        };
      }

      // ========= C: Ejecuciones =========
      case "n8n_get_executions": {
        const typed = args as { limit?: number };
        const execs = await n8n.getExecutions({
          limit: typed.limit ?? 20,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(execs, null, 2) }],
        };
      }

      case "n8n_get_execution": {
        const { execution_id } = args as { execution_id: string };
        const exec = await n8n.getExecution(execution_id);
        return {
          content: [{ type: "text", text: JSON.stringify(exec, null, 2) }],
        };
      }

      case "n8n_stop_execution": {
        const { execution_id } = args as { execution_id: string };
        const result = await n8n.stopExecution(execution_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========= D: Tags =========
      case "n8n_list_tags": {
        const tags = await n8n.listTags();
        return {
          content: [{ type: "text", text: JSON.stringify(tags, null, 2) }],
        };
      }

      // ========= E: Credenciales =========
      case "n8n_list_credentials": {
        const creds = await n8n.listCredentials();
        return {
          content: [{ type: "text", text: JSON.stringify(creds, null, 2) }],
        };
      }

      case "n8n_get_credential": {
        const { credential_id } = args as { credential_id: string };
        const cred = await n8n.getCredential(credential_id);
        return {
          content: [{ type: "text", text: JSON.stringify(cred, null, 2) }],
        };
      }

      case "n8n_create_credential": {
        const typed = args as { name: string; type: string; data: any };
        const cred = await n8n.createCredential({
          name: typed.name,
          type: typed.type,
          data: typed.data,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(cred, null, 2) }],
        };
      }

      case "n8n_update_credential": {
        const typed = args as {
          credential_id: string;
          name?: string;
          data?: any;
        };

        const update: any = {};
        if (typed.name !== undefined) update.name = typed.name;
        if (typed.data !== undefined) update.data = typed.data;

        const cred = await n8n.updateCredential(typed.credential_id, update);
        return {
          content: [{ type: "text", text: JSON.stringify(cred, null, 2) }],
        };
      }

      case "n8n_delete_credential": {
        const { credential_id } = args as { credential_id: string };
        await n8n.deleteCredential(credential_id);
        return {
          content: [
            {
              type: "text",
              text: `Credencial ${credential_id} eliminada correctamente.`,
            },
          ],
        };
      }

      // ========= F: Node types =========
      case "n8n_list_node_types": {
        const types = await n8n.listNodeTypes();
        return {
          content: [{ type: "text", text: JSON.stringify(types, null, 2) }],
        };
      }

      case "n8n_get_node_type": {
        const { node_type } = args as { node_type: string };
        const node = await n8n.getNodeType(node_type);
        return {
          content: [{ type: "text", text: JSON.stringify(node, null, 2) }],
        };
      }

      // ========= G: Variables =========
      case "n8n_list_variables": {
        const variables = await n8n.listVariables();
        return {
          content: [{ type: "text", text: JSON.stringify(variables, null, 2) }],
        };
      }

      case "n8n_get_variable": {
        const { variable_id } = args as { variable_id: string };
        const variable = await n8n.getVariable(variable_id);
        return {
          content: [{ type: "text", text: JSON.stringify(variable, null, 2) }],
        };
      }

      case "n8n_create_variable": {
        const typed = args as { key: string; value: string; type?: string };
        const variable = await n8n.createVariable({
          key: typed.key,
          value: typed.value,
          type: typed.type,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(variable, null, 2) }],
        };
      }

      case "n8n_update_variable": {
        const typed = args as {
          variable_id: string;
          key?: string;
          value?: string;
          type?: string;
        };

        const update: any = {};
        if (typed.key !== undefined) update.key = typed.key;
        if (typed.value !== undefined) update.value = typed.value;
        if (typed.type !== undefined) update.type = typed.type;

        const variable = await n8n.updateVariable(typed.variable_id, update);
        return {
          content: [{ type: "text", text: JSON.stringify(variable, null, 2) }],
        };
      }

      case "n8n_delete_variable": {
        const { variable_id } = args as { variable_id: string };
        await n8n.deleteVariable(variable_id);
        return {
          content: [
            {
              type: "text",
              text: `Variable ${variable_id} eliminada correctamente.`,
            },
          ],
        };
      }

      // ========= H: System =========
      case "n8n_self_test": {
        const result = await n8n.selfTest();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // ========= Desconocida =========
      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (err: any) {
    const msg =
      err && typeof err.message === "string"
        ? err.message
        : JSON.stringify(err, null, 2);

    return {
      content: [
        {
          type: "text",
          text: `[n8n-mcp] Error ejecutando ${name}: ${msg}`,
        },
      ],
      isError: true,
    };
  }
});

// Arranque del servidor MCP por stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[n8n-mcp-custom] MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

---

## Paso 5: Compilar y Probar

### 5.1 Compilar el Proyecto

```bash
npm run build
```

Deberías ver una carpeta `dist/` con los archivos compilados.

### 5.2 Probar Localmente

Crear archivo `test-create-workflow.js` en la raíz:

```javascript
// test-create-workflow.js
import { spawn } from "child_process";

const server = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

// Test: Listar workflows
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "n8n_list_workflows",
    arguments: {},
  },
};

server.stdin.write(JSON.stringify(request) + "\n");

let output = "";
server.stdout.on("data", (data) => {
  output += data.toString();
  try {
    const response = JSON.parse(output);
    console.log("✅ Respuesta del servidor:");
    console.log(JSON.stringify(response, null, 2));
    server.kill();
    process.exit(0);
  } catch (e) {
    // Esperando más datos
  }
});

server.stderr.on("data", (data) => {
  console.error("Server log:", data.toString());
});

setTimeout(() => {
  console.error("❌ Timeout");
  server.kill();
  process.exit(1);
}, 5000);
```

Ejecutar:

```bash
node test-create-workflow.js
```

---

## Paso 6: Configurar MCP en Antigravity

### 6.1 Ubicar el Archivo de Configuración

El archivo de configuración MCP se encuentra en:

```
C:\Users\[TuUsuario]\.gemini\antigravity\mcp_config.json
```

### 6.2 Editar mcp_config.json

Abrir el archivo y agregar tu servidor:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "node",
      "args": ["D:\\Users\\Burnham\\Documents\\MCPN8N\\dist\\index.js"],
      "env": {
        "N8N_API_URL": "https://tu-instancia.n8n.cloud",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

⚠️ **Notas importantes:**

- Usa rutas absolutas
- En Windows, usa `\\` o `/` en las rutas
- Reemplaza los valores de `N8N_API_URL` y `N8N_API_KEY`

### 6.3 Reiniciar Antigravity

1. Cierra completamente VS Code
2. Vuelve a abrir VS Code
3. Abre Antigravity

---

## Paso 7: Verificar Funcionamiento

### 7.1 Verificar que MCP está Conectado

En Antigravity, pregunta:

```
¿Puedes listar mis workflows de n8n?
```

Si funciona, verás la lista de tus workflows.

### 7.2 Probar Herramientas

Prueba diferentes comandos:

```
# Listar workflows
Lista mis workflows de n8n

# Ver información de instancia
Muéstrame la información de mi instancia n8n

# Crear un workflow simple
Crea un workflow de prueba en n8n

# Listar variables
Muéstrame las variables de n8n
```

---

## Herramientas Disponibles

Tu servidor MCP tiene **28 herramientas** organizadas en 9 grupos:

### Grupo A: Instancia (2)

- `n8n_get_instance_info` - Información de salud
- `n8n_get_instance_version` - Versión y configuración

### Grupo B: Workflows (8)

- `n8n_list_workflows` - Listar todos
- `n8n_get_workflow` - Obtener uno específico
- `n8n_create_workflow` - Crear nuevo
- `n8n_update_workflow` - Actualizar existente
- `n8n_delete_workflow` - Eliminar
- `n8n_execute_workflow` - Ejecutar
- `n8n_activate_workflow` - Activar
- `n8n_deactivate_workflow` - Desactivar

### Grupo C: Ejecuciones (3)

- `n8n_get_executions` - Listar ejecuciones
- `n8n_get_execution` - Ver una ejecución
- `n8n_stop_execution` - Detener ejecución

### Grupo D: Tags (1)

- `n8n_list_tags` - Listar tags

### Grupo E: Credenciales (6)

- `n8n_list_credentials` - Listar todas
- `n8n_get_credential` - Ver una
- `n8n_create_credential` - Crear nueva
- `n8n_update_credential` - Actualizar
- `n8n_delete_credential` - Eliminar

### Grupo F: Node Types (2)

- `n8n_list_node_types` - Listar tipos de nodos
- `n8n_get_node_type` - Ver un tipo específico

### Grupo G: Variables (5)

- `n8n_list_variables` - Listar variables
- `n8n_get_variable` - Ver una variable
- `n8n_create_variable` - Crear nueva
- `n8n_update_variable` - Actualizar
- `n8n_delete_variable` - Eliminar

### Grupo H: Sistema (1)

- `n8n_self_test` - Probar conectividad

---

## Troubleshooting

### Error: "EOF" al iniciar

**Problema**: El servidor MCP no puede conectarse.

**Solución**:

1. Verifica que las rutas en `mcp_config.json` sean absolutas
2. Verifica que `N8N_API_URL` y `N8N_API_KEY` sean correctos
3. Compila el proyecto: `npm run build`

### Error: "n8n API error 401"

**Problema**: API Key inválida.

**Solución**:

1. Verifica tu API Key en n8n (Settings → API)
2. Genera una nueva API Key si es necesario
3. Actualiza `.env` y `mcp_config.json`

### Error: "Cannot find module"

**Problema**: Dependencias no instaladas.

**Solución**:

```bash
npm install
npm run build
```

### El servidor no responde

**Problema**: El servidor no está ejecutándose correctamente.

**Solución**:

1. Verifica los logs en la consola de Antigravity
2. Prueba ejecutar manualmente: `node dist/index.js`
3. Verifica que el archivo `.env` exista y tenga los valores correctos

### Workflows no aparecen

**Problema**: Permisos de API o URL incorrecta.

**Solución**:

1. Verifica que la URL no tenga barra final: ❌ `https://n8n.com/` ✅ `https://n8n.com`
2. Verifica que tu API Key tenga permisos de lectura
3. Prueba la conexión con: `n8n_self_test`

---

## Próximos Pasos

### Mejoras Sugeridas

1. **Agregar más herramientas** según tus necesidades
2. **Implementar caché** para mejorar rendimiento
3. **Agregar logging** más detallado
4. **Crear tests automatizados**
5. **Publicar como paquete npm** (opcional)

### Recursos Adicionales

- [Documentación de n8n API](https://docs.n8n.io/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## Conclusión

¡Felicidades! 🎉 Ahora tienes un servidor MCP personalizado completamente funcional que permite a Antigravity (o cualquier cliente MCP) interactuar con tu instancia de n8n.

**Ventajas de esta implementación:**

- ✅ **28 herramientas** completas
- ✅ **Control total** del código
- ✅ **Personalizable** según tus necesidades
- ✅ **Bien documentado** y mantenible
- ✅ **TypeScript** para mejor desarrollo

**Recuerda:**

- Mantén tu API Key segura
- Haz backups regulares
- Documenta cualquier cambio que hagas
- Comparte tus mejoras con la comunidad

---

**Autor**: Burnham  
**Fecha**: Noviembre 2024  
**Versión**: 1.0.0  
**Licencia**: MIT
