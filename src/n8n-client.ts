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
      "Accept": "application/json",
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
        `n8n API error ${response.status} ${response.statusText}: ${text}`,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }

  // Información general de la instancia
  async getInstanceInfo() {
    return this.request("/rest/health");
  }

  async getInstanceVersion() {
    return this.request("/rest/settings");
  }

  // Workflows
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
    return this.request(`/rest/workflows/run/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Ejecutions
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

  // Tags
  async listTags() {
    return this.request("/rest/tags");
  }

  // Credenciales
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

  // Node types
  async listNodeTypes() {
    return this.request("/rest/node-types");
  }

  async getNodeType(name: string) {
    const types = await this.request("/rest/node-types");
    return types.find((t: any) => t.name === name);
  }

  // Variables
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

  async updateVariable(id: string, data: { key?: string; value?: string; type?: string }) {
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

  // Workflow activation
  async activateWorkflow(id: string) {
    return this.updateWorkflow(id, { active: true });
  }

  async deactivateWorkflow(id: string) {
    return this.updateWorkflow(id, { active: false });
  }

  // Self-test
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

