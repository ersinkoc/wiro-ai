export { WiroClient } from './client.js';
export { createAuthHeaders } from './auth.js';
export type { WiroAuthHeaders } from './auth.js';
export { KNOWN_MODELS } from './models.js';
export { MODEL_CATEGORIES, TERMINAL_STATUSES, RUNNING_STATUSES } from './types.js';
export type {
  ApiError,
  DetailOpenApiItem,
  DetailOpenApiResponse,
  ModelCategory,
  ModelInfo,
  OutputFile,
  RunModelResponse,
  TaskCallbacks,
  TaskDetailRequest,
  TaskDetailResponse,
  TaskItem,
  TaskResult,
  TaskStatus,
  WaitOptions,
  WiroConfig,
} from './types.js';
export {
  WiroApiError,
  WiroAuthError,
  WiroError,
  WiroTimeoutError,
  WiroValidationError,
} from './errors.js';
export { connectTaskWebSocket } from './websocket.js';
export {
  API_BASE_URL,
  DEFAULT_POLL_INTERVAL_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  ENDPOINTS,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  WEBSOCKET_URL,
} from './constants.js';
export {
  ModelRegistry,
  getModelRegistry,
  parseOpenApiSpec,
} from './model-registry.js';
export type {
  ModelDefinition,
  ModelParameter,
} from './model-registry.js';
export { parseModelSlug } from './utils.js';
