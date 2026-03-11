import { createHmac } from 'node:crypto';

export interface WiroAuthHeaders {
  'Content-Type': string;
  'x-api-key': string;
  'x-nonce': string;
  'x-signature': string;
}

export function createAuthHeaders(apiKey: string, apiSecret: string): WiroAuthHeaders {
  const nonce = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', apiKey)
    .update(apiSecret + nonce)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-nonce': nonce,
    'x-signature': signature,
  };
}
