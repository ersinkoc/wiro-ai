export interface WiroConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeout?: number;
}

// ── API Error ────────────────────────────────────────────

export interface ApiError {
  code: number;
  message: string;
}

// ── Run Model ────────────────────────────────────────────

export interface RunModelResponse {
  errors: ApiError[];
  taskid: string;
  socketaccesstoken: string;
  result: boolean;
}

// ── Task Status (real API values) ────────────────────────

export const TERMINAL_STATUSES = [
  'task_postprocess_end',
  'task_cancel',
] as const;

export const RUNNING_STATUSES = [
  'task_queue',
  'task_accept',
  'task_assign',
  'task_preprocess_start',
  'task_preprocess_end',
  'task_start',
  'task_output',
] as const;

export type TaskStatus =
  | typeof TERMINAL_STATUSES[number]
  | typeof RUNNING_STATUSES[number];

// ── Output File ──────────────────────────────────────────

export interface OutputFile {
  id: string;
  name: string;
  contenttype: string;
  size: string;
  url: string;
  accesskey: string;
}

// ── Task Detail ──────────────────────────────────────────

export interface TaskItem {
  id: string;
  uuid: string;
  socketaccesstoken: string;
  parameters: Record<string, unknown>;
  status: TaskStatus;
  outputs: OutputFile[];
  size: string;
  createtime: string;
  starttime: string;
  endtime: string;
  elapsedseconds: string;
  totalcost: string;
  cps: string;
  modeldescription: string;
  modelslugowner: string;
  modelslugproject: string;
  categories: string[];
}

export interface TaskDetailRequest {
  taskid?: string;
  tasktoken?: string;
  uuid?: string;
}

export interface TaskDetailResponse {
  total: string;
  errors: ApiError[];
  tasklist: TaskItem[];
  result: boolean;
}

// ── Task Result (simplified for consumers) ───────────────

export interface TaskResult {
  id: string;
  status: TaskStatus;
  outputs: OutputFile[];
  createdAt: string;
  elapsedSeconds: string;
  modelDescription: string;
}

// ── Wait / WebSocket ─────────────────────────────────────

export interface WaitOptions {
  timeoutSeconds?: number;
  pollIntervalSeconds?: number;
}

export interface TaskCallbacks {
  onQueued?: () => void;
  onProcessing?: () => void;
  onCompleted?: (outputs: OutputFile[]) => void;
  onFailed?: (error: string) => void;
  onError?: (error: Error) => void;
}

// ── DetailOpenAPI ────────────────────────────────────────

export interface DetailOpenApiItem {
  type: string; // 'apikey' | 'signature'
  spec: Record<string, unknown>;
}

export type DetailOpenApiResponse = DetailOpenApiItem[];

// ── Model Info ───────────────────────────────────────────

export interface ModelInfo {
  slug: string;
  category: ModelCategory;
  name: string;
}

export type ModelCategory = typeof MODEL_CATEGORIES[number];

export const MODEL_CATEGORIES = [
  'text-to-image',
  'image-to-image',
  'image-editing',
  'text-to-video',
  'image-to-video',
  'speech-to-video',
  'talking-head',
  'text-to-speech',
  'speech-to-text',
  'text-to-music',
  'text-to-song',
  'voice-clone',
  'realtime-conversation',
  '3d-generation',
  'text-to-3d',
  'chat',
  'llm',
  'reasoning',
  'rag',
  'virtual-try-on',
  'product-ads',
  'template',
] as const;
