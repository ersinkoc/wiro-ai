import { describe, it, expect } from 'vitest';
import { parseOpenApiSpec } from '../model-registry.js';

// Minimal valid OpenAPI spec for testing
function makeSpec(overrides?: {
  slug?: string;
  summary?: string;
  description?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  useRef?: boolean;
}): Record<string, unknown> {
  const slug = overrides?.slug ?? 'testowner/testmodel';
  const props = overrides?.properties ?? {
    prompt: { type: 'string', description: 'The prompt', title: 'Prompt' },
  };
  const required = overrides?.required ?? ['prompt'];

  if (overrides?.useRef !== false) {
    return {
      paths: {
        [`/Run/${slug}`]: {
          post: {
            summary: overrides?.summary ?? 'Test Model',
            description: overrides?.description ?? 'A test model for unit testing.',
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
            properties: props,
            required,
          },
        },
      },
    };
  }

  // Inline schema (no $ref)
  return {
    paths: {
      [`/Run/${slug}`]: {
        post: {
          summary: overrides?.summary ?? 'Test Model',
          description: overrides?.description ?? 'A test model.',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  properties: props,
                  required,
                },
              },
            },
          },
        },
      },
    },
  };
}

describe('parseOpenApiSpec', () => {
  it('returns null for empty object', () => {
    expect(parseOpenApiSpec({})).toBeNull();
  });

  it('returns null for missing paths', () => {
    expect(parseOpenApiSpec({ paths: {} })).toBeNull();
  });

  it('returns null for paths without /Run/', () => {
    expect(parseOpenApiSpec({ paths: { '/Task/Detail': {} } })).toBeNull();
  });

  it('returns null for /Run/ path without post', () => {
    expect(parseOpenApiSpec({ paths: { '/Run/owner/model': { get: {} } } })).toBeNull();
  });

  it('returns null for /Run/ path with invalid slug (no owner)', () => {
    expect(parseOpenApiSpec({
      paths: { '/Run/noowner': { post: { summary: 'x', description: 'y' } } },
    })).toBeNull();
  });

  it('parses a basic spec with $ref schema', () => {
    const result = parseOpenApiSpec(makeSpec());
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('testowner/testmodel');
    expect(result!.owner).toBe('testowner');
    expect(result!.model).toBe('testmodel');
    expect(result!.name).toBe('Test Model');
    expect(result!.parameters).toHaveLength(1);
    expect(result!.parameters[0]!.name).toBe('prompt');
    expect(result!.parameters[0]!.required).toBe(true);
    expect(result!.requiredParameters).toEqual(['prompt']);
  });

  it('parses inline schema (no $ref)', () => {
    const result = parseOpenApiSpec(makeSpec({ useRef: false }));
    expect(result).not.toBeNull();
    expect(result!.parameters).toHaveLength(1);
    expect(result!.parameters[0]!.name).toBe('prompt');
  });

  it('extracts processing time from description', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'Image model.\n\n**Processing Time:** 10 seconds',
    }));
    expect(result!.processingTime).toBe('10 seconds');
  });

  it('skips callbackUrl parameter', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        prompt: { type: 'string', description: 'The prompt' },
        callbackUrl: { type: 'string', description: 'Webhook URL' },
      },
      required: ['prompt'],
    }));
    expect(result!.parameters).toHaveLength(1);
    expect(result!.parameters[0]!.name).toBe('prompt');
    expect(result!.requiredParameters).toEqual(['prompt']);
  });

  it('parses enum values', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        prompt: { type: 'string', description: 'Text' },
        size: { type: 'string', description: 'Size', enum: ['small', 'medium', 'large'] },
      },
      required: ['prompt'],
    }));
    const sizeParam = result!.parameters.find(p => p.name === 'size');
    expect(sizeParam!.enum).toEqual(['small', 'medium', 'large']);
    expect(sizeParam!.required).toBe(false);
  });

  it('parses default values', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        prompt: { type: 'string', description: 'Text' },
        steps: { type: 'integer', description: 'Steps', default: 25 },
      },
      required: ['prompt'],
    }));
    const stepsParam = result!.parameters.find(p => p.name === 'steps');
    expect(stepsParam!.default).toBe(25);
    expect(stepsParam!.type).toBe('integer');
  });

  it('parses x-input-type, x-label, x-help, x-options', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        prompt: { type: 'string', description: 'Text' },
        ratio: {
          type: 'string',
          description: 'Aspect ratio',
          'x-input-type': 'select',
          'x-label': 'Aspect Ratio',
          'x-help': 'Choose the output ratio',
          'x-options': [
            { value: '16:9', label: 'Widescreen' },
            { value: '9:16', label: 'Portrait' },
          ],
        },
      },
      required: ['prompt'],
    }));
    const ratioParam = result!.parameters.find(p => p.name === 'ratio');
    expect(ratioParam!.inputType).toBe('select');
    expect(ratioParam!.label).toBe('Aspect Ratio');
    expect(ratioParam!.help).toBe('Choose the output ratio');
    expect(ratioParam!.options).toHaveLength(2);
    expect(ratioParam!.options![0]!.value).toBe('16:9');
  });

  it('detects category from description - text-to-image', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A text-to-image generation model',
    }));
    expect(result!.category).toBe('text-to-image');
  });

  it('detects category from description - text-to-video', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A text-to-video generation model',
    }));
    expect(result!.category).toBe('text-to-video');
  });

  it('detects category from description - image editing', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'An image editing tool',
    }));
    expect(result!.category).toBe('image-editing');
  });

  it('detects category from description - llm', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A chat and language model',
    }));
    expect(result!.category).toBe('llm');
  });

  it('detects category from description - text-to-speech', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A text-to-speech TTS model',
    }));
    expect(result!.category).toBe('text-to-speech');
  });

  it('detects category from description - realtime', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A realtime voice agent',
    }));
    expect(result!.category).toBe('realtime-conversation');
  });

  it('returns undefined category for unrecognized descriptions', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'An obscure model',
    }));
    expect(result!.category).toBeUndefined();
  });

  it('handles nested model slug (owner/multi/part)', () => {
    const result = parseOpenApiSpec(makeSpec({ slug: 'google/gemini/pro' }));
    expect(result!.slug).toBe('google/gemini/pro');
    expect(result!.owner).toBe('google');
    expect(result!.model).toBe('gemini/pro');
  });

  it('falls back to slug when summary is missing', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            description: 'A test model',
            requestBody: {
              content: { 'application/json': { schema: { properties: {}, required: [] } } },
            },
          },
        },
      },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.name).toBe('test/model');
  });

  it('falls back to empty description when missing', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            requestBody: {
              content: { 'application/json': { schema: { properties: {}, required: [] } } },
            },
          },
        },
      },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.description).toBe('');
  });

  it('falls back to string type when type is missing', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        noType: { description: 'No type specified' },
      },
      required: [],
    }));
    expect(result!.parameters[0]!.type).toBe('string');
  });

  it('falls back to title when description is missing on param', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        myParam: { type: 'string', title: 'My Parameter' },
      },
      required: [],
    }));
    expect(result!.parameters[0]!.description).toBe('My Parameter');
  });

  it('falls back to param name when both description and title are missing', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        myParam: { type: 'string' },
      },
      required: [],
    }));
    expect(result!.parameters[0]!.description).toBe('myParam');
  });

  it('uses title as label when x-label is missing', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        myParam: { type: 'string', title: 'Param Title', description: 'desc' },
      },
      required: [],
    }));
    expect(result!.parameters[0]!.label).toBe('Param Title');
  });

  it('label is undefined when both x-label and title missing', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        myParam: { type: 'string', description: 'desc' },
      },
      required: [],
    }));
    expect(result!.parameters[0]!.label).toBeUndefined();
  });

  it('handles spec with no requestBody', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            description: 'A text-to-image model',
          },
        },
      },
    };
    const result = parseOpenApiSpec(spec);
    expect(result).not.toBeNull();
    expect(result!.parameters).toEqual([]);
  });

  it('handles $ref that resolves to null', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            description: 'desc',
            requestBody: {
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/NonExistent' },
                },
              },
            },
          },
        },
      },
      components: { schemas: {} },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.parameters).toEqual([]);
  });

  it('handles $ref schema without properties or required', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            description: 'desc',
            requestBody: {
              content: {
                'application/json': {
                  schema: { '$ref': '#/components/schemas/EmptySchema' },
                },
              },
            },
          },
        },
      },
      components: { schemas: { EmptySchema: { type: 'object' } } },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.parameters).toEqual([]);
    expect(result!.requiredParameters).toEqual([]);
  });

  it('handles inline schema without required field', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            description: 'desc',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    properties: { prompt: { type: 'string', description: 'p' } },
                  },
                },
              },
            },
          },
        },
      },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.parameters).toHaveLength(1);
    expect(result!.requiredParameters).toEqual([]);
  });

  it('detects video generation category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A video generation tool',
    }));
    expect(result!.category).toBe('text-to-video');
  });

  it('detects image generation category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'An image generation model',
    }));
    expect(result!.category).toBe('text-to-image');
  });

  it('detects image-to-image category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'An image-to-image editing model',
    }));
    expect(result!.category).toBe('image-editing');
  });

  it('detects tts category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A TTS model for speech',
    }));
    expect(result!.category).toBe('text-to-speech');
  });

  it('detects voice category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A voice assistant model',
    }));
    expect(result!.category).toBe('realtime-conversation');
  });

  it('detects language model category', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A language model for reasoning',
    }));
    expect(result!.category).toBe('llm');
  });

  it('filters callbackUrl from requiredParameters', () => {
    const result = parseOpenApiSpec(makeSpec({
      properties: {
        prompt: { type: 'string', description: 'p' },
        callbackUrl: { type: 'string', description: 'cb' },
      },
      required: ['prompt', 'callbackUrl'],
    }));
    expect(result!.requiredParameters).toEqual(['prompt']);
  });

  it('handles no processing time match', () => {
    const result = parseOpenApiSpec(makeSpec({
      description: 'A simple model with no timing info',
    }));
    expect(result!.processingTime).toBeUndefined();
  });

  it('uses example category from TaskObject schema', () => {
    const spec = {
      paths: {
        '/Run/test/model': {
          post: {
            summary: 'Test',
            description: 'A model',
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
      components: {
        schemas: {
          TaskObject: {
            properties: {
              categories: {
                example: ['custom-category'],
              },
            },
          },
        },
      },
    };
    const result = parseOpenApiSpec(spec);
    expect(result!.category).toBe('custom-category');
  });
});
