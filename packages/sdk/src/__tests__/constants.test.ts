import { describe, it, expect } from 'vitest';
import {
  API_BASE_URL,
  WEBSOCKET_URL,
  ENDPOINTS,
  DEFAULT_TIMEOUT_SECONDS,
  DEFAULT_POLL_INTERVAL_SECONDS,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
} from '../constants.js';

describe('constants', () => {
  it('API_BASE_URL is correct', () => {
    expect(API_BASE_URL).toBe('https://api.wiro.ai/v1');
  });

  it('WEBSOCKET_URL is correct', () => {
    expect(WEBSOCKET_URL).toBe('wss://socket.wiro.ai/v1');
  });

  it('ENDPOINTS.run generates correct path', () => {
    expect(ENDPOINTS.run('owner/model')).toBe('/Run/owner/model');
  });

  it('ENDPOINTS static paths are correct', () => {
    expect(ENDPOINTS.taskDetail).toBe('/Task/Detail');
    expect(ENDPOINTS.taskKill).toBe('/Task/Kill');
    expect(ENDPOINTS.taskCancel).toBe('/Task/Cancel');
    expect(ENDPOINTS.detailOpenApi).toBe('/Tool/DetailOpenAPI');
  });

  it('timeout constants are defined', () => {
    expect(DEFAULT_TIMEOUT_SECONDS).toBe(120);
    expect(DEFAULT_POLL_INTERVAL_SECONDS).toBe(3);
    expect(MAX_TIMEOUT_SECONDS).toBe(600);
    expect(MIN_TIMEOUT_SECONDS).toBe(10);
  });
});
