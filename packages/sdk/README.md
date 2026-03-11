# @wiroai/sdk

Unofficial TypeScript SDK for [Wiro AI](https://wiro.ai). Run AI models, manage tasks, and auto-discover model parameters via OpenAPI specs.

> **Disclaimer:** This is an unofficial community project, not affiliated with Wiro AI.

## Installation

```bash
npm install @wiroai/sdk
```

## Usage

```typescript
import { WiroClient, getModelRegistry } from '@wiroai/sdk';

const client = new WiroClient({
  apiKey: process.env.WIRO_API_KEY!,
  apiSecret: process.env.WIRO_API_SECRET!,
});

// Run a model
const run = await client.runModel('google/nano-banana-pro', {
  prompt: 'A mountain landscape at sunset',
});

// Wait for result
const result = await client.waitForTask(run.socketaccesstoken);
console.log(result.outputs);

// Download model spec
const spec = await client.fetchModelSpec('openai/sora-2');
const registry = getModelRegistry();
registry.saveSpec('openai/sora-2', spec);

// Validate parameters
const errors = registry.validateParams('openai/sora-2', { prompt: 'test' });
```

## API

### WiroClient

| Method | Description |
|--------|-------------|
| `runModel(model, params)` | Run an AI model |
| `waitForTask(token, options?)` | Poll until task completes |
| `getTaskDetail(token)` | Get task status |
| `getTaskDetailById(id)` | Get task by ID |
| `killTask(id)` | Kill a running task |
| `cancelTask(id)` | Cancel a queued task |
| `fetchModelSpec(model)` | Download OpenAPI spec |
| `connectTaskWebSocket(token, callbacks)` | Real-time monitoring |

### ModelRegistry

| Method | Description |
|--------|-------------|
| `get(slug)` | Get model definition |
| `getAll()` | List all loaded models |
| `search(query)` | Search models |
| `validateParams(slug, params)` | Validate parameters |
| `saveSpec(slug, spec)` | Save and register spec |
| `reload()` | Reload specs from disk |

## License

MIT
