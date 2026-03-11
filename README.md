# Wiro AI (Unofficial)

Unofficial TypeScript toolkit for [Wiro AI](https://wiro.ai) — run AI models (image generation, video generation, LLMs, TTS, and more) from your code, CLI, or AI assistants via MCP.

> **Disclaimer:** This is an unofficial community project. It is not affiliated with, endorsed by, or maintained by Wiro AI.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@wiroai/sdk](./packages/sdk) | Core SDK — API client, model registry, OpenAPI spec parser | [![npm](https://img.shields.io/npm/v/@wiroai/sdk)](https://www.npmjs.com/package/@wiroai/sdk) |
| [@wiroai/cli](./packages/cli) | CLI tool — run models, fetch specs, check tasks from terminal | [![npm](https://img.shields.io/npm/v/@wiroai/cli)](https://www.npmjs.com/package/@wiroai/cli) |
| [@wiroai/mcp-server](./packages/mcp-server) | MCP server — use Wiro AI models from Claude, Cursor, Windsurf and other AI assistants | [![npm](https://img.shields.io/npm/v/@wiroai/mcp-server)](https://www.npmjs.com/package/@wiroai/mcp-server) |

## Quick Start

### CLI

```bash
npm install -g @wiroai/cli

export WIRO_API_KEY="your-key"
export WIRO_API_SECRET="your-secret"

# Run a model (slug or URL)
wiro run google/nano-banana-pro -p "A sunset over mountains"
wiro run https://wiro.ai/models/openai/sora-2 -p "A cat walking" --no-wait

# List available models
wiro models

# Download model spec for parameter validation
wiro fetch-spec alibaba/wan-2-6
wiro fetch-spec https://wiro.ai/models/alibaba/wan-2-6

# Show model parameters
wiro info alibaba/wan-2-6
```

### MCP Server (Claude Desktop / Cursor / Windsurf)

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "wiro": {
      "command": "npx",
      "args": ["-y", "@wiroai/mcp-server"],
      "env": {
        "WIRO_API_KEY": "your-key",
        "WIRO_API_SECRET": "your-secret"
      }
    }
  }
}
```

Available MCP tools:
- `wiro_run_model` — Run any AI model
- `wiro_list_models` — List available models
- `wiro_model_info` — Show model parameters
- `wiro_fetch_spec` — Download model OpenAPI spec
- `wiro_task_status` — Check task status
- `wiro_task_wait` — Wait for task completion
- `wiro_task_kill` — Kill a running task
- `wiro_task_cancel` — Cancel a queued task
- `wiro_list_categories` — List model categories

### SDK

```bash
npm install @wiroai/sdk
```

```typescript
import { WiroClient } from '@wiroai/sdk';

const client = new WiroClient({
  apiKey: process.env.WIRO_API_KEY!,
  apiSecret: process.env.WIRO_API_SECRET!,
});

// Run a model and wait for result
const result = await client.runModel('google/nano-banana-pro', {
  prompt: 'A sunset over mountains',
});

console.log(result.outputs); // [{ url, name, contenttype, size }]
```

## Authentication

Get your API keys at [wiro.ai](https://wiro.ai). Authentication uses HMAC-SHA256 signatures.

Set environment variables:
```bash
export WIRO_API_KEY="your-api-key"
export WIRO_API_SECRET="your-api-secret"
```

## Model Specs

The SDK includes an OpenAPI-based model registry. Download specs to enable parameter validation and discovery:

```bash
# Via CLI
wiro fetch-spec openai/sora-2

# Via MCP
# Use wiro_fetch_spec tool
```

Specs are saved to the `models/` directory and automatically loaded by the registry.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build SDK first, then dependents
npm run build -w packages/sdk
npm run build -w packages/cli -w packages/mcp-server
```

## License

MIT - Ersin KOC
