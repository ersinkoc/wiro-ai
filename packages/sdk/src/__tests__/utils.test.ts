import { describe, it, expect } from 'vitest';
import { parseModelSlug } from '../utils.js';

describe('parseModelSlug', () => {
  it('returns slug as-is for owner/model format', () => {
    expect(parseModelSlug('google/nano-banana-pro')).toBe('google/nano-banana-pro');
  });

  it('extracts slug from full https URL', () => {
    expect(parseModelSlug('https://wiro.ai/models/google/nano-banana-pro')).toBe('google/nano-banana-pro');
  });

  it('extracts slug from URL with query params', () => {
    expect(parseModelSlug('https://wiro.ai/models/google/nano-banana-pro?tab=api')).toBe('google/nano-banana-pro');
  });

  it('extracts slug from URL without protocol', () => {
    expect(parseModelSlug('wiro.ai/models/google/nano-banana-pro')).toBe('google/nano-banana-pro');
  });

  it('trims whitespace', () => {
    expect(parseModelSlug('  google/nano-banana-pro  ')).toBe('google/nano-banana-pro');
  });

  it('handles http:// URL', () => {
    expect(parseModelSlug('http://wiro.ai/models/openai/sora-2')).toBe('openai/sora-2');
  });

  it('returns non-slash input as-is', () => {
    expect(parseModelSlug('something')).toBe('something');
  });

  it('handles multi-part slug', () => {
    expect(parseModelSlug('google/gemini/3/pro')).toBe('google/gemini/3/pro');
  });
});
