import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WiroClient } from '../client.js';
import { WiroAuthError, WiroValidationError, WiroApiError, WiroTimeoutError } from '../errors.js';

function mockFetchResponse(status: number, body: unknown, ok?: boolean) {
  return vi.fn().mockResolvedValue({
    status,
    ok: ok ?? (status >= 200 && status < 300),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

describe('WiroClient', () => {
  const validConfig = { apiKey: 'key', apiSecret: 'secret' };

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchResponse(200, {}));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Constructor tests
  it('throws WiroAuthError when apiKey is missing', () => {
    expect(() => new WiroClient({ apiKey: '', apiSecret: 'secret' })).toThrow(WiroAuthError);
  });

  it('throws WiroAuthError when apiSecret is missing', () => {
    expect(() => new WiroClient({ apiKey: 'key', apiSecret: '' })).toThrow(WiroAuthError);
  });

  it('constructs successfully with valid credentials', () => {
    const client = new WiroClient(validConfig);
    expect(client).toBeDefined();
  });

  it('uses custom baseUrl when provided', async () => {
    const fetchMock = mockFetchResponse(200, { tasklist: [{ id: '1', status: 'task_postprocess_end', outputs: [], createtime: '0', elapsedseconds: '0', modeldescription: '' }] });
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient({ ...validConfig, baseUrl: 'https://custom.api.com' });
    await client.getTaskDetail('token');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('https://custom.api.com'), expect.anything());
  });

  // runModel tests
  it('throws WiroValidationError for invalid model slug in runModel', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.runModel('noowner', {})).rejects.toThrow(WiroValidationError);
  });

  it('throws WiroValidationError for empty model slug', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.runModel('', {})).rejects.toThrow(WiroValidationError);
  });

  it('calls fetch with correct URL for runModel', async () => {
    const fetchMock = mockFetchResponse(200, { id: '123', socketaccesstoken: 'tok' });
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient(validConfig);
    await client.runModel('owner/model', { prompt: 'test' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/Run/owner/model'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws WiroApiError when runModel returns errors', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, { errors: [{ message: 'bad param' }] }));
    const client = new WiroClient(validConfig);
    await expect(client.runModel('owner/model', {})).rejects.toThrow(WiroApiError);
  });

  it('returns result when runModel succeeds with no errors', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, { id: '123', socketaccesstoken: 'tok' }));
    const client = new WiroClient(validConfig);
    const result = await client.runModel('owner/model', { prompt: 'test' });
    expect(result.id).toBe('123');
  });

  // Auth error responses
  it('throws WiroAuthError on 401 response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(401, 'Unauthorized', false));
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetail('token')).rejects.toThrow(WiroAuthError);
  });

  it('throws WiroAuthError on 403 response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(403, 'Forbidden', false));
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetail('token')).rejects.toThrow(WiroAuthError);
  });

  // Non-ok responses
  it('throws WiroApiError on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(500, 'Internal Server Error', false));
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetail('token')).rejects.toThrow(WiroApiError);
  });

  // Invalid JSON response
  it('throws WiroApiError on invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('not-json{'),
    }));
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetail('token')).rejects.toThrow(WiroApiError);
  });

  // getTaskDetail
  it('throws WiroValidationError for empty task token', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetail('')).rejects.toThrow(WiroValidationError);
  });

  it('returns task detail on success', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, { tasklist: [{ id: '1' }] }));
    const client = new WiroClient(validConfig);
    const result = await client.getTaskDetail('token');
    expect(result.tasklist[0].id).toBe('1');
  });

  // getTaskDetailById
  it('throws WiroValidationError for empty task id in getTaskDetailById', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.getTaskDetailById('')).rejects.toThrow(WiroValidationError);
  });

  it('calls taskDetail endpoint with taskid', async () => {
    const fetchMock = mockFetchResponse(200, { tasklist: [] });
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient(validConfig);
    await client.getTaskDetailById('task-123');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.taskid).toBe('task-123');
  });

  // killTask
  it('throws WiroValidationError for empty task id in kill', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.killTask('')).rejects.toThrow(WiroValidationError);
  });

  it('calls taskKill endpoint', async () => {
    const fetchMock = mockFetchResponse(200, { tasklist: [] });
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient(validConfig);
    await client.killTask('task-123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/Task/Kill'),
      expect.anything(),
    );
  });

  // cancelTask
  it('throws WiroValidationError for empty task id in cancel', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.cancelTask('')).rejects.toThrow(WiroValidationError);
  });

  it('calls taskCancel endpoint', async () => {
    const fetchMock = mockFetchResponse(200, { tasklist: [] });
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient(validConfig);
    await client.cancelTask('task-123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/Task/Cancel'),
      expect.anything(),
    );
  });

  // waitForTask
  it('waitForTask uses default options when none provided', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, {
      tasklist: [{
        id: '1',
        status: 'task_postprocess_end',
        outputs: [],
        createtime: '0',
        elapsedseconds: '1',
        modeldescription: 'test',
      }],
    }));
    const client = new WiroClient(validConfig);
    // No options - defaults will be used, but task completes immediately
    const result = await client.waitForTask('token');
    expect(result.id).toBe('1');
  });

  it('returns result when task completes', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, {
      tasklist: [{
        id: '1',
        status: 'task_postprocess_end',
        outputs: [],
        createtime: '1700000000',
        elapsedseconds: '10',
        modeldescription: 'test',
      }],
    }));
    const client = new WiroClient(validConfig);
    const result = await client.waitForTask('token', { timeoutSeconds: 5 });
    expect(result.id).toBe('1');
    expect(result.status).toBe('task_postprocess_end');
  });

  it('polls until task completes', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      const status = callCount >= 2 ? 'task_postprocess_end' : 'task_processing';
      return Promise.resolve({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          tasklist: [{
            id: '1',
            status,
            outputs: [],
            createtime: '0',
            elapsedseconds: '5',
            modeldescription: 'test',
          }],
        })),
      });
    }));
    const client = new WiroClient(validConfig);
    const result = await client.waitForTask('token', { timeoutSeconds: 10, pollIntervalSeconds: 0.01 });
    expect(result.status).toBe('task_postprocess_end');
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('throws WiroTimeoutError when task does not complete in time', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, {
      tasklist: [{
        id: '1',
        status: 'task_processing',
        outputs: [],
        createtime: '0',
        elapsedseconds: '0',
        modeldescription: 'test',
      }],
    }));
    const client = new WiroClient(validConfig);
    await expect(
      client.waitForTask('token', { timeoutSeconds: 0.05, pollIntervalSeconds: 0.01 }),
    ).rejects.toThrow(WiroTimeoutError);
  });

  it('handles empty tasklist in waitForTask', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount >= 3) {
        return Promise.resolve({
          status: 200,
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            tasklist: [{
              id: '1',
              status: 'task_postprocess_end',
              outputs: [],
              createtime: '0',
              elapsedseconds: '0',
              modeldescription: 'test',
            }],
          })),
        });
      }
      return Promise.resolve({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ tasklist: [] })),
      });
    }));
    const client = new WiroClient(validConfig);
    const result = await client.waitForTask('token', { timeoutSeconds: 5, pollIntervalSeconds: 0.01 });
    expect(result.id).toBe('1');
  });

  // fetchModelSpec
  it('throws WiroValidationError for invalid model in fetchModelSpec', async () => {
    const client = new WiroClient(validConfig);
    await expect(client.fetchModelSpec('noowner')).rejects.toThrow(WiroValidationError);
  });

  it('returns spec from signature type', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, [
      { type: 'bearer', spec: { paths: { '/Run/o/m': {} } } },
      { type: 'signature', spec: { paths: { '/Run/o/m': {} }, info: { title: 'sig' } } },
    ]));
    const client = new WiroClient(validConfig);
    const spec = await client.fetchModelSpec('owner/model');
    expect(spec).toHaveProperty('info');
  });

  it('falls back to first spec when no signature type', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, [
      { type: 'bearer', spec: { paths: { '/Run/o/m': {} }, fallback: true } },
    ]));
    const client = new WiroClient(validConfig);
    const spec = await client.fetchModelSpec('owner/model');
    expect(spec).toHaveProperty('fallback', true);
  });

  it('throws WiroApiError when no spec found', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(200, []));
    const client = new WiroClient(validConfig);
    await expect(client.fetchModelSpec('owner/model')).rejects.toThrow(WiroApiError);
  });

  it('handles nested model slugs in fetchModelSpec', async () => {
    const fetchMock = mockFetchResponse(200, [
      { type: 'signature', spec: { paths: {} } },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    const client = new WiroClient(validConfig);
    await client.fetchModelSpec('owner/nested/model');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.slugowner).toBe('owner');
    expect(body.slugproject).toBe('nested/model');
  });

  // connectTaskWebSocket
  it('delegates to connectTaskWebSocket', () => {
    // Mock WebSocket globally with a constructable class
    class MockWebSocket {
      addEventListener = vi.fn();
      send = vi.fn();
      close = vi.fn();
    }
    vi.stubGlobal('WebSocket', MockWebSocket);
    const client = new WiroClient(validConfig);
    const close = client.connectTaskWebSocket('token', {});
    expect(typeof close).toBe('function');
  });
});
