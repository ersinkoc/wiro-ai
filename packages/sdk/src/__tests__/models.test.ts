import { describe, it, expect } from 'vitest';
import { KNOWN_MODELS } from '../models.js';
import { MODEL_CATEGORIES } from '../types.js';

describe('KNOWN_MODELS', () => {
  it('is a non-empty array', () => {
    expect(KNOWN_MODELS.length).toBeGreaterThan(0);
  });

  it('all entries have required fields', () => {
    for (const model of KNOWN_MODELS) {
      expect(model.slug).toBeDefined();
      expect(model.slug).toContain('/');
      expect(model.name).toBeDefined();
      expect(model.name.length).toBeGreaterThan(0);
      expect(model.category).toBeDefined();
    }
  });

  it('all categories are valid', () => {
    const validCategories = new Set(MODEL_CATEGORIES);
    for (const model of KNOWN_MODELS) {
      expect(validCategories.has(model.category)).toBe(true);
    }
  });

  it('has no duplicate slugs', () => {
    const slugs = KNOWN_MODELS.map(m => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('includes nano-banana-pro', () => {
    const found = KNOWN_MODELS.find(m => m.slug === 'google/nano-banana-pro');
    expect(found).toBeDefined();
    expect(found!.category).toBe('text-to-image');
  });
});

describe('MODEL_CATEGORIES', () => {
  it('is a non-empty array', () => {
    expect(MODEL_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('has no duplicates', () => {
    expect(new Set(MODEL_CATEGORIES).size).toBe(MODEL_CATEGORIES.length);
  });

  it('includes common categories', () => {
    expect(MODEL_CATEGORIES).toContain('text-to-image');
    expect(MODEL_CATEGORIES).toContain('text-to-video');
    expect(MODEL_CATEGORIES).toContain('llm');
    expect(MODEL_CATEGORIES).toContain('text-to-speech');
  });
});
