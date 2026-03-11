export const API_BASE_URL = 'https://api.wiro.ai/v1';
export const WEBSOCKET_URL = 'wss://socket.wiro.ai/v1';

export const ENDPOINTS = {
  run: (model: string) => `/Run/${model}`,
  taskDetail: '/Task/Detail',
  taskKill: '/Task/Kill',
  taskCancel: '/Task/Cancel',
  detailOpenApi: '/Tool/DetailOpenAPI',
} as const;

export const DEFAULT_TIMEOUT_SECONDS = 120;
export const DEFAULT_POLL_INTERVAL_SECONDS = 3;
export const MAX_TIMEOUT_SECONDS = 600;
export const MIN_TIMEOUT_SECONDS = 10;
