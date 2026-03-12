import { describe, it, expect } from 'vitest';
import { generateModelHelp } from '../model-registry.js';
import type { ModelDefinition } from '../model-registry.js';

function makeDef(overrides?: Partial<ModelDefinition>): ModelDefinition {
  return {
    slug: 'test/image-gen',
    owner: 'test',
    model: 'image-gen',
    name: 'Test Image Generator',
    description: 'A text-to-image generation model.\n\n**Processing Time:** 10 seconds',
    processingTime: '10 seconds',
    category: 'text-to-image',
    parameters: [
      { name: 'prompt', type: 'string', description: 'The prompt to generate', required: true },
      { name: 'width', type: 'integer', description: 'Image width', required: false, default: 1024 },
      { name: 'height', type: 'integer', description: 'Image height', required: false, default: 768 },
      {
        name: 'ratio', type: 'string', description: 'Aspect ratio', required: false,
        options: [
          { value: '16:9', label: 'Widescreen' },
          { value: '9:16', label: 'Portrait' },
          { value: '1:1', label: 'Square' },
        ],
      },
    ],
    requiredParameters: ['prompt'],
    ...overrides,
  };
}

describe('generateModelHelp', () => {
  it('returns all help fields', () => {
    const help = generateModelHelp(makeDef());
    expect(help.summary).toBeDefined();
    expect(help.parametersTable).toBeDefined();
    expect(help.cliUsage).toBeDefined();
    expect(help.mcpUsage).toBeDefined();
    expect(help.sdkUsage).toBeDefined();
    expect(help.quickReference).toBeDefined();
  });

  describe('summary', () => {
    it('includes model name and slug', () => {
      const help = generateModelHelp(makeDef());
      expect(help.summary).toContain('Test Image Generator');
      expect(help.summary).toContain('test/image-gen');
    });

    it('includes processing time', () => {
      const help = generateModelHelp(makeDef());
      expect(help.summary).toContain('Processing Time: ~10 seconds');
    });

    it('includes category', () => {
      const help = generateModelHelp(makeDef());
      expect(help.summary).toContain('Category: text-to-image');
    });

    it('includes parameter count', () => {
      const help = generateModelHelp(makeDef());
      expect(help.summary).toContain('Parameters: 4 total (1 required)');
    });

    it('strips **Processing Time:** from description', () => {
      const help = generateModelHelp(makeDef());
      expect(help.summary).not.toContain('**Processing Time:**');
    });
  });

  describe('parametersTable', () => {
    it('lists all parameters', () => {
      const help = generateModelHelp(makeDef());
      expect(help.parametersTable).toContain('prompt');
      expect(help.parametersTable).toContain('width');
      expect(help.parametersTable).toContain('height');
      expect(help.parametersTable).toContain('ratio');
    });

    it('marks required parameters', () => {
      const help = generateModelHelp(makeDef());
      expect(help.parametersTable).toContain('REQUIRED');
    });

    it('shows default values', () => {
      const help = generateModelHelp(makeDef());
      expect(help.parametersTable).toContain('default: 1024');
    });

    it('truncates long default values', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'prompt', type: 'string', description: 'The prompt', required: true,
            default: 'A very long default prompt that goes on and on and should be truncated for display purposes in the help text',
          },
        ],
        requiredParameters: ['prompt'],
      }));
      expect(help.parametersTable).toContain('...');
    });

    it('shows options (not enum) when both present', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'prompt', type: 'string', description: 'Text', required: true },
          {
            name: 'mode', type: 'string', description: 'Mode', required: false,
            enum: ['a', 'b', 'c'],
            options: [
              { value: 'a', label: 'Alpha' },
              { value: 'b', label: 'Beta' },
              { value: 'c', label: 'Charlie' },
            ],
          },
        ],
        requiredParameters: ['prompt'],
      }));
      // Should contain options values, not duplicated
      const optionsMatches = help.parametersTable.match(/options:/g);
      expect(optionsMatches).toHaveLength(1); // Only one "options:" per parameter
    });
  });

  describe('cliUsage', () => {
    it('includes wiro run command with prompt', () => {
      const help = generateModelHelp(makeDef());
      expect(help.cliUsage).toContain('wiro run test/image-gen -p "A beautiful sunset over mountains"');
    });

    it('includes optional parameter examples', () => {
      const help = generateModelHelp(makeDef());
      expect(help.cliUsage).toContain('# With optional parameters');
    });

    it('includes --no-wait example', () => {
      const help = generateModelHelp(makeDef());
      expect(help.cliUsage).toContain('--no-wait');
    });

    it('includes wiro info reference', () => {
      const help = generateModelHelp(makeDef());
      expect(help.cliUsage).toContain('wiro info test/image-gen');
    });

    it('uses short prompt in examples, not long default', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'prompt', type: 'string', description: 'The prompt', required: true,
            default: 'A super long default prompt value that should not appear in CLI examples',
          },
        ],
        requiredParameters: ['prompt'],
      }));
      expect(help.cliUsage).toContain('A beautiful sunset over mountains');
      expect(help.cliUsage).not.toContain('super long default');
    });
  });

  describe('mcpUsage', () => {
    it('includes tool name', () => {
      const help = generateModelHelp(makeDef());
      expect(help.mcpUsage).toContain('wiro_run_model');
    });

    it('includes model slug', () => {
      const help = generateModelHelp(makeDef());
      expect(help.mcpUsage).toContain('test/image-gen');
    });

    it('includes required params in example', () => {
      const help = generateModelHelp(makeDef());
      expect(help.mcpUsage).toContain('"prompt"');
    });

    it('is valid JSON in the Input section', () => {
      const help = generateModelHelp(makeDef());
      const jsonPart = help.mcpUsage.split('Input:\n')[1]!;
      expect(() => JSON.parse(jsonPart)).not.toThrow();
    });
  });

  describe('sdkUsage', () => {
    it('includes import statement', () => {
      const help = generateModelHelp(makeDef());
      expect(help.sdkUsage).toContain("import { WiroClient } from '@wiroai/sdk'");
    });

    it('includes runModel call', () => {
      const help = generateModelHelp(makeDef());
      expect(help.sdkUsage).toContain("client.runModel('test/image-gen'");
    });

    it('includes waitForTask', () => {
      const help = generateModelHelp(makeDef());
      expect(help.sdkUsage).toContain('waitForTask');
    });
  });

  describe('quickReference', () => {
    it('marks required params with *', () => {
      const help = generateModelHelp(makeDef());
      expect(help.quickReference).toContain('* prompt: string');
    });

    it('shows optional params without *', () => {
      const help = generateModelHelp(makeDef());
      expect(help.quickReference).toMatch(/\s{2}\s width: integer/);
    });

    it('shows default values', () => {
      const help = generateModelHelp(makeDef());
      expect(help.quickReference).toContain('= 1024');
    });

    it('shows choices with pipes', () => {
      const help = generateModelHelp(makeDef());
      expect(help.quickReference).toContain('[16:9|9:16|1:1]');
    });

    it('includes model slug header', () => {
      const help = generateModelHelp(makeDef());
      expect(help.quickReference).toContain('test/image-gen (* = required)');
    });
  });

  describe('shortExample coverage', () => {
    it('uses enum value when options not present', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'style', type: 'string', description: 'Style', required: true, enum: ['cartoon', 'realistic'] },
        ],
        requiredParameters: ['style'],
      }));
      expect(help.cliUsage).toContain('cartoon');
    });

    it('skips empty/null values in enum', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'style', type: 'string', description: 'Style', required: true, enum: ['', null, 'cartoon'] as unknown[] },
        ],
        requiredParameters: ['style'],
      }));
      expect(help.cliUsage).toContain('cartoon');
    });

    it('uses default value for non-prompt params', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'prompt', type: 'string', description: 'The prompt', required: true },
          { name: 'steps', type: 'integer', description: 'Steps', required: false, default: 30 },
        ],
        requiredParameters: ['prompt'],
      }));
      expect(help.cliUsage).toContain('30');
    });

    it('uses placeholder for long default values', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'negative', type: 'string', description: 'Negative prompt', required: true,
            default: 'This is a very long default value that should not be used as an example because it is too long',
          },
        ],
        requiredParameters: ['negative'],
      }));
      expect(help.cliUsage).toContain('<negative>');
    });

    it('uses type-appropriate defaults for number params', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'scale', type: 'number', description: 'Scale', required: true },
        ],
        requiredParameters: ['scale'],
      }));
      expect(help.cliUsage).toContain('1');
    });

    it('uses type-appropriate defaults for boolean params', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'enhance', type: 'boolean', description: 'Enhance', required: true },
        ],
        requiredParameters: ['enhance'],
      }));
      expect(help.cliUsage).toContain('true');
    });

    it('uses placeholder for object type params', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'data', type: 'object', description: 'Data', required: true },
        ],
        requiredParameters: ['data'],
      }));
      expect(help.cliUsage).toContain('<data>');
    });

    it('uses non-empty option value when first option is empty', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'mode', type: 'string', description: 'Mode', required: true,
            options: [{ value: '', label: 'Default' }, { value: 'fast', label: 'Fast' }],
          },
        ],
        requiredParameters: ['mode'],
      }));
      expect(help.cliUsage).toContain('fast');
    });

    it('falls through when all option values are empty', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'mode', type: 'string', description: 'Mode', required: true,
            options: [{ value: '', label: 'Default' }],
          },
        ],
        requiredParameters: ['mode'],
      }));
      // Falls through options check to type default since no non-empty value
      expect(help.cliUsage).toContain('<mode>');
    });

    it('falls through when all enum values are empty or null', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'style', type: 'string', description: 'Style', required: true, enum: ['', null] as unknown[] },
        ],
        requiredParameters: ['style'],
      }));
      expect(help.cliUsage).toContain('<style>');
    });

    it('filters null values from enum in parametersTable', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'style', type: 'string', description: 'Style', required: false, enum: [null, '', 'cartoon', 'photo'] as unknown[] },
        ],
        requiredParameters: [],
      }));
      expect(help.parametersTable).toContain('cartoon');
    });

    it('truncates long description in parametersTable', () => {
      const longDesc = 'A'.repeat(150);
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'p', type: 'string', description: longDesc, required: false },
        ],
        requiredParameters: [],
      }));
      expect(help.parametersTable).toContain('...');
    });

    it('uses label as fallback description', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'x', type: 'string', description: '', required: false, label: 'My Label' },
        ],
        requiredParameters: [],
      }));
      expect(help.parametersTable).toContain('My Label');
    });

    it('uses param name as fallback when no description or label', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'myParam', type: 'string', description: '', required: false },
        ],
        requiredParameters: [],
      }));
      expect(help.parametersTable).toContain('myParam');
    });

    it('truncates long defaults in quickReference', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'neg', type: 'string', description: 'Neg', required: false,
            default: 'A very long default value that exceeds thirty characters for sure',
          },
        ],
        requiredParameters: [],
      }));
      expect(help.quickReference).toContain('...');
    });

    it('filters empty option values from quickReference', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          {
            name: 'mode', type: 'string', description: 'Mode', required: false,
            options: [{ value: '', label: 'None' }, { value: 'fast', label: 'Fast' }],
          },
        ],
        requiredParameters: [],
      }));
      expect(help.quickReference).toContain('[fast]');
    });
  });

  describe('edge cases', () => {
    it('skips callbackUrl in CLI optional examples', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'prompt', type: 'string', description: 'The prompt', required: true },
          { name: 'callbackUrl', type: 'string', description: 'Callback', required: false },
          { name: 'custom', type: 'string', description: 'Custom', required: false },
        ],
        requiredParameters: ['prompt'],
      }));
      expect(help.cliUsage).not.toContain('callbackUrl');
      expect(help.cliUsage).toContain('custom');
    });

    it('handles model with no optional parameters', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'prompt', type: 'string', description: 'The prompt', required: true },
        ],
        requiredParameters: ['prompt'],
      }));
      expect(help.cliUsage).not.toContain('# With optional parameters');
    });

    it('handles model with no required parameters', () => {
      const help = generateModelHelp(makeDef({
        parameters: [
          { name: 'seed', type: 'integer', description: 'Random seed', required: false },
        ],
        requiredParameters: [],
      }));
      expect(help.summary).toContain('0 required');
      // Header contains (* = required), but no param line should start with *
      const paramLines = help.quickReference.split('\n').slice(1);
      for (const line of paramLines) {
        expect(line.trimStart().startsWith('*')).toBe(false);
      }
    });

    it('handles model with no processing time', () => {
      const help = generateModelHelp(makeDef({
        processingTime: undefined,
        description: 'A model without timing info',
      }));
      expect(help.summary).not.toContain('Processing Time');
    });

    it('handles model with no category', () => {
      const help = generateModelHelp(makeDef({ category: undefined }));
      expect(help.summary).not.toContain('Category');
    });
  });
});
