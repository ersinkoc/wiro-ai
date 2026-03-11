import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ── Parsed model parameter ──────────────────────────────────

export interface ModelParameter {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  inputType?: string;
  label?: string;
  help?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

// ── Parsed model definition ─────────────────────────────────

export interface ModelDefinition {
  slug: string;
  owner: string;
  model: string;
  name: string;
  description: string;
  processingTime?: string;
  category?: string;
  parameters: ModelParameter[];
  requiredParameters: string[];
}

// ── OpenAPI parser ──────────────────────────────────────────

export function parseOpenApiSpec(json: unknown): ModelDefinition | null {
  const spec = json as Record<string, unknown>;
  const paths = spec['paths'] as Record<string, unknown> | undefined;
  if (!paths) return null;

  const runPath = Object.keys(paths).find(p => p.startsWith('/Run/'));
  if (!runPath) return null;

  const slug = runPath.replace('/Run/', '');
  const [owner, ...modelParts] = slug.split('/');
  if (!owner || modelParts.length === 0) return null;
  const model = modelParts.join('/');

  const pathObj = paths[runPath] as Record<string, unknown>;
  const post = pathObj['post'] as Record<string, unknown> | undefined;
  if (!post) return null;

  const name = (post['summary'] as string) ?? slug;
  const description = (post['description'] as string) ?? '';

  const timeMatch = description.match(/\*\*Processing Time:\*\*\s*(.+)/i);
  const processingTime = timeMatch?.[1]?.trim();

  const requestBody = post['requestBody'] as Record<string, unknown> | undefined;
  const content = requestBody?.['content'] as Record<string, unknown> | undefined;
  const jsonContent = content?.['application/json'] as Record<string, unknown> | undefined;
  const schemaRef = jsonContent?.['schema'] as Record<string, unknown> | undefined;

  let schemaProps: Record<string, unknown> = {};
  let requiredFields: string[] = [];

  if (schemaRef?.['$ref']) {
    const ref = schemaRef['$ref'] as string;
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

  const parameters: ModelParameter[] = [];
  for (const [paramName, paramValue] of Object.entries(schemaProps)) {
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

  const components = spec['components'] as Record<string, unknown> | undefined;
  const schemas = components?.['schemas'] as Record<string, unknown> | undefined;
  const taskObj = schemas?.['TaskObject'] as Record<string, unknown> | undefined;
  const taskProps = taskObj?.['properties'] as Record<string, unknown> | undefined;
  const categoriesProp = taskProps?.['categories'] as Record<string, unknown> | undefined;
  const exampleCategories = categoriesProp?.['example'] as string[] | undefined;

  let category: string | undefined;
  if (exampleCategories && exampleCategories.length > 0) {
    // Use first example category if available
  }

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
    owner: owner,
    model,
    name,
    description,
    processingTime,
    category,
    parameters,
    requiredParameters: requiredFields.filter(f => f !== 'callbackUrl'),
  };
}

// ── Registry ────────────────────────────────────────────────

export class ModelRegistry {
  private models = new Map<string, ModelDefinition>();
  private aliases = new Map<string, string>(); // alias → canonical slug
  private modelsDir: string;

  constructor(modelsDir?: string) {
    this.modelsDir = modelsDir ?? this.findModelsDir();
    this.loadAll();
  }

  private loadAll(): void {
    if (!existsSync(this.modelsDir)) return;

    const files = readdirSync(this.modelsDir)
      .filter(f => f.startsWith('openapi-') && (f.endsWith('.json') || f.endsWith('.txt')));

    for (const file of files) {
      try {
        const raw = readFileSync(join(this.modelsDir, file), 'utf-8');
        const spec: unknown = JSON.parse(raw);
        const model = parseOpenApiSpec(spec);
        if (model) {
          this.models.set(model.slug, model);
          // Derive user slug from filename: openapi-owner-model.json → owner/model
          const base = file.replace(/^openapi-/, '').replace(/\.(json|txt)$/, '');
          const dashIdx = base.indexOf('-');
          if (dashIdx > 0) {
            const fileSlug = base.substring(0, dashIdx) + '/' + base.substring(dashIdx + 1);
            if (fileSlug !== model.slug) {
              this.aliases.set(fileSlug, model.slug);
            }
          }
        }
      } catch {
        // Skip malformed files silently
      }
    }
  }

  reload(): void {
    this.models.clear();
    this.aliases.clear();
    this.loadAll();
  }

  private resolve(slug: string): string {
    return this.aliases.get(slug) ?? slug;
  }

  get(slug: string): ModelDefinition | undefined {
    return this.models.get(slug) ?? this.models.get(this.resolve(slug));
  }

  getAll(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  search(query: string): ModelDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(m =>
      m.slug.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }

  filterByCategory(category: string): ModelDefinition[] {
    return this.getAll().filter(m => m.category === category);
  }

  has(slug: string): boolean {
    return this.models.has(slug) || this.models.has(this.resolve(slug));
  }

  saveSpec(slug: string, spec: Record<string, unknown>): string {
    if (!existsSync(this.modelsDir)) {
      mkdirSync(this.modelsDir, { recursive: true });
    }

    const filename = `openapi-${slug.replace(/\//g, '-')}.json`;
    const filepath = join(this.modelsDir, filename);
    writeFileSync(filepath, JSON.stringify(spec, null, 2), 'utf-8');

    // Parse and register immediately
    const model = parseOpenApiSpec(spec);
    if (model) {
      this.models.set(model.slug, model);
      // If the user-provided slug differs from the spec slug, create an alias
      if (slug !== model.slug) {
        this.aliases.set(slug, model.slug);
      }
    }

    return filepath;
  }

  getModelsDir(): string {
    return this.modelsDir;
  }

  validateParams(slug: string, params: Record<string, unknown>): string[] {
    const model = this.get(slug);
    if (!model) return [];

    const errors: string[] = [];

    for (const req of model.requiredParameters) {
      if (!(req in params)) {
        errors.push(`Missing required parameter: "${req}"`);
      }
    }

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

  private findModelsDir(): string {
    const candidates = [
      resolve(process.cwd(), 'models'),
      resolve(import.meta.dirname ?? '', '..', '..', '..', 'models'),
      resolve(import.meta.dirname ?? '', '..', '..', '..', '..', 'models'),
    ];

    for (const dir of candidates) {
      if (existsSync(dir)) return dir;
    }

    return candidates[0]!;
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
