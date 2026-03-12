import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ModelRegistry, getModelRegistry } from '../model-registry.js';

function makeSpecJson(slug: string, properties?: Record<string, unknown>, required?: string[]): string {
  return JSON.stringify({
    paths: {
      [`/Run/${slug}`]: {
        post: {
          summary: `Run ${slug}`,
          description: `Model ${slug} for testing.\n\n**Processing Time:** 5 seconds`,
          requestBody: {
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/RunToolSchema' },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        RunToolSchema: {
          type: 'object',
          properties: properties ?? {
            prompt: { type: 'string', description: 'The prompt' },
          },
          required: required ?? ['prompt'],
        },
      },
    },
  });
}

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `wiro-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
});

describe('ModelRegistry', () => {
  it('constructs with empty directory', () => {
    const registry = new ModelRegistry(testDir);
    expect(registry.getAll()).toEqual([]);
  });

  it('loads spec files from directory', () => {
    writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
    const registry = new ModelRegistry(testDir);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('test/model')).toBeDefined();
    expect(registry.get('test/model')!.name).toBe('Run test/model');
  });

  it('ignores non-openapi files', () => {
    writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
    writeFileSync(join(testDir, 'readme.txt'), 'not a spec');
    writeFileSync(join(testDir, 'other.json'), '{}');
    const registry = new ModelRegistry(testDir);
    expect(registry.getAll()).toHaveLength(1);
  });

  it('ignores malformed JSON files', () => {
    writeFileSync(join(testDir, 'openapi-bad-spec.json'), 'not json at all');
    writeFileSync(join(testDir, 'openapi-good-spec.json'), makeSpecJson('good/spec'));
    const registry = new ModelRegistry(testDir);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('good/spec')).toBeDefined();
  });

  it('creates alias when filename slug differs from spec slug', () => {
    // File: openapi-google-nano-banana-pro.json, spec has /Run/google/nano-banana-2
    writeFileSync(join(testDir, 'openapi-google-nano-banana-pro.json'), makeSpecJson('google/nano-banana-2'));
    const registry = new ModelRegistry(testDir);
    // Accessible by both canonical and alias slug
    expect(registry.get('google/nano-banana-2')).toBeDefined();
    expect(registry.get('google/nano-banana-pro')).toBeDefined();
    expect(registry.has('google/nano-banana-pro')).toBe(true);
  });

  describe('search', () => {
    it('searches by slug', () => {
      writeFileSync(join(testDir, 'openapi-alpha-one.json'), makeSpecJson('alpha/one'));
      writeFileSync(join(testDir, 'openapi-beta-two.json'), makeSpecJson('beta/two'));
      const registry = new ModelRegistry(testDir);
      expect(registry.search('alpha')).toHaveLength(1);
      expect(registry.search('alpha')[0]!.slug).toBe('alpha/one');
    });

    it('searches case-insensitively', () => {
      writeFileSync(join(testDir, 'openapi-Alpha-One.json'), makeSpecJson('Alpha/One'));
      const registry = new ModelRegistry(testDir);
      expect(registry.search('ALPHA')).toHaveLength(1);
    });

    it('returns empty for no matches', () => {
      writeFileSync(join(testDir, 'openapi-alpha-one.json'), makeSpecJson('alpha/one'));
      const registry = new ModelRegistry(testDir);
      expect(registry.search('nonexistent')).toEqual([]);
    });
  });

  describe('filterByCategory', () => {
    it('filters by detected category', () => {
      const imgSpec = JSON.stringify({
        paths: {
          '/Run/img/gen': {
            post: {
              summary: 'Image Gen',
              description: 'A text-to-image model',
              requestBody: {
                content: {
                  'application/json': {
                    schema: { properties: { prompt: { type: 'string', description: 'p' } }, required: ['prompt'] },
                  },
                },
              },
            },
          },
        },
      });
      const vidSpec = JSON.stringify({
        paths: {
          '/Run/vid/gen': {
            post: {
              summary: 'Video Gen',
              description: 'A text-to-video model',
              requestBody: {
                content: {
                  'application/json': {
                    schema: { properties: { prompt: { type: 'string', description: 'p' } }, required: ['prompt'] },
                  },
                },
              },
            },
          },
        },
      });
      writeFileSync(join(testDir, 'openapi-img-gen.json'), imgSpec);
      writeFileSync(join(testDir, 'openapi-vid-gen.json'), vidSpec);
      const registry = new ModelRegistry(testDir);
      expect(registry.filterByCategory('text-to-image')).toHaveLength(1);
      expect(registry.filterByCategory('text-to-video')).toHaveLength(1);
      expect(registry.filterByCategory('llm')).toHaveLength(0);
    });
  });

  describe('saveSpec', () => {
    it('saves spec to disk and registers it', () => {
      const registry = new ModelRegistry(testDir);
      expect(registry.getAll()).toHaveLength(0);

      const spec = JSON.parse(makeSpecJson('new/model'));
      const filepath = registry.saveSpec('new/model', spec);

      expect(existsSync(filepath)).toBe(true);
      expect(registry.get('new/model')).toBeDefined();
      expect(registry.getAll()).toHaveLength(1);
    });

    it('creates alias when save slug differs from spec slug', () => {
      const registry = new ModelRegistry(testDir);
      const spec = JSON.parse(makeSpecJson('canonical/slug'));
      registry.saveSpec('alias/slug', spec);

      expect(registry.get('canonical/slug')).toBeDefined();
      expect(registry.get('alias/slug')).toBeDefined();
    });

    it('creates modelsDir if it does not exist', () => {
      const nestedDir = join(testDir, 'deep', 'nested', 'models');
      const registry = new ModelRegistry(nestedDir);
      const spec = JSON.parse(makeSpecJson('test/model'));
      registry.saveSpec('test/model', spec);
      expect(existsSync(nestedDir)).toBe(true);
    });
  });

  describe('reload', () => {
    it('clears and reloads models from disk', () => {
      writeFileSync(join(testDir, 'openapi-test-one.json'), makeSpecJson('test/one'));
      const registry = new ModelRegistry(testDir);
      expect(registry.getAll()).toHaveLength(1);

      // Add another file to disk
      writeFileSync(join(testDir, 'openapi-test-two.json'), makeSpecJson('test/two'));
      registry.reload();
      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe('validateParams', () => {
    it('returns empty for unknown model', () => {
      const registry = new ModelRegistry(testDir);
      expect(registry.validateParams('unknown/model', { prompt: 'test' })).toEqual([]);
    });

    it('returns error for missing required param', () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
      const registry = new ModelRegistry(testDir);
      const errors = registry.validateParams('test/model', {});
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Missing required parameter');
      expect(errors[0]).toContain('prompt');
    });

    it('returns no errors when all required params provided', () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
      const registry = new ModelRegistry(testDir);
      const errors = registry.validateParams('test/model', { prompt: 'hello' });
      expect(errors).toEqual([]);
    });

    it('returns error for invalid enum value', () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model', {
        prompt: { type: 'string', description: 'The prompt' },
        size: { type: 'string', description: 'Size', enum: ['small', 'large'] },
      }, ['prompt']));
      const registry = new ModelRegistry(testDir);
      const errors = registry.validateParams('test/model', { prompt: 'hello', size: 'huge' });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid value for "size"');
      expect(errors[0]).toContain('huge');
    });

    it('accepts valid enum value', () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model', {
        prompt: { type: 'string', description: 'The prompt' },
        size: { type: 'string', description: 'Size', enum: ['small', 'large'] },
      }, ['prompt']));
      const registry = new ModelRegistry(testDir);
      const errors = registry.validateParams('test/model', { prompt: 'hello', size: 'small' });
      expect(errors).toEqual([]);
    });
  });

  describe('ensureSpec', () => {
    it('returns existing spec without calling client', async () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
      const registry = new ModelRegistry(testDir);

      const mockClient = {
        fetchModelSpec: vi.fn(),
      } as unknown as import('../client.js').WiroClient;

      const def = await registry.ensureSpec(mockClient, 'test/model');
      expect(def).toBeDefined();
      expect(def!.slug).toBe('test/model');
      expect(mockClient.fetchModelSpec).not.toHaveBeenCalled();
    });

    it('fetches and saves spec when not cached', async () => {
      const registry = new ModelRegistry(testDir);
      const specObj = JSON.parse(makeSpecJson('fetched/model'));

      const mockClient = {
        fetchModelSpec: vi.fn().mockResolvedValue(specObj),
      } as unknown as import('../client.js').WiroClient;

      const def = await registry.ensureSpec(mockClient, 'fetched/model');
      expect(def).toBeDefined();
      expect(def!.slug).toBe('fetched/model');
      expect(mockClient.fetchModelSpec).toHaveBeenCalledWith('fetched/model');
      // Verify it was saved to disk
      expect(existsSync(join(testDir, 'openapi-fetched-model.json'))).toBe(true);
    });

    it('returns undefined when fetch fails', async () => {
      const registry = new ModelRegistry(testDir);

      const mockClient = {
        fetchModelSpec: vi.fn().mockRejectedValue(new Error('Network error')),
      } as unknown as import('../client.js').WiroClient;

      const def = await registry.ensureSpec(mockClient, 'failing/model');
      expect(def).toBeUndefined();
    });
  });

  describe('getModelsDir', () => {
    it('returns the models directory', () => {
      const registry = new ModelRegistry(testDir);
      expect(registry.getModelsDir()).toBe(testDir);
    });
  });

  describe('has', () => {
    it('returns false for non-existent model', () => {
      const registry = new ModelRegistry(testDir);
      expect(registry.has('nonexistent/model')).toBe(false);
    });

    it('returns true for existing model', () => {
      writeFileSync(join(testDir, 'openapi-test-model.json'), makeSpecJson('test/model'));
      const registry = new ModelRegistry(testDir);
      expect(registry.has('test/model')).toBe(true);
    });
  });

  describe('non-existent modelsDir', () => {
    it('constructs with non-existent directory without error', () => {
      const registry = new ModelRegistry(join(testDir, 'nonexistent'));
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('.txt spec files', () => {
    it('loads .txt spec files', () => {
      writeFileSync(join(testDir, 'openapi-test-model.txt'), makeSpecJson('test/model'));
      const registry = new ModelRegistry(testDir);
      expect(registry.get('test/model')).toBeDefined();
    });
  });

  describe('filename without dash', () => {
    it('does not create alias for filename with no dash', () => {
      // Filename: openapi-singleword.json (no dash after openapi-)
      // This results in dashIdx being -1 in the base "singleword"
      // But the spec itself needs a valid slug with /
      const specContent = JSON.stringify({
        paths: {
          '/Run/single/word': {
            post: {
              summary: 'Test',
              description: 'test',
              requestBody: {
                content: { 'application/json': { schema: { properties: {}, required: [] } } },
              },
            },
          },
        },
      });
      writeFileSync(join(testDir, 'openapi-singleword.json'), specContent);
      const registry = new ModelRegistry(testDir);
      expect(registry.get('single/word')).toBeDefined();
    });
  });

  describe('saveSpec with unparseable spec', () => {
    it('saves file but does not register if spec is not parseable', () => {
      const registry = new ModelRegistry(testDir);
      const filepath = registry.saveSpec('bad/model', { notAValidSpec: true });
      expect(existsSync(filepath)).toBe(true);
      expect(registry.get('bad/model')).toBeUndefined();
    });
  });

  describe('get with alias resolution', () => {
    it('returns undefined for non-existent alias', () => {
      const registry = new ModelRegistry(testDir);
      expect(registry.get('nonexistent/alias')).toBeUndefined();
    });
  });
});

describe('getModelRegistry', () => {
  it('returns a ModelRegistry instance and caches it', () => {
    const registry1 = getModelRegistry(testDir);
    expect(registry1).toBeInstanceOf(ModelRegistry);
    // Second call returns same cached instance (covers the else branch)
    const registry2 = getModelRegistry(testDir);
    expect(registry2).toBe(registry1);
  });
});

describe('ModelRegistry default constructor', () => {
  it('constructs without modelsDir argument (uses findModelsDir)', () => {
    // This exercises the findModelsDir private method
    const registry = new ModelRegistry();
    expect(registry.getModelsDir()).toBeDefined();
    expect(typeof registry.getModelsDir()).toBe('string');
  });
});
