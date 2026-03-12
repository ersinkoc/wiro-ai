import { describe, it, expect } from 'vitest';
import { formatTaskResult, formatTaskItem, formatModelList, formatModelDefinition } from '../utils/format.js';
import type { TaskResult, TaskItem, ModelDefinition } from '@wiroai/sdk';

describe('formatTaskResult', () => {
  const baseResult: TaskResult = {
    id: '12345',
    status: 'task_postprocess_end',
    outputs: [],
    createdAt: '1700000000',
    elapsedSeconds: '25.0000',
    modelDescription: 'test-model',
  };

  it('includes task id', () => {
    expect(formatTaskResult(baseResult)).toContain('12345');
  });

  it('includes status', () => {
    expect(formatTaskResult(baseResult)).toContain('task_postprocess_end');
  });

  it('includes elapsed time', () => {
    expect(formatTaskResult(baseResult)).toContain('25.0000s');
  });

  it('skips elapsed time when 0', () => {
    const result = { ...baseResult, elapsedSeconds: '0' };
    expect(formatTaskResult(result)).not.toContain('Elapsed');
  });

  it('shows output files', () => {
    const result: TaskResult = {
      ...baseResult,
      outputs: [
        { id: 'f1', name: 'image.png', contenttype: 'image/png', size: '204800', url: 'https://cdn.example.com/image.png', accesskey: 'key1' },
      ],
    };
    const text = formatTaskResult(result);
    expect(text).toContain('Output Files');
    expect(text).toContain('image.png');
    expect(text).toContain('image/png');
    expect(text).toContain('200.0KB');
  });
});

describe('formatTaskItem', () => {
  const baseTask = {
    id: '99',
    uuid: 'uuid-123',
    socketaccesstoken: 'token-abc',
    parameters: {},
    status: 'task_start' as const,
    outputs: [],
    size: '0',
    createtime: '1700000000',
    starttime: '1700000001',
    endtime: '',
    elapsedseconds: '10.0000',
    totalcost: '0.05',
    cps: '0.001',
    modeldescription: 'test',
    modelslugowner: 'google',
    modelslugproject: 'nano-banana-pro',
    categories: [],
  } satisfies TaskItem;

  it('includes model slug', () => {
    expect(formatTaskItem(baseTask)).toContain('google/nano-banana-pro');
  });

  it('includes status', () => {
    expect(formatTaskItem(baseTask)).toContain('task_start');
  });
});

describe('formatModelList', () => {
  it('groups models by category', () => {
    const models = [
      { slug: 'a/img', name: 'ImageModel', category: 'text-to-image' },
      { slug: 'b/vid', name: 'VideoModel', category: 'text-to-video' },
      { slug: 'c/img2', name: 'ImageModel2', category: 'text-to-image' },
    ];
    const text = formatModelList(models);
    expect(text).toContain('### text-to-image');
    expect(text).toContain('### text-to-video');
    expect(text).toContain('ImageModel');
    expect(text).toContain('VideoModel');
  });
});

describe('formatTaskItem with outputs', () => {
  it('shows output files when present', () => {
    const task = {
      id: '50',
      uuid: 'uuid-50',
      socketaccesstoken: 'token',
      parameters: {},
      status: 'task_postprocess_end' as const,
      outputs: [
        { id: 'f1', name: 'video.mp4', contenttype: 'video/mp4', size: '2097152', url: 'https://cdn.example.com/video.mp4', accesskey: '' },
      ],
      size: '0',
      createtime: '1700000000',
      starttime: '1700000001',
      endtime: '1700000010',
      elapsedseconds: '9.0000',
      totalcost: '0.10',
      cps: '0.01',
      modeldescription: 'test',
      modelslugowner: 'owner',
      modelslugproject: 'model',
      categories: [],
    } satisfies TaskItem;

    const text = formatTaskItem(task);
    expect(text).toContain('Output Files');
    expect(text).toContain('video.mp4');
    expect(text).toContain('2.0MB');
  });

  it('does not show output section when empty', () => {
    const task = {
      id: '51',
      uuid: 'uuid-51',
      socketaccesstoken: 'token',
      parameters: {},
      status: 'task_start' as const,
      outputs: [],
      size: '0',
      createtime: '1700000000',
      starttime: '1700000001',
      endtime: '',
      elapsedseconds: '0',
      totalcost: '0',
      cps: '0',
      modeldescription: 'test',
      modelslugowner: 'owner',
      modelslugproject: 'model',
      categories: [],
    } satisfies TaskItem;

    const text = formatTaskItem(task);
    expect(text).not.toContain('Output Files');
  });

  it('formats bytes-level file size', () => {
    const task = {
      id: '52',
      uuid: 'uuid-52',
      socketaccesstoken: 'token',
      parameters: {},
      status: 'task_postprocess_end' as const,
      outputs: [
        { id: 'f1', name: 'tiny.txt', contenttype: 'text/plain', size: '512', url: 'https://cdn.example.com/tiny.txt', accesskey: '' },
      ],
      size: '0',
      createtime: '1700000000',
      starttime: '1700000001',
      endtime: '1700000002',
      elapsedseconds: '1',
      totalcost: '0',
      cps: '0',
      modeldescription: 'test',
      modelslugowner: 'owner',
      modelslugproject: 'model',
      categories: [],
    } satisfies TaskItem;

    const text = formatTaskItem(task);
    expect(text).toContain('512B');
  });

  it('handles non-numeric file size', () => {
    const result: TaskResult = {
      id: '53',
      status: 'task_postprocess_end',
      outputs: [
        { id: 'f1', name: 'file.bin', contenttype: 'application/octet-stream', size: 'unknown', url: 'https://cdn.example.com/file.bin', accesskey: '' },
      ],
      createdAt: '1700000000',
      elapsedSeconds: '1',
      modelDescription: 'test',
    };
    const text = formatTaskResult(result);
    expect(text).toContain('unknown');
  });
});

describe('formatModelDefinition', () => {
  const def: ModelDefinition = {
    slug: 'test/model',
    owner: 'test',
    model: 'model',
    name: 'Test Model',
    description: 'A test model.',
    processingTime: '5 seconds',
    category: 'text-to-image',
    parameters: [
      { name: 'prompt', type: 'string', description: 'The prompt', required: true },
      { name: 'size', type: 'string', description: 'Size', required: false, enum: ['small', 'large'] },
      {
        name: 'ratio', type: 'string', description: 'Ratio', required: false,
        options: [{ value: '16:9', label: 'Wide' }, { value: '9:16', label: 'Tall' }],
      },
    ],
    requiredParameters: ['prompt'],
  };

  it('includes model name and slug', () => {
    const text = formatModelDefinition(def);
    expect(text).toContain('test/model');
    expect(text).toContain('Test Model');
  });

  it('includes processing time', () => {
    expect(formatModelDefinition(def)).toContain('5 seconds');
  });

  it('includes markdown table headers', () => {
    const text = formatModelDefinition(def);
    expect(text).toContain('| Parameter |');
    expect(text).toContain('| Type |');
  });

  it('marks required params', () => {
    expect(formatModelDefinition(def)).toContain('Yes');
  });

  it('prefers options over enum (no duplicate)', () => {
    const text = formatModelDefinition(def);
    // "ratio" has options, should show those, not both
    const ratioLine = text.split('\n').find(l => l.includes('ratio'));
    expect(ratioLine).toBeDefined();
    expect(ratioLine).toContain('16:9');
    // enum field "size" should show its enum options
    const sizeLine = text.split('\n').find(l => l.includes('size'));
    expect(sizeLine).toContain('small');
  });

  it('omits processing time when not present', () => {
    const defNoTime: ModelDefinition = {
      ...def,
      processingTime: undefined,
    };
    const text = formatModelDefinition(defNoTime);
    expect(text).not.toContain('Processing Time');
  });

  it('shows dash for undefined default', () => {
    const defNoDef: ModelDefinition = {
      ...def,
      parameters: [
        { name: 'prompt', type: 'string', description: 'The prompt', required: true },
      ],
    };
    const text = formatModelDefinition(defNoDef);
    expect(text).toContain('—');
  });

  it('truncates long default values', () => {
    const defWithLongDefault: ModelDefinition = {
      ...def,
      parameters: [
        {
          name: 'prompt', type: 'string', description: 'The prompt', required: true,
          default: 'A very long default value that exceeds the truncation limit and should be cut off',
        },
      ],
    };
    const text = formatModelDefinition(defWithLongDefault);
    expect(text).toContain('...');
  });
});
