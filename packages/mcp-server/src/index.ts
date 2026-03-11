#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WiroClient } from 'wiro-sdk';

import { registerRunModel } from './tools/run-model.js';
import { registerListModels } from './tools/list-models.js';
import { registerTaskStatus } from './tools/task-status.js';
import { registerTaskWait } from './tools/task-wait.js';
import { registerListCategories } from './tools/list-categories.js';
import { registerModelInfo } from './tools/model-info.js';
import { registerTaskKill } from './tools/task-kill.js';
import { registerTaskCancel } from './tools/task-cancel.js';
import { registerFetchSpec } from './tools/fetch-spec.js';

const apiKey = process.env['WIRO_API_KEY'];
const apiSecret = process.env['WIRO_API_SECRET'];

if (!apiKey || !apiSecret) {
  console.error(
    'Error: WIRO_API_KEY and WIRO_API_SECRET environment variables are required.\n\n' +
    'Set them in your environment or MCP server config:\n' +
    '  export WIRO_API_KEY="your-api-key"\n' +
    '  export WIRO_API_SECRET="your-api-secret"\n\n' +
    'Get your API keys at https://wiro.ai'
  );
  process.exit(1);
}

const client = new WiroClient({ apiKey, apiSecret });

const server = new McpServer({
  name: 'wiro-mcp-server',
  version: '1.0.0',
});

registerRunModel(server, client);
registerListModels(server);
registerTaskStatus(server, client);
registerTaskWait(server, client);
registerListCategories(server);
registerModelInfo(server);
registerTaskKill(server, client);
registerTaskCancel(server, client);
registerFetchSpec(server, client);

const transport = process.env['TRANSPORT'] === 'http'
  ? await (async () => {
      const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
      const express = (await import('express')).default;
      const app = express();
      const port = parseInt(process.env['PORT'] ?? '3000', 10);

      let sseTransport: InstanceType<typeof SSEServerTransport> | undefined;

      app.get('/sse', (req, res) => {
        sseTransport = new SSEServerTransport('/messages', res);
        void server.connect(sseTransport);
      });

      app.post('/messages', (req, res) => {
        if (sseTransport) {
          void sseTransport.handlePostMessage(req, res);
        } else {
          res.status(400).json({ error: 'No SSE connection established' });
        }
      });

      app.listen(port, () => {
        console.error(`Wiro MCP server listening on http://localhost:${port}`);
        console.error('SSE endpoint: /sse');
        console.error('Messages endpoint: /messages');
      });

      return null;
    })()
  : new StdioServerTransport();

if (transport) {
  await server.connect(transport);
  console.error('Wiro MCP server running on stdio');
}
