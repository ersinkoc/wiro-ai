import { WEBSOCKET_URL } from './constants.js';
import type { TaskCallbacks, OutputFile } from './types.js';

interface WebSocketMessage {
  type: string;
  output?: {
    images?: string[];
    videos?: string[];
    audio?: string[];
    text?: string;
  };
  outputs?: OutputFile[];
  error?: string;
}

export function connectTaskWebSocket(taskToken: string, callbacks: TaskCallbacks): () => void {
  const ws = new WebSocket(WEBSOCKET_URL);
  let closed = false;

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'task_info', tasktoken: taskToken }));
  });

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(String(event.data)) as WebSocketMessage;

      switch (data.type) {
        case 'task_queue':
          callbacks.onQueued?.();
          break;
        case 'task_processing':
        case 'task_accept':
        case 'task_assign':
        case 'task_start':
        case 'task_preprocess_start':
        case 'task_preprocess_end':
        case 'task_output':
          callbacks.onProcessing?.();
          break;
        case 'task_completed':
        case 'task_postprocess_end':
          callbacks.onCompleted?.(data.outputs ?? []);
          break;
        case 'task_failed':
        case 'task_cancel':
          callbacks.onFailed?.(data.error ?? 'Task cancelled or failed');
          break;
      }
    } catch (err) {
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  });

  ws.addEventListener('error', (event) => {
    callbacks.onError?.(new Error(`WebSocket error: ${String(event)}`));
  });

  ws.addEventListener('close', () => {
    closed = true;
  });

  return () => {
    if (!closed) {
      closed = true;
      ws.close();
    }
  };
}
