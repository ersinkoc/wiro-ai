import { createAuthHeaders, type WiroAuthHeaders } from './auth.js';
import { API_BASE_URL, DEFAULT_POLL_INTERVAL_SECONDS, DEFAULT_TIMEOUT_SECONDS, ENDPOINTS } from './constants.js';
import { WiroApiError, WiroAuthError, WiroTimeoutError, WiroValidationError } from './errors.js';
import { TERMINAL_STATUSES } from './types.js';
import type { DetailOpenApiResponse, RunModelResponse, TaskCallbacks, TaskDetailResponse, TaskResult, WaitOptions, WiroConfig } from './types.js';
import { connectTaskWebSocket } from './websocket.js';

export class WiroClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor(config: WiroConfig) {
    if (!config.apiKey) {
      throw new WiroAuthError('WIRO_API_KEY is required. Set it via environment variable or config.');
    }
    if (!config.apiSecret) {
      throw new WiroAuthError('WIRO_API_SECRET is required. Set it via environment variable or config.');
    }
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl ?? API_BASE_URL;
  }

  private getHeaders(): WiroAuthHeaders {
    return createAuthHeaders(this.apiKey, this.apiSecret);
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers },
      body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403) {
      throw new WiroAuthError();
    }

    const text = await response.text();

    if (!response.ok) {
      throw new WiroApiError(response.status, text);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new WiroApiError(response.status, `Invalid JSON response: ${text}`);
    }
  }

  async runModel(model: string, params: Record<string, unknown>): Promise<RunModelResponse> {
    if (!model || !model.includes('/')) {
      throw new WiroValidationError('Model must be in "owner/model" format, e.g. "openai/sora-2"');
    }

    const result = await this.request<RunModelResponse>(ENDPOINTS.run(model), params);

    if (result.errors && result.errors.length > 0) {
      const messages = result.errors.map(e => e.message).join(', ');
      throw new WiroApiError(400, `Model run failed: ${messages}`);
    }

    return result;
  }

  async getTaskDetail(taskToken: string): Promise<TaskDetailResponse> {
    if (!taskToken) {
      throw new WiroValidationError('Task token is required.');
    }

    return this.request<TaskDetailResponse>(ENDPOINTS.taskDetail, { tasktoken: taskToken });
  }

  async getTaskDetailById(taskId: string): Promise<TaskDetailResponse> {
    if (!taskId) {
      throw new WiroValidationError('Task ID is required.');
    }

    return this.request<TaskDetailResponse>(ENDPOINTS.taskDetail, { taskid: taskId });
  }

  async killTask(taskId: string): Promise<TaskDetailResponse> {
    if (!taskId) {
      throw new WiroValidationError('Task ID is required.');
    }

    return this.request<TaskDetailResponse>(ENDPOINTS.taskKill, { taskid: taskId });
  }

  async cancelTask(taskId: string): Promise<TaskDetailResponse> {
    if (!taskId) {
      throw new WiroValidationError('Task ID is required.');
    }

    return this.request<TaskDetailResponse>(ENDPOINTS.taskCancel, { taskid: taskId });
  }

  async waitForTask(taskToken: string, options?: WaitOptions): Promise<TaskResult> {
    const timeout = options?.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
    const interval = options?.pollIntervalSeconds ?? DEFAULT_POLL_INTERVAL_SECONDS;
    const deadline = Date.now() + timeout * 1000;

    while (Date.now() < deadline) {
      const detail = await this.getTaskDetail(taskToken);
      const task = detail.tasklist[0];

      if (task) {
        const isTerminal = (TERMINAL_STATUSES as readonly string[]).includes(task.status);
        if (isTerminal) {
          return {
            id: task.id,
            status: task.status,
            outputs: task.outputs,
            createdAt: task.createtime,
            elapsedSeconds: task.elapsedseconds,
            modelDescription: task.modeldescription,
          };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }

    throw new WiroTimeoutError(timeout);
  }

  async fetchModelSpec(model: string): Promise<Record<string, unknown>> {
    if (!model || !model.includes('/')) {
      throw new WiroValidationError('Model must be in "owner/model" format, e.g. "openai/sora-2"');
    }

    const [slugowner, ...rest] = model.split('/');
    const slugproject = rest.join('/');

    const response = await this.request<DetailOpenApiResponse>(ENDPOINTS.detailOpenApi, {
      slugowner,
      slugproject,
    });

    // Prefer the "signature" auth variant since our SDK uses HMAC auth
    const signatureSpec = response.find(item => item.type === 'signature');
    const spec = signatureSpec?.spec ?? response[0]?.spec;

    if (!spec) {
      throw new WiroApiError(404, `No OpenAPI spec found for model "${model}"`);
    }

    return spec;
  }

  connectTaskWebSocket(taskToken: string, callbacks: TaskCallbacks): () => void {
    return connectTaskWebSocket(taskToken, callbacks);
  }
}
