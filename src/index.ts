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

/**
 * 1. Cargar variables de entorno
 *    N8N_API_URL  → URL base de tu instancia (ej: https://tu-instancia.n8n.cloud)
 *    N8N_API_KEY  → API Key personal de n8n
 */
const N8N_API_URL = process.env.N8N_API_URL || "";
const N8N_API_KEY = process.env.N8N_API_KEY || "";

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error(
    "[n8n-mcp] ERROR: Debes definir N8N_API_URL y N8N_API_KEY en el entorno o en .env",
  );
  process.exit(1);
}

// Cliente ligero para el REST API
const n8n = new N8nClient(N8N_API_URL, N8N_API_KEY);

/**
 * 2. Crear servidor MCP
 *    name     → cómo se identifica ante el cliente MCP
 *    version  → versión del servidor
 */
const server = new Server(
  {
    name: "n8n-mcp-custom",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * 3. Definición de herramientas MCP
 *    Aquí solo declaramos “qué existe” y qué input espera cada herramienta.
 *    La lógica real se implementa después en CallToolRequestSchema.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ========================
      // GRUPO A: Información instancia
      // ========================
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

      // ========================
      // GRUPO B: Workflows
      // ========================
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
              description: "Si el workflow empieza activo o no (por defecto false).",
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
        description:
          "Ejecutar un workflow con datos de entrada opcionales (body directo).",
        inputSchema: {
          type: "object",
          properties: {
            workflow_id: {
              type: "string",
              description: "ID del workflow a ejecutar.",
            },
            payload: {
              type: "object",
              description:
                "Datos de entrada para la ejecución (lo que luego lees en el workflow).",
            },
          },
          required: ["workflow_id"],
        },
      },

      // ========================
      // GRUPO C: Ejecuciones
      // ========================
      {
        name: "n8n_get_executions",
        description:
          "Listar ejecuciones recientes. Se puede limitar el número de resultados.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Máximo número de ejecuciones a devolver (por defecto 20).",
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
        description:
          "Intentar parar una ejecución en curso (si tu instancia lo permite).",
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

      // ========================
      // GRUPO D: Tags
      // ========================
      {
        name: "n8n_list_tags",
        description: "Listar todos los tags configurados en n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // ========================
      // GRUPO E: Credenciales
      // ========================
      {
        name: "n8n_list_credentials",
        description: "Listar todas las credenciales (solo metadatos, no secretos).",
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
              description: "Tipo de la credencial (ej: httpBasicAuth, apiKey, etc).",
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

      // ========================
      // GRUPO F: Tipos de nodo / documentación básica
      // ========================
      {
        name: "n8n_list_node_types",
        description: "Listar todos los tipos de nodo disponibles en la instancia.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "n8n_get_node_type",
        description:
          "Obtener información sobre un tipo de nodo concreto (nombre interno).",
        inputSchema: {
          type: "object",
          properties: {
            node_type: {
              type: "string",
              description: "Nombre interno del nodo (ej: n8n-nodes-base.httpRequest).",
            },
          },
          required: ["node_type"],
        },
      },

      // ========================
      // GRUPO G: Variables
      // ========================
      {
        name: "n8n_list_variables",
        description: "Listar todas las variables de entorno configuradas en n8n.",
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
              description: "Tipo de variable (opcional, ej: string, number).",
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

      // ========================
      // GRUPO H: Activación de Workflows
      // ========================
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

      // ========================
      // GRUPO I: Sistema
      // ========================
      {
        name: "n8n_self_test",
        description: "Probar la conectividad y permisos del servidor MCP con n8n.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * 4. Implementación de cada herramienta (CallTool)
 *    Aquí es donde realmente llamamos al REST API de n8n usando N8nClient.
 */
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
          content: [
            {
              type: "text",
              text: JSON.stringify(newWf, null, 2),
            },
          ],
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
        if (typed.connections !== undefined) update.connections = typed.connections;
        if (typed.active !== undefined) update.active = typed.active;
        if (typed.settings !== undefined) update.settings = typed.settings;

        const updated = await n8n.updateWorkflow(typed.workflow_id, update);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(updated, null, 2),
            },
          ],
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
          typed.payload ?? {},
        );
        return {
          content: [{ type: "text", text: JSON.stringify(exec, null, 2) }],
        };
      }

      // ========= C: Ejecuciones =========
      case "n8n_get_executions": {
        const typed = args as {
          limit?: number;
        };

        const execs = await n8n.getExecutions({
          limit: typed.limit ?? 20
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

      // ========= H: Workflow Activation =========
      case "n8n_activate_workflow": {
        const { workflow_id } = args as { workflow_id: string };
        const result = await n8n.activateWorkflow(workflow_id);
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflow_id} activado correctamente.\n${JSON.stringify(result, null, 2)}`,
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
              text: `Workflow ${workflow_id} desactivado correctamente.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      // ========= I: System =========
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

/**
 * 5. Arranque del servidor MCP por stdio
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[n8n-mcp-custom] MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
