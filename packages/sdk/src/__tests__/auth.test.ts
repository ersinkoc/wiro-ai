import { describe, it, expect } from 'vitest';
import { createAuthHeaders } from '../auth.js';

describe('createAuthHeaders', () => {
  it('returns all required headers', () => {
    const headers = createAuthHeaders('test-key', 'test-secret');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['x-nonce']).toBeDefined();
    expect(headers['x-signature']).toBeDefined();
  });

  it('generates a numeric nonce based on timestamp', () => {
    const headers = createAuthHeaders('key', 'secret');
    const nonce = parseInt(headers['x-nonce'], 10);
    expect(nonce).toBeGreaterThan(0);
    // Should be close to current unix timestamp
    const now = Math.floor(Date.now() / 1000);
    expect(Math.abs(nonce - now)).toBeLessThan(5);
  });

  it('generates a hex signature', () => {
    const headers = createAuthHeaders('key', 'secret');
    expect(headers['x-signature']).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different signatures for different keys', () => {
    const h1 = createAuthHeaders('key1', 'secret');
    const h2 = createAuthHeaders('key2', 'secret');
    expect(h1['x-signature']).not.toBe(h2['x-signature']);
  });

  it('produces different signatures for different secrets', () => {
    const h1 = createAuthHeaders('key', 'secret1');
    const h2 = createAuthHeaders('key', 'secret2');
    expect(h1['x-signature']).not.toBe(h2['x-signature']);
  });
});
