# Wiro AI

Unofficial TypeScript toolkit for [Wiro AI](https://wiro.ai) — run 58+ AI models (image generation, video generation, LLMs, TTS, 3D, and more) from your code, CLI, or AI assistants via MCP.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-257%20passed-brightgreen)]()
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)]()

> **Disclaimer:** This is an unofficial community project. It is not affiliated with, endorsed by, or maintained by Wiro AI.

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@wiroai/sdk`](./packages/sdk) | Core SDK — API client, model registry, OpenAPI spec parser | [![npm](https://img.shields.io/npm/v/@wiroai/sdk)](https://www.npmjs.com/package/@wiroai/sdk) |
| [`@wiroai/cli`](./packages/cli) | CLI tool — run models, check tasks, inspect parameters | [![npm](https://img.shields.io/npm/v/@wiroai/cli)](https://www.npmjs.com/package/@wiroai/cli) |
| [`@wiroai/mcp-server`](./packages/mcp-server) | MCP server — use Wiro AI from Claude, Cursor, Windsurf | [![npm](https://img.shields.io/npm/v/@wiroai/mcp-server)](https://www.npmjs.com/package/@wiroai/mcp-server) |

---

## Supported Models

58 models with pre-bundled OpenAPI specs for instant parameter validation and discovery:

| Category | Models |
|----------|--------|
| **Text-to-Image** | FLUX.2 Pro, FLUX.2 Klein (4B/9B), FLUX.1 Krea, Seedream V5, Nano Banana 2/Pro, Qwen Image, GLM Image, LongCat, Reve, DreamOmni2, P-Image, Ovis 7B |
| **Text-to-Video** | Sora 2/Pro, Kling V3/V2.6/V2.5 Turbo, Seedance Pro V1.5, Wan 2.6, PixVerse V5, P-Video |
| **Image-to-Video** | LTX 2.3, Kling V3 Motion Control, Wan 2.2 Animate |
| **Image Editing** | FireRed Image Edit, LongCat Image Edit, Lucy Edit |
| **LLM / Chat** | Gemini 3 Pro/Flash, Qwen 3.5 27B, GLM 4.7 Flash |
| **Translation** | Translate Gemma (4B/12B/27B) with image support |
| **Speech** | Qwen3 TTS, Qwen3 ASR, VibeVoice Realtime |
| **3D / Panorama** | Trellis 2, HunyuanWorld Panorama |
| **Talking Head** | Live Avatar |
| **OCR** | Dots OCR 1.5 |

> Any model on [wiro.ai/models](https://wiro.ai/models) can be used — specs are auto-fetched on first use if not bundled.

---

## Quick Start

### 1. Get API Keys

Sign up at [wiro.ai](https://wiro.ai) and get your API key and secret.

```bash
export WIRO_API_KEY="your-api-key"
export WIRO_API_SECRET="your-api-secret"
```

### 2. Choose Your Interface

<details>
<summary><b>MCP Server</b> — for Claude Desktop, Cursor, Windsurf, and other AI assistants</summary>

Add to your MCP client config (`claude_desktop_config.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "wiro": {
      "command": "npx",
      "args": ["-y", "@wiroai/mcp-server"],
      "env": {
        "WIRO_API_KEY": "your-api-key",
        "WIRO_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

Then just ask your AI assistant:

> "Generate an image of a cat in space using nano-banana-pro"
>
> "Create a video with Sora 2 — a drone shot over a mountain lake at sunset"
>
> "What models are available for text-to-video?"

#### MCP Tools

| Tool | Description |
|------|-------------|
| `wiro_run_model` | Run any model with validated parameters |
| `wiro_list_models` | Browse models by category or search |
| `wiro_model_info` | Get parameters, types, defaults, and examples |
| `wiro_fetch_spec` | Download and cache a model's OpenAPI spec |
| `wiro_task_status` | Check task status by ID or token |
| `wiro_task_wait` | Wait for task completion with timeout |
| `wiro_task_kill` | Kill a running task |
| `wiro_task_cancel` | Cancel a queued task |
| `wiro_list_categories` | List all model categories |

</details>

<details>
<summary><b>CLI</b> — for terminal workflows</summary>

```bash
npm install -g @wiroai/cli
```

```bash
# Generate an image
wiro run google/nano-banana-pro --prompt "A sunset over mountains"

# Generate a video (don't wait, get task ID)
wiro run openai/sora-2 --prompt "A cat walking on the moon" --no-wait

# List models by category
wiro models --category text-to-image

# Inspect model parameters
wiro info black-forest-labs/flux-2-pro

# Download model spec for offline use
wiro fetch-spec klingai/kling-v3

# Check task status
wiro status <task-token>

# Real-time task monitoring via WebSocket
wiro watch <task-token>

# Kill or cancel tasks
wiro kill <task-id>
wiro cancel <task-id>

# Configure credentials
wiro config
```

You can also use full Wiro URLs instead of slugs:

```bash
wiro run https://wiro.ai/models/openai/sora-2 --prompt "..."
wiro info https://wiro.ai/models/google/nano-banana-pro
```

</details>

<details open>
<summary><b>SDK</b> — for programmatic use</summary>

```bash
npm install @wiroai/sdk
```

```typescript
import { WiroClient, getModelRegistry } from '@wiroai/sdk';

const client = new WiroClient({
  apiKey: process.env.WIRO_API_KEY!,
  apiSecret: process.env.WIRO_API_SECRET!,
});

// Run a model and wait for result
const run = await client.runModel('google/nano-banana-pro', {
  prompt: 'A cute cat wearing an astronaut helmet in space',
  aspectRatio: '16:9',
  resolution: '2K',
});

const result = await client.waitForTask(run.socketaccesstoken);

for (const output of result.outputs) {
  console.log(`${output.name}: ${output.url}`);
}
```

#### Auto-Discover Model Parameters

```typescript
import { getModelRegistry } from '@wiroai/sdk';

const registry = getModelRegistry();

// Get model definition (auto-fetches spec if not cached)
const model = await registry.ensureSpec(client, 'openai/sora-2');

if (model) {
  console.log(model.parameters);     // All parameters with types & defaults
  console.log(model.requiredParameters); // Required parameter names
}

// Validate parameters before running
const errors = registry.validateParams('openai/sora-2', {
  prompt: 'A sunset',
  duration: 'invalid',
});
// → ['Invalid value for "duration": got "invalid", expected one of: 5, 10, 15, 20']
```

#### Real-Time Task Monitoring

```typescript
// WebSocket-based monitoring
client.connectTaskWebSocket(run.socketaccesstoken, {
  onQueued: () => console.log('Queued...'),
  onProcessing: () => console.log('Processing...'),
  onCompleted: (outputs) => console.log('Done!', outputs),
  onFailed: (error) => console.error('Failed:', error),
});
```

</details>

---

## Architecture

```
@wiroai/sdk          Core: API client, auth, model registry, OpenAPI parser
    |
    +--- @wiroai/cli          Terminal interface (Commander.js)
    |
    +--- @wiroai/mcp-server   MCP interface (stdio + HTTP/SSE)
```

### How It Works

1. **Authentication** — HMAC-SHA256 signatures on every request (API key + secret)
2. **Model Discovery** — 58 pre-bundled OpenAPI specs, auto-fetched for unknown models
3. **Task Lifecycle** — Submit → Queue → Process → Complete (with polling or WebSocket)
4. **Parameter Validation** — OpenAPI-driven type checking, enum validation, required field enforcement

---

## Development

```bash
# Clone and install
git clone https://github.com/ersinkoc/wiro-ai.git
cd wiro-ai
npm install

# Build all packages
npm run build

# Run all tests (257 tests, 100% coverage)
npx vitest run

# Run tests with coverage report
npx vitest run --coverage

# Build individual packages
npm run build -w packages/sdk
npm run build -w packages/cli
npm run build -w packages/mcp-server
```

### Project Structure

```
wiro-ai/
  models/                    58 pre-bundled OpenAPI specs
  packages/
    sdk/                     Core SDK (@wiroai/sdk)
      src/
        client.ts            API client with HMAC auth
        model-registry.ts    OpenAPI spec parser & validator
        models.ts            Known model catalog
        websocket.ts         Real-time task monitoring
        __tests__/           11 test files
    cli/                     CLI tool (@wiroai/cli)
      src/
        commands/            run, info, models, status, watch, kill, cancel, config
        __tests__/           3 test files
    mcp-server/              MCP server (@wiroai/mcp-server)
      src/
        tools/               9 MCP tool implementations
        __tests__/           1 test file
  vitest.config.ts           100% coverage thresholds
```

---

## License

MIT - [Ersin KOC](https://github.com/ersinkoc)
