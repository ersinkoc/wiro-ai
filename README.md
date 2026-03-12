# Wiro AI

Unofficial TypeScript toolkit for [Wiro AI](https://wiro.ai) — run **76+ AI models** (image generation, video generation, LLMs, TTS, 3D, commerce, HR tools) from your code, terminal, or AI assistants via MCP.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-257%20passed-brightgreen)]()
[![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)]()

> **Disclaimer:** This is an unofficial community project. It is not affiliated with, endorsed by, or maintained by Wiro AI.

---

## Why Wiro AI SDK?

- **One toolkit, 76+ models** — text-to-image, text-to-video, LLMs, TTS, 3D, OCR, HR tools, and more
- **Three interfaces** — SDK for code, CLI for terminal, MCP server for AI assistants
- **Auto-discovery** — 76 pre-bundled OpenAPI specs with auto-fetch for unknown models
- **Parameter validation** — type checking, enum validation, required field enforcement before API calls
- **Real-time monitoring** — WebSocket-based task tracking with callbacks
- **Zero config** — just set API key + secret and go

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@wiroai/sdk`](./packages/sdk) | Core SDK — API client, model registry, OpenAPI spec parser | [![npm](https://img.shields.io/npm/v/@wiroai/sdk)](https://www.npmjs.com/package/@wiroai/sdk) |
| [`@wiroai/cli`](./packages/cli) | CLI tool — run models, check tasks, inspect parameters | [![npm](https://img.shields.io/npm/v/@wiroai/cli)](https://www.npmjs.com/package/@wiroai/cli) |
| [`@wiroai/mcp-server`](./packages/mcp-server) | MCP server — use Wiro AI from Claude, Cursor, Windsurf | [![npm](https://img.shields.io/npm/v/@wiroai/mcp-server)](https://www.npmjs.com/package/@wiroai/mcp-server) |

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

No install needed — runs via `npx`. Add to your MCP config:

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

Works with `claude_desktop_config.json`, `.cursor/mcp.json`, `.windsurf/mcp.json`, etc.

Then just ask your AI assistant:

> "Generate an image of a cat in space using nano-banana-pro"
>
> "Create a video with Sora 2 — a drone shot over a mountain lake at sunset"
>
> "What models are available for text-to-video?"
>
> "Parse this resume PDF and evaluate it against the job description"

For HTTP/SSE transport (instead of stdio):

```bash
TRANSPORT=http PORT=3000 npx -y @wiroai/mcp-server
```

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

# Run with extra parameters
wiro run black-forest-labs/flux-2-pro --prompt "Cyberpunk city" aspectRatio=16:9 resolution=2K

# List models by category
wiro models --category text-to-image

# Search models
wiro models --search "flux"

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

# Configure credentials interactively
wiro config
```

Full Wiro URLs work too:

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

#### Run a Model

```typescript
import { WiroClient } from '@wiroai/sdk';

const client = new WiroClient({
  apiKey: process.env.WIRO_API_KEY!,
  apiSecret: process.env.WIRO_API_SECRET!,
});

// Submit task
const run = await client.runModel('google/nano-banana-pro', {
  prompt: 'A cute cat wearing an astronaut helmet in space',
  aspectRatio: '16:9',
  resolution: '2K',
});

// Wait for completion
const result = await client.waitForTask(run.socketaccesstoken);

for (const output of result.outputs) {
  console.log(`${output.name}: ${output.url}`);
}
```

#### Auto-Discover Model Parameters

```typescript
import { getModelRegistry } from '@wiroai/sdk';

const registry = getModelRegistry();

// 76 models available instantly — unknown models auto-fetched on first use
const model = await registry.ensureSpec(client, 'openai/sora-2');

if (model) {
  console.log(model.parameters);        // All parameters with types & defaults
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
const unsubscribe = client.connectTaskWebSocket(run.socketaccesstoken, {
  onQueued: () => console.log('Queued...'),
  onProcessing: () => console.log('Processing...'),
  onCompleted: (outputs) => console.log('Done!', outputs),
  onFailed: (error) => console.error('Failed:', error),
  onError: (error) => console.error('WebSocket error:', error),
});

// Call unsubscribe() to disconnect
```

#### Task Management

```typescript
// Check task status
const detail = await client.getTaskDetail({ tasktoken: token });
const detailById = await client.getTaskDetailById(taskId);

// Kill a running task
await client.killTask(taskId);

// Cancel a queued task
await client.cancelTask(taskId);
```

#### Search & Browse Models

```typescript
import { KNOWN_MODELS, MODEL_CATEGORIES, getModelRegistry } from '@wiroai/sdk';

const registry = getModelRegistry();

// Search models by keyword
const results = registry.search('image');

// Get all models
const all = registry.getAll();

// Filter by category
const imageModels = KNOWN_MODELS.filter(m => m.category === 'text-to-image');

// Available categories
console.log(MODEL_CATEGORIES);
// → ['text-to-image', 'image-to-image', 'text-to-video', 'llm', 'text-to-speech', ...]
```

</details>

---

## Supported Models

76 models with pre-bundled OpenAPI specs across 15+ categories:

| Category | Count | Models |
|----------|-------|--------|
| **Text-to-Image** | 22 | FLUX.2 Pro/Dev/Turbo, FLUX.2 Klein (4B/9B), FLUX.1 Krea, Seedream V5/V4.5, Nano Banana 2/Pro, Qwen Image, GLM Image, LongCat, Reve, DreamOmni2, P-Image, Ovis 7B |
| **Text-to-Video** | 13 | Sora 2/Pro, Kling V3/V3 Omni/V2.6/V2.5 Turbo, Seedance Pro V1.5, Wan 2.6, PixVerse V5, P-Video, 3D Text Animations |
| **Image-to-Video** | 5 | LTX 2.3/Distilled, Kling V3 Motion Control, Wan 2.2 Animate/Replace |
| **Image Editing** | 5 | FireRed Image Edit, LongCat Image Edit, Lucy Edit, Camera Angle Editor, InfiniteYou FLUX |
| **LLM / Chat** | 15 | Gemini 3 Pro/Flash, Qwen 3.5 27B, GLM 4.7 Flash, Translate Gemma (4B/12B/27B + Image), WiroAI Turkish LLM 8B/9B, Wiro Chat, RAG Chat, Ovi |
| **Speech & Audio** | 3 | Qwen3 TTS, Qwen3 ASR, VibeVoice Realtime |
| **3D / Panorama** | 2 | Trellis 2, HunyuanWorld Panorama |
| **Talking Head** | 1 | Live Avatar |
| **Commerce** | 4 | Shopify Template, Virtual Try-On V1/V2, UGC Creator |
| **HR / Recruitment** | 11 | Resume Parser, Resume Evaluator (Job Desc/Skills), Feedback Generator, Job Description Generator, Culture Fit Test/Evaluator, Exit Interview Generator/Evaluator, Leave Analysis, Pulse Survey |
| **OCR** | 1 | Dots OCR 1.5 |

> **Any model on [wiro.ai/models](https://wiro.ai/models) can be used** — specs are auto-fetched on first use if not bundled.

---

## Architecture

```
@wiroai/sdk                 Core: API client, HMAC auth, model registry, OpenAPI parser
    |
    +-- @wiroai/cli          Terminal interface (Commander.js)
    |
    +-- @wiroai/mcp-server   AI assistant interface (stdio + HTTP/SSE)
```

### How It Works

```
  ┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
  │  You     │────>│  SDK / CLI / │────>│  Wiro AI │────>│  AI      │
  │  (code,  │     │  MCP Server  │     │  API     │     │  Model   │
  │  terminal│<────│              │<────│          │<────│          │
  │  or AI)  │     │  validates   │     │  HMAC    │     │  (GPU)   │
  └─────────┘     │  params via  │     │  auth    │     └──────────┘
                   │  OpenAPI     │     └──────────┘
                   └──────────────┘
```

1. **Authentication** — HMAC-SHA256 signatures on every request (API key + secret)
2. **Model Discovery** — 76 pre-bundled OpenAPI specs, auto-fetched for unknown models
3. **Parameter Validation** — OpenAPI-driven type checking, enum validation, required fields
4. **Task Lifecycle** — Submit → Queue → Process → Complete (polling or WebSocket)

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
  models/                     76 pre-bundled OpenAPI specs
  packages/
    sdk/                      Core SDK (@wiroai/sdk)
      src/
        client.ts             API client with HMAC auth
        model-registry.ts     OpenAPI spec parser & validator
        models.ts             76-model catalog with categories
        websocket.ts          Real-time task monitoring
        types.ts              TypeScript types & model categories
        errors.ts             Custom error classes
        __tests__/            11 test files
    cli/                      CLI tool (@wiroai/cli)
      src/
        commands/             run, info, models, status, watch, kill, cancel, config
        utils/                Terminal output, interactive prompts
        __tests__/            3 test files
    mcp-server/               MCP server (@wiroai/mcp-server)
      src/
        tools/                9 MCP tool implementations
        utils/                Output formatting
        __tests__/            1 test file
  llms.txt                    LLM-friendly project index
  llms-full.txt               Complete API reference for LLMs
  vitest.config.ts            100% coverage thresholds
```

---

## LLM-Friendly Docs

This project includes [`llms.txt`](./llms.txt) and [`llms-full.txt`](./llms-full.txt) following the [llmstxt.org](https://llmstxt.org) specification — optimized for AI assistants to understand and use this SDK.

---

## License

MIT — [Ersin KOC](https://github.com/ersinkoc)
