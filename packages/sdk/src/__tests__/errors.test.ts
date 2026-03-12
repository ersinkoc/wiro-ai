import { describe, it, expect } from 'vitest';
import { WiroError, WiroAuthError, WiroApiError, WiroTimeoutError, WiroValidationError } from '../errors.js';

describe('Error classes', () => {
  it('WiroError has correct name and message', () => {
    const err = new WiroError('test error');
    expect(err.name).toBe('WiroError');
    expect(err.message).toBe('test error');
    expect(err).toBeInstanceOf(Error);
  });

  it('WiroAuthError has default message', () => {
    const err = new WiroAuthError();
    expect(err.name).toBe('WiroAuthError');
    expect(err.message).toContain('Authentication failed');
    expect(err).toBeInstanceOf(WiroError);
  });

  it('WiroAuthError accepts custom message', () => {
    const err = new WiroAuthError('custom auth error');
    expect(err.message).toBe('custom auth error');
  });

  it('WiroApiError includes status code and body', () => {
    const err = new WiroApiError(404, 'Not found');
    expect(err.name).toBe('WiroApiError');
    expect(err.statusCode).toBe(404);
    expect(err.responseBody).toBe('Not found');
    expect(err.message).toContain('404');
    expect(err).toBeInstanceOf(WiroError);
  });

  it('WiroTimeoutError includes timeout duration', () => {
    const err = new WiroTimeoutError(120);
    expect(err.name).toBe('WiroTimeoutError');
    expect(err.timeoutSeconds).toBe(120);
    expect(err.message).toContain('120 seconds');
    expect(err).toBeInstanceOf(WiroError);
  });

  it('WiroValidationError', () => {
    const err = new WiroValidationError('Invalid param');
    expect(err.name).toBe('WiroValidationError');
    expect(err.message).toBe('Invalid param');
    expect(err).toBeInstanceOf(WiroError);
  });
});
