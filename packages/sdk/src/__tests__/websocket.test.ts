import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectTaskWebSocket } from '../websocket.js';

type EventHandler = (event: unknown) => void;

function createMockWebSocket() {
  const handlers: Record<string, EventHandler> = {};
  const mockInstance = {
    addEventListener: vi.fn((event: string, handler: EventHandler) => {
      handlers[event] = handler;
    }),
    send: vi.fn(),
    close: vi.fn(),
  };

  // Create a constructable class that returns our mock instance
  class MockWebSocket {
    addEventListener = mockInstance.addEventListener;
    send = mockInstance.send;
    close = mockInstance.close;
    constructor() {
      // Copy methods to the instance returned by the constructor
      Object.assign(this, mockInstance);
    }
  }

  return { mockInstance, handlers, MockWebSocket };
}

describe('connectTaskWebSocket', () => {
  let originalWS: unknown;

  beforeEach(() => {
    originalWS = (globalThis as Record<string, unknown>).WebSocket;
  });

  afterEach(() => {
    if (originalWS !== undefined) {
      (globalThis as Record<string, unknown>).WebSocket = originalWS;
    } else {
      delete (globalThis as Record<string, unknown>).WebSocket;
    }
  });

  it('creates a WebSocket and returns a close function', () => {
    const { MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const close = connectTaskWebSocket('token', {});
    expect(typeof close).toBe('function');
  });

  it('sends task_info on open', () => {
    const { mockInstance, handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    connectTaskWebSocket('my-token', {});
    handlers['open']!({});
    expect(mockInstance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'task_info', tasktoken: 'my-token' }),
    );
  });

  it('calls onQueued for task_queue messages', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onQueued = vi.fn();
    connectTaskWebSocket('token', { onQueued });
    handlers['message']!({ data: JSON.stringify({ type: 'task_queue' }) });
    expect(onQueued).toHaveBeenCalled();
  });

  it('calls onProcessing for processing-type messages', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onProcessing = vi.fn();
    connectTaskWebSocket('token', { onProcessing });

    const processingTypes = [
      'task_processing', 'task_accept', 'task_assign',
      'task_start', 'task_preprocess_start', 'task_preprocess_end', 'task_output',
    ];
    for (const type of processingTypes) {
      handlers['message']!({ data: JSON.stringify({ type }) });
    }
    expect(onProcessing).toHaveBeenCalledTimes(processingTypes.length);
  });

  it('calls onCompleted for task_completed', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onCompleted = vi.fn();
    const outputs = [{ id: '1', name: 'out.png', contenttype: 'image/png', size: '100', url: 'http://example.com', accesskey: '' }];
    connectTaskWebSocket('token', { onCompleted });
    handlers['message']!({ data: JSON.stringify({ type: 'task_completed', outputs }) });
    expect(onCompleted).toHaveBeenCalledWith(outputs);
  });

  it('calls onCompleted for task_postprocess_end', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onCompleted = vi.fn();
    connectTaskWebSocket('token', { onCompleted });
    handlers['message']!({ data: JSON.stringify({ type: 'task_postprocess_end' }) });
    expect(onCompleted).toHaveBeenCalledWith([]);
  });

  it('calls onFailed for task_failed', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onFailed = vi.fn();
    connectTaskWebSocket('token', { onFailed });
    handlers['message']!({ data: JSON.stringify({ type: 'task_failed', error: 'GPU OOM' }) });
    expect(onFailed).toHaveBeenCalledWith('GPU OOM');
  });

  it('calls onFailed for task_cancel with default message', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onFailed = vi.fn();
    connectTaskWebSocket('token', { onFailed });
    handlers['message']!({ data: JSON.stringify({ type: 'task_cancel' }) });
    expect(onFailed).toHaveBeenCalledWith('Task cancelled or failed');
  });

  it('calls onError when message parsing fails', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onError = vi.fn();
    connectTaskWebSocket('token', { onError });
    handlers['message']!({ data: 'not valid json{' });
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('calls onError on WebSocket error event', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const onError = vi.fn();
    connectTaskWebSocket('token', { onError });
    handlers['error']!({ type: 'error' });
    expect(onError).toHaveBeenCalled();
  });

  it('close function calls ws.close', () => {
    const { mockInstance, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const close = connectTaskWebSocket('token', {});
    close();
    expect(mockInstance.close).toHaveBeenCalled();
  });

  it('calling close twice does not call ws.close twice', () => {
    const { mockInstance, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const close = connectTaskWebSocket('token', {});
    close();
    close();
    expect(mockInstance.close).toHaveBeenCalledTimes(1);
  });

  it('close after WebSocket close event does not call ws.close', () => {
    const { mockInstance, handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    const close = connectTaskWebSocket('token', {});
    handlers['close']!({});
    close();
    expect(mockInstance.close).not.toHaveBeenCalled();
  });

  it('works with no callbacks defined', () => {
    const { handlers, MockWebSocket } = createMockWebSocket();
    (globalThis as Record<string, unknown>).WebSocket = MockWebSocket;
    connectTaskWebSocket('token', {});
    // These should not throw even with empty callbacks
    handlers['message']!({ data: JSON.stringify({ type: 'task_queue' }) });
    handlers['message']!({ data: JSON.stringify({ type: 'task_processing' }) });
    handlers['message']!({ data: JSON.stringify({ type: 'task_completed' }) });
    handlers['message']!({ data: JSON.stringify({ type: 'task_failed' }) });
    handlers['error']!({});
  });
});
