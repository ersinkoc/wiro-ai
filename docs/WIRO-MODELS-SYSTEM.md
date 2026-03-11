# Wiro AI — Model Auto-Discovery System

> **Supplementary spec for WIRO-MCP-CLI-PROMPT.md**
> This document defines the auto-discovery system that reads OpenAPI spec files from the `models/` folder and dynamically enriches the SDK, MCP server, and CLI with model-specific parameter schemas.

---

## 🎯 GOAL

When a user drops an OpenAPI JSON file into the `models/` folder, the system should **automatically**:

1. Parse the model slug, name, description, category, and processing time
2. Extract all model-specific input parameters with types, defaults, enums, and descriptions
3. Make this info available at runtime via SDK, MCP tools, and CLI commands
4. Validate user input against the model's actual parameter schema before sending API requests

**No code changes needed** — just drop a JSON file and the system picks it up.

---

## 📁 FILE CONVENTION

### Naming
```
models/openapi-{owner}-{model}.json
```

Examples:
```
models/openapi-google-nano-banana-2.json
models/openapi-openai-sora-2.json
models/openapi-black-forest-labs-flux-1-schnell.json
models/openapi-elevenlabs-voice-agent.json
```

> File extension can be `.json` or `.txt` — both are parsed as JSON.

### Format

Each file is a standard **OpenAPI 3.0.3** spec as returned by the Wiro AI platform. The system extracts information from these known locations:

```
paths["/Run/{owner}/{model}"]
  → post.summary         → model display name
  → post.description     → model description + processing time
  → post.requestBody.content["application/json"].schema.$ref
    → components.schemas[SchemaName]
      → properties        → parameter definitions
      → required          → required parameters

components.schemas.TaskObject.properties.status.enum
  → real task status values

x-task-status-info
  → completed_statuses   → terminal states (stop polling)
  → running_statuses     → in-progress states (continue polling)
```

---

## 🔧 SDK CHANGES

### New file: `packages/sdk/src/model-registry.ts`

```typescript
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ── Parsed model parameter ──────────────────────────────────

export interface ModelParameter {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
  format?: string;             // e.g. "uri"
  inputType?: string;          // x-input-type: "select", "combinefileinput", etc.
  label?: string;              // x-label
  help?: string;               // x-help
  options?: Array<{            // x-options (rich select options)
    value: string;
    label: string;
  }>;
}

// ── Parsed model definition ─────────────────────────────────

export interface ModelDefinition {
  slug: string;                // "google/nano-banana-2"
  owner: string;               // "google"
  model: string;               // "nano-banana-2"
  name: string;                // "Nano-Banana-2 Image Editing Tool"
  description: string;         // Full description text
  processingTime?: string;     // "10 seconds" (parsed from description)
  category?: string;           // Inferred or from categories field
  parameters: ModelParameter[];
  requiredParameters: string[];
}

// ── OpenAPI parser ──────────────────────────────────────────

export function parseOpenApiSpec(json: unknown): ModelDefinition | null {
  // 1. Find the /Run/{owner}/{model} path
  // 2. Extract model slug from path key
  // 3. Parse summary → name
  // 4. Parse description → description + processingTime
  // 5. Resolve $ref to get the request schema
  // 6. Parse each property into ModelParameter
  // 7. Return ModelDefinition
}

// ── Registry ────────────────────────────────────────────────

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private modelsDir: string;

  constructor(modelsDir?: string) {
    // Default: look for models/ relative to package root
    // At runtime: resolve from multiple possible locations
    this.modelsDir = modelsDir ?? this.findModelsDir();
    this.loadAll();
  }

  /** Scan models/ directory and load all OpenAPI specs */
  private loadAll(): void {
    if (!existsSync(this.modelsDir)) return;

    const files = readdirSync(this.modelsDir)
      .filter(f => f.startsWith('openapi-') && (f.endsWith('.json') || f.endsWith('.txt')));

    for (const file of files) {
      try {
        const raw = readFileSync(join(this.modelsDir, file), 'utf-8');
        const spec = JSON.parse(raw);
        const model = parseOpenApiSpec(spec);
        if (model) {
          this.models.set(model.slug, model);
        }
      } catch {
        // Skip malformed files silently
      }
    }
  }

  /** Reload all specs (useful if files changed) */
  reload(): void {
    this.models.clear();
    this.loadAll();
  }

  /** Get a specific model definition */
  get(slug: string): ModelDefinition | undefined {
    return this.models.get(slug);
  }

  /** Get all loaded model definitions */
  getAll(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  /** Search models by name or slug */
  search(query: string): ModelDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(m =>
      m.slug.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }

  /** Filter models by category */
  filterByCategory(category: string): ModelDefinition[] {
    return this.getAll().filter(m => m.category === category);
  }

  /** Check if a model has a known spec */
  has(slug: string): boolean {
    return this.models.has(slug);
  }

  /** Validate params against model schema, returns list of errors */
  validateParams(slug: string, params: Record<string, unknown>): string[] {
    const model = this.models.get(slug);
    if (!model) return []; // No spec = no validation (allow passthrough)

    const errors: string[] = [];

    // Check required params
    for (const req of model.requiredParameters) {
      if (!(req in params)) {
        errors.push(`Missing required parameter: "${req}"`);
      }
    }

    // Check enum values
    for (const [key, value] of Object.entries(params)) {
      const paramDef = model.parameters.find(p => p.name === key);
      if (paramDef?.enum && !paramDef.enum.includes(value)) {
        errors.push(
          `Invalid value for "${key}": got "${String(value)}", expected one of: ${paramDef.enum.join(', ')}`
        );
      }
    }

    return errors;
  }

  /** Find the models directory by checking multiple locations */
  private findModelsDir(): string {
    const candidates = [
      // Relative to CWD
      resolve(process.cwd(), 'models'),
      // Relative to this file (SDK package)
      resolve(import.meta.dirname ?? '', '..', '..', '..', 'models'),
      // Relative to project root (monorepo)
      resolve(import.meta.dirname ?? '', '..', '..', '..', '..', 'models'),
    ];

    for (const dir of candidates) {
      if (existsSync(dir)) return dir;
    }

    return candidates[0]!; // Fallback to CWD/models
  }
}

// ── Singleton instance ──────────────────────────────────────

let _registry: ModelRegistry | null = null;

export function getModelRegistry(modelsDir?: string): ModelRegistry {
  if (!_registry) {
    _registry = new ModelRegistry(modelsDir);
  }
  return _registry;
}
```

### OpenAPI Parser Implementation Detail

```typescript
export function parseOpenApiSpec(json: unknown): ModelDefinition | null {
  const spec = json as Record<string, unknown>;
  const paths = spec['paths'] as Record<string, unknown> | undefined;
  if (!paths) return null;

  // Find the /Run/... path
  const runPath = Object.keys(paths).find(p => p.startsWith('/Run/'));
  if (!runPath) return null;

  // Extract slug: "/Run/google/nano-banana-2" → "google/nano-banana-2"
  const slug = runPath.replace('/Run/', '');
  const [owner, ...modelParts] = slug.split('/');
  if (!owner || modelParts.length === 0) return null;
  const model = modelParts.join('/');

  // Get POST operation
  const pathObj = paths[runPath] as Record<string, unknown>;
  const post = pathObj['post'] as Record<string, unknown> | undefined;
  if (!post) return null;

  const name = (post['summary'] as string) ?? slug;
  const description = (post['description'] as string) ?? '';

  // Extract processing time from description: "**Processing Time:** 10 seconds"
  const timeMatch = description.match(/\*\*Processing Time:\*\*\s*(.+)/i);
  const processingTime = timeMatch?.[1]?.trim();

  // Resolve request body schema
  const requestBody = post['requestBody'] as Record<string, unknown> | undefined;
  const content = requestBody?.['content'] as Record<string, unknown> | undefined;
  const jsonContent = content?.['application/json'] as Record<string, unknown> | undefined;
  const schemaRef = jsonContent?.['schema'] as Record<string, unknown> | undefined;

  // Resolve $ref
  let schemaProps: Record<string, unknown> = {};
  let requiredFields: string[] = [];

  if (schemaRef?.['$ref']) {
    const ref = schemaRef['$ref'] as string;
    // "#/components/schemas/RunToolSchema" → ["components", "schemas", "RunToolSchema"]
    const refParts = ref.replace('#/', '').split('/');
    let resolved: unknown = spec;
    for (const part of refParts) {
      resolved = (resolved as Record<string, unknown>)?.[part];
    }
    if (resolved) {
      const resolvedSchema = resolved as Record<string, unknown>;
      schemaProps = (resolvedSchema['properties'] as Record<string, unknown>) ?? {};
      requiredFields = (resolvedSchema['required'] as string[]) ?? [];
    }
  } else if (schemaRef?.['properties']) {
    schemaProps = (schemaRef['properties'] as Record<string, unknown>) ?? {};
    requiredFields = (schemaRef['required'] as string[]) ?? [];
  }

  // Parse parameters
  const parameters: ModelParameter[] = [];
  for (const [paramName, paramValue] of Object.entries(schemaProps)) {
    // Skip callbackUrl — internal platform field
    if (paramName === 'callbackUrl') continue;

    const p = paramValue as Record<string, unknown>;
    const param: ModelParameter = {
      name: paramName,
      type: (p['type'] as ModelParameter['type']) ?? 'string',
      description: (p['description'] as string) ?? (p['title'] as string) ?? paramName,
      required: requiredFields.includes(paramName),
      default: p['default'],
      enum: p['enum'] as unknown[] | undefined,
      format: p['format'] as string | undefined,
      inputType: p['x-input-type'] as string | undefined,
      label: (p['x-label'] as string) ?? (p['title'] as string) ?? undefined,
      help: p['x-help'] as string | undefined,
      options: p['x-options'] as ModelParameter['options'] | undefined,
    };
    parameters.push(param);
  }

  // Try to infer category from model categories in task object
  const components = spec['components'] as Record<string, unknown> | undefined;
  const schemas = components?.['schemas'] as Record<string, unknown> | undefined;
  const taskObj = schemas?.['TaskObject'] as Record<string, unknown> | undefined;
  const taskProps = taskObj?.['properties'] as Record<string, unknown> | undefined;
  const categoriesProp = taskProps?.['categories'] as Record<string, unknown> | undefined;
  const exampleCategories = categoriesProp?.['example'] as string[] | undefined;

  // Map known Wiro categories to our categories
  let category: string | undefined;
  if (exampleCategories) {
    // The categories array from OpenAPI contains platform tags, not our semantic categories
    // We can try to infer from model description or parameters
  }

  // Infer category from parameters and description
  if (!category) {
    const descLower = description.toLowerCase();
    if (descLower.includes('image editing') || descLower.includes('image-to-image')) {
      category = 'image-editing';
    } else if (descLower.includes('text-to-video') || descLower.includes('video generation')) {
      category = 'text-to-video';
    } else if (descLower.includes('text-to-image') || descLower.includes('image generation')) {
      category = 'text-to-image';
    } else if (descLower.includes('text-to-speech') || descLower.includes('tts')) {
      category = 'text-to-speech';
    } else if (descLower.includes('voice') || descLower.includes('realtime')) {
      category = 'realtime-conversation';
    } else if (descLower.includes('llm') || descLower.includes('chat') || descLower.includes('language model')) {
      category = 'llm';
    }
  }

  return {
    slug,
    owner: owner!,
    model,
    name,
    description,
    processingTime,
    category,
    parameters,
    requiredParameters: requiredFields.filter(f => f !== 'callbackUrl'),
  };
}
```

---

## 🔄 REAL API CORRECTIONS

> These corrections are based on actual OpenAPI specs from the Wiro platform and **override** the corresponding sections in `WIRO-MCP-CLI-PROMPT.md`.

### Task Status Values (CORRECTED)

The original prompt uses `completed`/`failed`. The real API uses:

```typescript
// Terminal states — stop polling when received
export const TERMINAL_STATUSES = [
  'task_postprocess_end',   // ✅ Task completed successfully
  'task_cancel',            // ❌ Task was cancelled
] as const;

// In-progress states — continue polling
export const RUNNING_STATUSES = [
  'task_queue',             // Waiting in queue
  'task_accept',            // Accepted by system
  'task_assign',            // Assigned to worker
  'task_preprocess_start',  // Preprocessing started
  'task_preprocess_end',    // Preprocessing ended
  'task_start',             // Main processing started
  'task_output',            // Producing output
] as const;

export type TaskStatus =
  | typeof TERMINAL_STATUSES[number]
  | typeof RUNNING_STATUSES[number];
```

### Task Detail Response (CORRECTED)

The `TaskItem` interface needs to match the real API:

```typescript
export interface OutputFile {
  id: string;
  name: string;               // "output.png", "output.mp4"
  contenttype: string;         // MIME type: "image/png", "video/mp4"
  size: string;                // bytes as string
  url: string;                 // CDN download URL
  accesskey: string;
}

export interface TaskItem {
  id: string;
  uuid: string;
  socketaccesstoken: string;
  parameters: Record<string, unknown>;
  status: TaskStatus;
  outputs: OutputFile[];       // ← NOT images/videos/audio/text
  size: string;
  // Timestamps (all unix timestamp strings)
  createtime: string;
  starttime: string;
  endtime: string;
  elapsedseconds: string;
  // Cost
  totalcost: string;
  cps: string;
  // Model info
  modeldescription: string;
  modelslugowner: string;
  modelslugproject: string;
  categories: string[];
}

export interface TaskDetailResponse {
  total: string;
  errors: Array<{ code: number; message: string }>;
  tasklist: TaskItem[];
  result: boolean;
}
```

### Additional Endpoints (NEW)

```typescript
export const ENDPOINTS = {
  run: (model: string) => `/Run/${model}`,
  taskDetail: '/Task/Detail',
  taskKill: '/Task/Kill',       // NEW
  taskCancel: '/Task/Cancel',   // NEW
} as const;
```

### Task Detail Request (CORRECTED)

Supports multiple lookup methods:

```typescript
export interface TaskDetailRequest {
  taskid?: string;       // Task ID
  tasktoken?: string;    // Socket access token
  uuid?: string;         // User UUID (optional)
}
// Provide either taskid OR tasktoken to identify the task
```

### Run Model Response (CORRECTED)

```typescript
export interface RunModelResponse {
  errors: Array<{ code: number; message: string }>;  // ← objects, not strings
  taskid: string;
  socketaccesstoken: string;
  result: boolean;
}
```

---

## 🔧 MCP SERVER — NEW TOOL

### Tool 6: `wiro_model_info` (NEW)

Get detailed parameter information for a specific model.

```typescript
inputSchema: {
  model: z.string().describe('Model slug in owner/model format, e.g. "google/nano-banana-2"')
}

annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
```

**Behavior:**
1. Look up model in `ModelRegistry`
2. If found, return:
   - Model name, description, processing time
   - Full parameter list with types, defaults, enums, descriptions
   - Required vs optional parameters
   - Available options for select-type parameters
3. If not found, return a message saying the model may still work but no parameter info is available

**Example response:**
```
## google/nano-banana-2 — Nano-Banana-2 Image Editing Tool

An image editing tool designed for quick transformations using reference images and prompts.
Processing Time: 10 seconds

### Parameters

| Parameter     | Type   | Required | Default | Description                    |
|---------------|--------|----------|---------|--------------------------------|
| prompt        | string | ✅ Yes   | —       | The prompt to generate the image |
| inputImage    | string | No       | —       | Up to 14 reference images      |
| aspectRatio   | string | No       | —       | 1:1, 16:9, 9:16, 4:3, ...     |
| resolution    | string | No       | 1K      | 1K, 2K, 4K                    |
| safetySetting | string | No       | OFF     | Content safety filter level    |
```

### Updated `wiro_run_model` behavior

When `ModelRegistry` has a spec for the requested model:

1. **Validate params** against the schema before calling the API
2. **Return helpful errors** with available options: `"Invalid aspectRatio '2:1'. Available: 1:1, 16:9, 9:16, ..."`
3. **Include param hints** in the tool description dynamically

When no spec exists:

1. **Pass through** — accept any params and send to API (backwards compatible)
2. **Suggest** running `wiro_model_info` first

### Updated `wiro_list_models` behavior

Merge the static `KNOWN_MODELS` list with dynamically loaded `ModelRegistry` entries:
- Models from OpenAPI specs get richer info (description, param count, processing time)
- Static models remain as fallback for models without specs

---

## 💻 CLI — NEW COMMAND

### `wiro info <model>`

```
wiro info google/nano-banana-2
```

**Output:**
```
╭─ google/nano-banana-2 ─────────────────────────────╮
│ Nano-Banana-2 Image Editing Tool                    │
│ Processing Time: ~10 seconds                        │
├─────────────────────────────────────────────────────┤
│ PARAMETERS                                          │
│                                                     │
│ prompt (string) [REQUIRED]                          │
│   The prompt to generate the image.                 │
│                                                     │
│ inputImage (string)                                 │
│   Up to 14 reference images for mixing.             │
│                                                     │
│ aspectRatio (select)                                │
│   Options: 1:1, 1:4, 2:3, 3:2, 3:4, 4:3, 4:5,    │
│            5:4, 9:16, 16:9, 21:9                    │
│                                                     │
│ resolution (select) [default: 1K]                   │
│   Options: 1K (Standard), 2K (High), 4K (Ultra)    │
│                                                     │
│ safetySetting (select) [default: OFF]               │
│   Options: BLOCK_LOW_AND_ABOVE,                     │
│            BLOCK_MEDIUM_AND_ABOVE,                  │
│            BLOCK_ONLY_HIGH, BLOCK_NONE, OFF         │
╰─────────────────────────────────────────────────────╯
```

### Updated `wiro run` behavior

When a model has a spec in the registry:
1. **Auto-validate** parameters before sending
2. **Interactive mode** (`wiro run google/nano-banana-2 -i`): prompt user for each parameter with defaults and options
3. **Show available params** on `--help`: `wiro run google/nano-banana-2 --help`

---

## 🔧 SDK — ADDITIONAL METHODS

### `WiroClient` additions

```typescript
export class WiroClient {
  // ... existing methods ...

  /** Kill a running task */
  async killTask(taskId: string): Promise<TaskDetailResponse> {}

  /** Cancel a queued task */
  async cancelTask(taskId: string): Promise<TaskDetailResponse> {}

  /** Get task detail by taskId (not just taskToken) */
  async getTaskDetailById(taskId: string): Promise<TaskDetailResponse> {}
}
```

---

## 💻 CLI — ADDITIONAL COMMANDS

### `wiro kill <taskId>`

Forcefully terminate a running task.

```
wiro kill 420206
```

### `wiro cancel <taskId>`

Cancel a queued (not yet started) task.

```
wiro cancel 420206
```

---

## 📁 UPDATED PROJECT STRUCTURE

```
wiro/
├── models/                              # ← DROP OPENAPI SPECS HERE
│   ├── openapi-google-nano-banana-2.json
│   ├── openapi-openai-sora-2.json
│   └── ...                              # Add more as needed
│
├── packages/
│   ├── sdk/
│   │   └── src/
│   │       ├── model-registry.ts        # ← NEW: OpenAPI parser + registry
│   │       ├── types.ts                 # ← UPDATED: real API types
│   │       ├── constants.ts             # ← UPDATED: new endpoints
│   │       └── ...
│   │
│   ├── mcp-server/
│   │   └── src/
│   │       └── tools/
│   │           ├── model-info.ts        # ← NEW: wiro_model_info tool
│   │           ├── run-model.ts         # ← UPDATED: validation via registry
│   │           ├── list-models.ts       # ← UPDATED: merge with registry
│   │           ├── task-kill.ts         # ← NEW: wiro_task_kill tool
│   │           └── task-cancel.ts       # ← NEW: wiro_task_cancel tool
│   │
│   └── cli/
│       └── src/
│           └── commands/
│               ├── info.ts              # ← NEW: wiro info <model>
│               ├── kill.ts              # ← NEW: wiro kill <taskId>
│               ├── cancel.ts            # ← NEW: wiro cancel <taskId>
│               └── run.ts              # ← UPDATED: validation + interactive
```

---

## 🧪 IMPLEMENTATION ORDER (for this supplement)

1. **Rename `models/*.txt` → `*.json`** (or support both)
2. **SDK: `model-registry.ts`** — parser + registry + validation
3. **SDK: Update `types.ts`** — real task statuses, OutputFile, corrected interfaces
4. **SDK: Update `constants.ts`** — add new endpoints
5. **SDK: Update `client.ts`** — add killTask, cancelTask, getTaskDetailById
6. **SDK: Update `index.ts`** — export new modules
7. **MCP: Add `model-info.ts`** tool
8. **MCP: Add `task-kill.ts` and `task-cancel.ts`** tools
9. **MCP: Update `run-model.ts`** — integrate registry validation
10. **MCP: Update `list-models.ts`** — merge with registry
11. **MCP: Update `index.ts`** — register new tools
12. **CLI: Add `info.ts`** command
13. **CLI: Add `kill.ts` and `cancel.ts`** commands
14. **CLI: Update `run.ts`** — validation + interactive mode
15. **Build & verify**

---

## ⚠️ IMPORTANT NOTES

1. **The `models/` folder is at the monorepo root**, not inside a package. All packages resolve it relative to the project root.

2. **Models without specs still work.** The system is additive — if no OpenAPI spec exists for a model, it's treated as before (passthrough with no validation).

3. **The OpenAPI files are the single source of truth** for model parameters. The static `KNOWN_MODELS` list in `models.ts` serves only as a fallback for listing/discovery.

4. **File watching is NOT needed.** The registry loads at startup. For dev, `registry.reload()` can be called. For production, restart picks up new files.

5. **The parser must be defensive.** OpenAPI files from different models may have slightly different structures. Always use optional chaining and fallbacks.

6. **`callbackUrl` should be filtered out** from user-facing parameter lists — it's an internal platform feature.
