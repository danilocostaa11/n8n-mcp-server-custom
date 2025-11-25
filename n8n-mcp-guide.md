# N8n MCP Server Guide

## Overview

This guide explains how to use your n8n MCP (Model Context Protocol) server to interact with your n8n workflows programmatically.

## Configuration

Your n8n MCP server is configured with the following settings:

- **N8N Instance**: `https://your-instance.n8n.cloud` (or your self-hosted URL)
- **Server Package**: Custom n8n-mcp-server (optimized for Antigravity)
- **Authentication**: API Key-based

## Why This Custom Server?

### The Problem with the Official Server

When attempting to use the official `@modelcontextprotocol/server-n8n` package with Antigravity, we encountered persistent **EOF (End of File) errors** during the initialization phase. This error prevented Antigravity from establishing a connection with the n8n MCP server.

**Error encountered:**

```
Error calling 'initialize': EOF
```

### Root Cause

The official n8n MCP server has compatibility issues with certain MCP clients, particularly Antigravity. The error occurs during the handshake/initialization process, preventing the server from properly starting.

### Our Solution

This custom implementation was built from scratch to:

1. ✅ **Ensure Antigravity Compatibility** - Tested and verified to work with Antigravity
2. ✅ **Maintain Full Functionality** - All 27 essential tools working as expected
3. ✅ **Provide Better Error Handling** - Clear error messages and debugging info
4. ✅ **Offer Flexibility** - Easy to customize and extend

**Implementation Details:**

We replicated the functionality of the [official n8n MCP server](https://github.com/modelcontextprotocol/servers/tree/main/src/n8n) by implementing **27 tools** based on the n8n REST API, ensuring compatibility with Antigravity while maintaining feature parity with the official server.

### Comparison

| Feature             | Official Server                                                  | This Custom Server |
| ------------------- | ---------------------------------------------------------------- | ------------------ |
| Antigravity Support | ❌ EOF Error                                                     | ✅ Fully Working   |
| Tools Available     | ~42                                                              | 27 (essential)     |
| Customizable        | Limited                                                          | ✅ Full Control    |
| Error Messages      | Generic                                                          | ✅ Detailed        |
| Documentation       | Basic                                                            | ✅ Complete        |
| Source              | [Official Repo](https://github.com/modelcontextprotocol/servers) | This Repository    |

**Note:** If you're using Claude Desktop or other MCP clients, the official server might work fine. This custom server is specifically designed for users experiencing compatibility issues with Antigravity.

## What Can You Do?

The n8n-mcp server provides the following capabilities:

### 1. **List Workflows**

View all workflows available in your n8n instance, including their:

- Name
- ID
- Active/Inactive status
- Tags
- Last updated timestamp

### 2. **Get Workflow Details**

Retrieve detailed information about specific workflows:

- Full workflow configuration
- Node structure
- Connections between nodes
- Credentials used (without exposing sensitive data)

### 3. **Execute Workflows**

Trigger workflow executions programmatically:

- Manual executions
- Pass input data to workflows
- Receive execution results

### 4. **Monitor Executions**

Check the status and results of workflow executions:

- Execution history
- Success/failure status
- Output data
- Error messages

## Getting Started

### Step 1: Verify MCP Server Connection

The MCP server should automatically connect when you start this chat session. You can verify it's working by asking questions like:

- "List my n8n workflows"
- "Show me the details of workflow [workflow-name]"

### Step 2: Explore Your Workflows

Use natural language to interact with your n8n instance:

- "What workflows do I have?"
- "Show me the structure of [workflow-name]"
- "What does the [workflow-name] workflow do?"

### Step 3: Execute Workflows

You can trigger workflows directly:

- "Execute the [workflow-name] workflow"
- "Run [workflow-name] with this data: {...}"

## Example Use Cases

### 1. Workflow Documentation

Ask the AI to document your workflows:

```
"Analyze my [workflow-name] and create comprehensive documentation"
```

### 2. Workflow Debugging

Get help troubleshooting workflows:

```
"Why is my [workflow-name] failing? Show me the last execution results"
```

### 3. Workflow Optimization

Request improvements:

```
"Review my [workflow-name] and suggest optimizations"
```

### 4. Create New Workflows

Design new workflows with AI assistance:

```
"Help me create a workflow that sends a Slack notification when a new email arrives"
```

## Troubleshooting

### Connection Issues

If the MCP server isn't connecting:

1. **Check API Key**: Ensure your N8N_API_KEY is valid and hasn't expired
2. **Verify URL**: Confirm your n8n instance URL is accessible
3. **Check Logs**: Look for error messages in the MCP server logs

### Common Errors

**EOF Error**: This typically occurs when:

- The n8n instance is unreachable
- The API key is invalid
- There's a network connectivity issue

**Solution**:

- Verify your n8n instance is running
- Test the API key directly via curl:
  ```bash
  curl -H "X-N8N-API-KEY: your-api-key" https://your-instance.n8n.cloud/api/v1/workflows
  ```

## Next Steps

1. **Explore your workflows**: Start by asking to list all your workflows
2. **Document existing workflows**: Have the AI analyze and document your current workflows
3. **Create new workflows**: Use AI assistance to build new automation workflows
4. **Optimize**: Review and improve existing workflows with AI suggestions

---

**Ready to get started?** Try asking: _"What workflows do I have in my n8n instance?"_
