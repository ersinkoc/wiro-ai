# Wiro AI MCP Server & CLI — Claude Code Prompt

> **Single-shot prompt for Claude Code to build a production-ready MCP server and CLI tool for the Wiro AI platform.**

---

## 🎯 PROJECT OVERVIEW

Build a TypeScript monorepo containing:

1. **`wiro-mcp-server`** — MCP (Model Context Protocol) server that exposes Wiro AI's API as tools for LLM agents
2. **`wiro-cli`** — Interactive CLI tool for running Wiro AI models from the terminal
3. **`@wiro/sdk`** — Shared SDK package used by both MCP server and CLI

**Package name:** `wiro-mcp-server` (npm)  
**License:** MIT  
**Node.js:** >=22  
**Module:** ESM-only  
**Language:** TypeScript 5.x strict mode  
**Zero unnecessary dependencies** — minimal, audited dependency tree

---

## 📁 PROJECT STRUCTURE

```
wiro/
├── package.json                    # Root workspace config
├── tsconfig.json                   # Root TS config (path refs)
├── tsconfig.base.json              # Shared compiler options
├── README.md
├── LICENSE
├── .gitignore
├── .env.example                    # WIRO_API_KEY, WIRO_API_SECRET
├── WIRO-MODELS-SYSTEM.md           # Model auto-discovery spec
│
├── models/                         # ← DROP OPENAPI SPECS HERE
│   ├── openapi-google-nano-banana-2.json
│   └── ...                         # More model specs
│
├── packages/
│   ├── sdk/                        # @wiro/sdk — shared API client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            # Public exports
│   │       ├── client.ts           # WiroClient class
│   │       ├── auth.ts             # HMAC-SHA256 signature generation
│   │       ├── types.ts            # All TypeScript interfaces
│   │       ├── errors.ts           # Custom error classes
│   │       ├── constants.ts        # API base URL, endpoints, limits
│   │       ├── models.ts           # Static model list (fallback)
│   │       ├── model-registry.ts   # OpenAPI parser + auto-discovery registry
│   │       └── websocket.ts        # WebSocket task polling
│   │
│   ├── mcp-server/                 # wiro-mcp-server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            # MCP server entry point (stdio + HTTP)
│   │       ├── tools/
│   │       │   ├── run-model.ts    # wiro_run_model tool (with registry validation)
│   │       │   ├── list-models.ts  # wiro_list_models tool (merged with registry)
│   │       │   ├── model-info.ts   # wiro_model_info tool (parameter details)
│   │       │   ├── task-status.ts  # wiro_task_status tool
│   │       │   ├── task-wait.ts    # wiro_task_wait tool (poll until complete)
│   │       │   ├── task-kill.ts    # wiro_task_kill tool
│   │       │   ├── task-cancel.ts  # wiro_task_cancel tool
│   │       │   └── list-categories.ts # wiro_list_categories tool
│   │       └── utils/
│   │           └── format.ts       # Response formatters (MD/JSON)
│   │
│   └── cli/                        # wiro-cli
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            # CLI entry (bin)
│           ├── commands/
│           │   ├── run.ts          # `wiro run <model> [params]` (with validation)
│           │   ├── models.ts       # `wiro models [--category]`
│           │   ├── info.ts         # `wiro info <model>` (show parameters)
│           │   ├── status.ts       # `wiro status <taskToken>`
│           │   ├── config.ts       # `wiro config set/get/list`
│           │   ├── watch.ts        # `wiro watch <taskToken>` (WebSocket)
│           │   ├── kill.ts         # `wiro kill <taskId>`
│           │   └── cancel.ts       # `wiro cancel <taskId>`
│           └── utils/
│               ├── config.ts       # Config file management (~/.wiro/config.json)
│               ├── output.ts       # Terminal output helpers (table, spinner)
│               └── interactive.ts  # Interactive model parameter input
```

---

## 🔐 WIRO AI API — COMPLETE SPECIFICATION

### Base URL
```
https://api.wiro.ai/v1
```

### Authentication — HMAC-SHA256

Every request requires 3 headers calculated from API Key and API Secret:

```typescript
// 1. Get credentials from environment
const API_KEY = process.env.WIRO_API_KEY;      // x-api-key header value AND HMAC key
const API_SECRET = process.env.WIRO_API_SECRET; // Part of HMAC message

// 2. Generate nonce (unix timestamp or random integer)
const nonce = Math.floor(Date.now() / 1000).toString();

// 3. Calculate HMAC-SHA256 signature
// message = API_SECRET + nonce
// key = API_KEY
import { createHmac } from 'node:crypto';
const signature = createHmac('sha256', API_KEY)
  .update(API_SECRET + nonce)
  .digest('hex');

// 4. Set headers on every request
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  'x-nonce': nonce,
  'x-signature': signature
};
```

### Endpoints

#### 1. Run a Model
```
POST /v1/Run/{owner}/{model}
```

**Request body** varies per model. Common fields:
```json
{
  "prompt": "A sunset over mountains",
  "negativePrompt": "",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "cfg_scale": 7,
  "seed": -1
}
```

**Response:**
```json
{
  "errors": [],
  "taskid": "2221",
  "socketaccesstoken": "eDcCm5yyUfIvMFspTwww49OUfgXkQt",
  "result": true
}
```

#### 2. Get Task Detail
```
POST /v1/Task/Detail
```

**Request body** (provide either `taskid` OR `tasktoken`):
```json
{
  "taskid": "420206",
  "tasktoken": "qMmK1O5VEpM6iD86siXvoxZCginGFl",
  "uuid": "86ae3c1d-edd1-4c2e-ba19-d1a3a23eeca4"
}
```

**Response:**
```json
{
  "total": "1",
  "errors": [],
  "tasklist": [
    {
      "id": "420206",
      "uuid": "86ae3c1d-edd1-4c2e-ba19-d1a3a23eeca4",
      "socketaccesstoken": "qMmK1O5VEpM6iD86siXvoxZCginGFl",
      "parameters": { "prompt": "A sunset" },
      "status": "task_postprocess_end",
      "starttime": "1770686437",
      "endtime": "1770686482",
      "elapsedseconds": "50.0000",
      "totalcost": "0.046841600000",
      "outputs": [
        {
          "id": "6bc392c93856dfce3a7d1b4261e15af3",
          "name": "output.png",
          "contenttype": "image/png",
          "size": "202472",
          "url": "https://cdn1.wiro.ai/6a6af820-xxxx/output.png",
          "accesskey": "dFKlMApaSgMeHKsJyaDeKrefcHahUK"
        }
      ],
      "size": "202472",
      "modeldescription": "nano-banana-2",
      "modelslugowner": "google",
      "modelslugproject": "nano-banana-2",
      "categories": ["tool", "partner", "price-list", "realtime"]
    }
  ],
  "result": true
}
```

**Task Status Values:**
```
Terminal states (stop polling):    task_postprocess_end, task_cancel
In-progress states (keep polling): task_queue, task_accept, task_assign,
                                    task_preprocess_start, task_preprocess_end,
                                    task_start, task_output
```

#### 3. Kill Running Task
```
POST /v1/Task/Kill
```
**Request body:** `{ "taskid": "420206" }` or `{ "socketaccesstoken": "..." }`

#### 4. Cancel Queued Task
```
POST /v1/Task/Cancel
```
**Request body:** `{ "taskid": "420206" }`

#### 5. WebSocket Real-time Updates
```
wss://socket.wiro.ai/v1
```

**Protocol:**
1. Connect to WebSocket
2. Send registration: `{"type": "task_info", "tasktoken": "<socketaccesstoken>"}`
3. Listen for messages:
   - `{"type": "task_queue"}` — Task queued
   - `{"type": "task_processing"}` — Task processing
   - `{"type": "task_completed", "output": {...}}` — Task done
   - `{"type": "task_failed", "error": "..."}` — Task failed

### Model Categories & Known Models

```typescript
export const MODEL_CATEGORIES = [
  'text-to-image',
  'image-to-image',
  'image-editing',
  'text-to-video',
  'image-to-video',
  'speech-to-video',
  'talking-head',
  'text-to-speech',
  'speech-to-text',
  'text-to-music',
  'text-to-song',
  'voice-clone',
  'realtime-conversation',
  '3d-generation',
  'chat',
  'llm',
  'reasoning',
  'rag',
] as const;

export const KNOWN_MODELS = [
  // Image
  { slug: 'google/nano-banana-pro', category: 'text-to-image', name: 'Nano Banana Pro' },
  { slug: 'black-forest-labs/flux-1-schnell', category: 'text-to-image', name: 'FLUX.1 Schnell' },
  // Video
  { slug: 'openai/sora-2', category: 'text-to-video', name: 'Sora 2' },
  { slug: 'openai/sora-2-pro', category: 'text-to-video', name: 'Sora 2 Pro' },
  { slug: 'kling-ai/kling-v3', category: 'text-to-video', name: 'Kling V3' },
  // LLM
  { slug: 'google/gemini-3-pro', category: 'llm', name: 'Gemini 3 Pro' },
  // Audio
  { slug: 'elevenlabs/voice-agent', category: 'realtime-conversation', name: 'ElevenLabs Voice Agent' },
] as const;
```

> **IMPORTANT:** The model list is not exhaustive. The CLI and MCP should accept any `owner/model` slug. The known models list is for autocomplete/discovery only.

### Model Auto-Discovery System

> **See [WIRO-MODELS-SYSTEM.md](./WIRO-MODELS-SYSTEM.md) for full spec.**

Drop OpenAPI JSON files into `models/` folder → system automatically parses model parameters, descriptions, and validation rules. No code changes needed.

```
models/
├── openapi-google-nano-banana-2.json     # Auto-parsed at startup
├── openapi-openai-sora-2.json
└── ...
```

The `ModelRegistry` (in `packages/sdk/src/model-registry.ts`) reads these files and provides:
- Parameter schemas with types, defaults, enums, descriptions
- Input validation before API calls
- Rich model info for `wiro_model_info` MCP tool and `wiro info` CLI command

---

## 🔧 MCP SERVER — TOOL DEFINITIONS

### Tool 1: `wiro_run_model`

Runs an AI model on Wiro. This is the primary tool.

```typescript
inputSchema: {
  model: z.string().describe('Model slug in owner/model format, e.g. "openai/sora-2", "google/nano-banana-pro"'),
  params: z.record(z.unknown()).describe('Model-specific parameters as key-value pairs. Common: prompt, negativePrompt, width, height, steps, cfg_scale, seed, inputImage (base64 or URL)'),
  wait: z.boolean().default(true).describe('If true, poll task until completion and return result. If false, return task token immediately.'),
  timeout_seconds: z.number().int().min(10).max(600).default(120).describe('Max seconds to wait for task completion (only if wait=true)')
}

// Annotations
annotations: {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true
}
```

**Behavior:**
1. Call `POST /v1/Run/{model}` with params
2. If `wait=false`, return `{ taskId, socketAccessToken }` immediately
3. If `wait=true`, poll `/v1/Task/Detail` every 3 seconds until completed/failed or timeout
4. Return structured result with output URLs

### Tool 2: `wiro_list_models`

Lists available models, optionally filtered by category.

```typescript
inputSchema: {
  category: z.string().optional().describe('Filter by category: text-to-image, text-to-video, llm, etc.'),
  search: z.string().optional().describe('Search models by name or slug')
}

annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
```

### Tool 3: `wiro_task_status`

Check the status of a running task.

```typescript
inputSchema: {
  task_token: z.string().describe('The socketAccessToken returned from wiro_run_model')
}

annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
```

### Tool 4: `wiro_task_wait`

Wait for a task to complete using polling.

```typescript
inputSchema: {
  task_token: z.string().describe('The socketAccessToken returned from wiro_run_model'),
  timeout_seconds: z.number().int().min(10).max(600).default(120).describe('Max seconds to wait'),
  poll_interval_seconds: z.number().int().min(1).max(30).default(3).describe('Seconds between polls')
}

annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
```

### Tool 5: `wiro_list_categories`

Lists all available model categories.

```typescript
inputSchema: {} // No input needed
annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
```

### Tool 6: `wiro_model_info`

Get detailed parameter information for a model (from auto-discovered OpenAPI specs).

```typescript
inputSchema: {
  model: z.string().describe('Model slug in owner/model format, e.g. "google/nano-banana-2"')
}

annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
```

### Tool 7: `wiro_task_kill`

Kill a running task.

```typescript
inputSchema: {
  task_id: z.string().describe('The task ID to kill')
}

annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
```

### Tool 8: `wiro_task_cancel`

Cancel a queued task (not yet started).

```typescript
inputSchema: {
  task_id: z.string().describe('The task ID to cancel')
}

annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
```

---

## 💻 CLI — COMMAND DEFINITIONS

### Global Config

Config stored at `~/.wiro/config.json`:
```json
{
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET",
  "defaultTimeout": 120,
  "outputDir": "./wiro-output"
}
```

Environment variables override config: `WIRO_API_KEY`, `WIRO_API_SECRET`

### Commands

#### `wiro run <model> [options]`
```
wiro run openai/sora-2 --prompt "A cat playing piano" --width 1920 --height 1080
wiro run google/nano-banana-pro -p "Mountain landscape at sunset" --steps 30
wiro run google/gemini-3-pro -p "Explain quantum computing" --no-wait
```

Options:
- `-p, --prompt <text>` — Main prompt text
- `-n, --negative-prompt <text>` — Negative prompt
- `--width <n>` — Width in pixels
- `--height <n>` — Height in pixels
- `--steps <n>` — Inference steps
- `--cfg-scale <n>` — CFG scale
- `--seed <n>` — Seed (-1 for random)
- `--input-image <path|url>` — Input image (auto base64 encode if file path)
- `--param <key=value>` — Extra params (repeatable): `--param duration=5 --param fps=24`
- `--no-wait` — Don't wait for result, print task token
- `--timeout <seconds>` — Wait timeout (default: 120)
- `-o, --output <dir>` — Download output files to this directory
- `--json` — Output as JSON

#### `wiro models [options]`
```
wiro models
wiro models --category text-to-image
wiro models --search sora
```

Options:
- `-c, --category <name>` — Filter by category
- `-s, --search <query>` — Search by name/slug
- `--json` — Output as JSON

#### `wiro status <taskToken>`
```
wiro status eDcCm5yyUfIvMFspTwww49OUfgXkQt
```

#### `wiro watch <taskToken>`
```
wiro watch eDcCm5yyUfIvMFspTwww49OUfgXkQt
```
Real-time task monitoring via WebSocket with live status updates and spinner.

#### `wiro info <model>`
```
wiro info google/nano-banana-2
wiro info openai/sora-2
```
Shows detailed parameter information for a model (from auto-discovered OpenAPI specs).

#### `wiro kill <taskId>`
```
wiro kill 420206
```
Forcefully terminate a running task.

#### `wiro cancel <taskId>`
```
wiro cancel 420206
```
Cancel a queued (not yet started) task.

#### `wiro config <subcommand>`
```
wiro config set apiKey YOUR_KEY
wiro config set apiSecret YOUR_SECRET
wiro config get apiKey
wiro config list
```

---

## 📦 DEPENDENCIES

### SDK (`packages/sdk`)
```json
{
  "dependencies": {}
}
```
> **Zero runtime dependencies.** Use only Node.js built-in modules: `node:crypto`, `node:https`, `node:fs`, `node:path`. For HTTP, use native `fetch()` (available in Node 22+). For WebSocket use native `WebSocket` (available in Node 22+).

### MCP Server (`packages/mcp-server`)
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "express": "^5.1.0",
    "zod": "^3.24.0",
    "@wiro/sdk": "workspace:*"
  }
}
```

### CLI (`packages/cli`)
```json
{
  "dependencies": {
    "@wiro/sdk": "workspace:*"
  }
}
```
> CLI argument parsing: Use a **minimal** approach. Either use Node.js built-in `parseArgs` from `node:util` OR a single lightweight package like `commander@13`. No heavy CLI frameworks.
> For terminal output: Use ANSI escape codes directly or a single package like `ora` for spinner. Keep it minimal.

---

## ⚙️ TYPESCRIPT & BUILD CONFIG

### tsconfig.base.json
```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### Root package.json
```json
{
  "name": "wiro",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "clean": "rm -rf packages/*/dist",
    "typecheck": "tsc --build"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

---

## 🛠️ IMPLEMENTATION REQUIREMENTS

### SDK — `packages/sdk/src/`

#### `auth.ts`
```typescript
export interface WiroAuthHeaders {
  'x-api-key': string;
  'x-nonce': string;
  'x-signature': string;
  'Content-Type': string;
}

export function createAuthHeaders(apiKey: string, apiSecret: string): WiroAuthHeaders {
  // Use node:crypto createHmac
  // nonce = unix timestamp string
  // signature = HMAC-SHA256(apiKey, apiSecret + nonce) → hex
  // Return all 4 headers
}
```

#### `client.ts`
```typescript
export class WiroClient {
  constructor(config: WiroConfig) {}

  async runModel(model: string, params: Record<string, unknown>): Promise<RunModelResponse> {}
  async getTaskDetail(taskToken: string): Promise<TaskDetailResponse> {}
  async getTaskDetailById(taskId: string): Promise<TaskDetailResponse> {}
  async waitForTask(taskToken: string, options?: WaitOptions): Promise<TaskResult> {}
  async killTask(taskId: string): Promise<TaskDetailResponse> {}
  async cancelTask(taskId: string): Promise<TaskDetailResponse> {}
  connectTaskWebSocket(taskToken: string, callbacks: TaskCallbacks): () => void {} // returns disconnect fn
}
```

#### `types.ts`
Define all interfaces: `WiroConfig`, `RunModelResponse`, `TaskDetailResponse`, `TaskResult`, `TaskStatus`, `OutputFile`, `WaitOptions`, `TaskCallbacks`, `ModelInfo`, `ModelCategory`

> **IMPORTANT:** Use real task status values from the API: `task_queue`, `task_accept`, `task_assign`, `task_preprocess_start`, `task_preprocess_end`, `task_start`, `task_output`, `task_postprocess_end`, `task_cancel`. See updated Task Detail response above.

> **IMPORTANT:** Output is `OutputFile[]` (objects with `id`, `name`, `contenttype`, `size`, `url`, `accesskey`), NOT simple `images/videos/audio/text` arrays.

#### `errors.ts`
Custom error classes: `WiroAuthError`, `WiroApiError`, `WiroTimeoutError`, `WiroValidationError`

#### `model-registry.ts`
OpenAPI spec parser + model registry. See [WIRO-MODELS-SYSTEM.md](./WIRO-MODELS-SYSTEM.md) for full implementation spec.

### MCP Server — `packages/mcp-server/src/`

#### `index.ts`
- Initialize `McpServer` with name `"wiro-mcp-server"`, version from package.json
- Register all 5 tools using `server.registerTool()`
- Support both stdio (default) and HTTP transport via `TRANSPORT=http` env var
- Read WIRO_API_KEY and WIRO_API_SECRET from environment
- Validate credentials on startup, log clear error if missing

#### Tool implementations
- Each tool in its own file under `tools/`
- Export a `register(server, client)` function that registers the tool
- Use Zod schemas with `.strict()` for input validation
- Return both `content` (text) and `structuredContent` for modern clients
- All errors are actionable: tell the user what to do

### CLI — `packages/cli/src/`

#### `index.ts` (bin entry)
```typescript
#!/usr/bin/env node
```

- Parse commands and route to handlers
- Global `--json` flag for machine-readable output
- Global `--verbose` flag for debug logging
- Colorful, clean terminal output with spinners for async operations
- Auto-download output files (images/videos/audio) when task completes

#### Download behavior
When `wiro run` completes with output URLs:
1. Create output directory if needed (default: `./wiro-output/`)
2. Download each output file
3. Print file paths
4. Show preview hint: "Open with: open ./wiro-output/result_001.png"

---

## 🧪 IMPLEMENTATION ORDER

Execute in this order to avoid dependency issues:

1. **Root setup** — workspace package.json, tsconfig files, .gitignore, .env.example
2. **SDK package** — types → errors → constants → auth → client → websocket → index
3. **MCP Server** — format utils → tools (one by one) → index.ts → build & test
4. **CLI** — config utils → output utils → commands (one by one) → index.ts → build & test
5. **README.md** — Installation, configuration, usage examples for both MCP and CLI
6. **Build all** — `npm run build` must succeed with zero errors

---

## 📋 QUALITY CHECKLIST

Before considering the implementation complete:

- [ ] `npm run build` succeeds across all workspace packages with zero errors
- [ ] SDK has zero runtime dependencies (only node: built-ins)
- [ ] All TypeScript is strict mode, no `any` types
- [ ] All Zod schemas use `.strict()` and have descriptive `.describe()` on each field
- [ ] MCP tools use `registerTool` (not deprecated `server.tool()`)
- [ ] MCP tools have proper annotations (readOnlyHint, destructiveHint, etc.)
- [ ] MCP server works with both stdio and HTTP transport
- [ ] CLI `wiro --help` shows all commands and options
- [ ] CLI handles missing credentials gracefully with setup instructions
- [ ] Error messages are actionable (tell user what to do)
- [ ] WebSocket task watching works for real-time updates
- [ ] Output files auto-download to output directory
- [ ] `.env.example` documents all environment variables
- [ ] README has clear setup, config, and usage docs
- [ ] Model auto-discovery works: drop JSON in `models/` → parameters available
- [ ] Task status values match real API (`task_postprocess_end`, not `completed`)
- [ ] Output structure uses `OutputFile[]` (not `images/videos/audio` arrays)
- [ ] `wiro_model_info` MCP tool returns parameter details from OpenAPI specs
- [ ] `wiro info <model>` CLI command shows parameter details
- [ ] `wiro_task_kill` and `wiro_task_cancel` MCP tools work
- [ ] `wiro kill` and `wiro cancel` CLI commands work

---

## 📄 README.md TEMPLATE

```markdown
# Wiro AI — MCP Server & CLI

Interact with [Wiro AI](https://wiro.ai) models via MCP (for LLM agents) or CLI (for terminal).

## Quick Start

### 1. Install
\`\`\`bash
npm install -g wiro-mcp-server
# or use with Claude Code / Claude Desktop
\`\`\`

### 2. Configure
\`\`\`bash
# Via environment variables
export WIRO_API_KEY="your-api-key"
export WIRO_API_SECRET="your-api-secret"

# Or via CLI
wiro config set apiKey your-api-key
wiro config set apiSecret your-api-secret
\`\`\`

### 3. Use CLI
\`\`\`bash
# Generate an image
wiro run google/nano-banana-pro -p "A beautiful sunset over Istanbul"

# Generate a video
wiro run openai/sora-2 -p "A cat walking on the moon" --no-wait

# Check task status
wiro status <task-token>

# Watch task in real-time
wiro watch <task-token>

# List available models
wiro models --category text-to-image
\`\`\`

### 4. Use as MCP Server

#### Claude Desktop (`claude_desktop_config.json`)
\`\`\`json
{
  "mcpServers": {
    "wiro": {
      "command": "npx",
      "args": ["wiro-mcp-server"],
      "env": {
        "WIRO_API_KEY": "your-api-key",
        "WIRO_API_SECRET": "your-api-secret"
      }
    }
  }
}
\`\`\`

#### Claude Code
\`\`\`bash
claude mcp add wiro -- npx wiro-mcp-server
\`\`\`

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `wiro_run_model` | Run any AI model (image, video, audio, text) |
| `wiro_list_models` | Browse available models by category |
| `wiro_model_info` | Get detailed parameter info for a model |
| `wiro_task_status` | Check task completion status |
| `wiro_task_wait` | Poll until task completes |
| `wiro_task_kill` | Kill a running task |
| `wiro_task_cancel` | Cancel a queued task |
| `wiro_list_categories` | List all model categories |

## License

MIT
\`\`\`

---

## ⚠️ CRITICAL RULES

1. **HMAC signature is critical** — The signature calculation MUST match exactly: `HMAC-SHA256(API_KEY, API_SECRET + nonce)` where API_KEY is the HMAC key and the message is API_SECRET concatenated with nonce. Result is hex-encoded.

2. **Native fetch only** — Do NOT install axios, node-fetch, or got. Use Node.js 22+ built-in `fetch()`.

3. **Native WebSocket only** — Do NOT install ws or other WebSocket libraries. Use Node.js 22+ built-in `WebSocket`.

4. **ESM only** — No CommonJS. All files use import/export. Package.json has `"type": "module"`.

5. **No `any` types** — Use `unknown` and type guards. TypeScript strict mode is mandatory.

6. **MCP SDK modern API only** — Use `server.registerTool()`, NOT `server.tool()` or `setRequestHandler`.

7. **Workspace protocol** — Use `"@wiro/sdk": "workspace:*"` for internal dependency references.

8. **Bin entry** — CLI package must have `"bin": { "wiro": "dist/index.js" }` in package.json.

9. **Build before ship** — Always verify `npm run build` works. The MCP server entry point is `dist/index.js`.

10. **Handle async task pattern** — Wiro API is async: Run returns a task token → Poll/WebSocket for completion → Return results. ALL tools must handle this correctly.
