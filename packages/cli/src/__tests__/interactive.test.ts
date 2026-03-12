import { describe, it, expect, vi, afterEach } from 'vitest';

describe('interactive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('prompt resolves with trimmed user input', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('  hello  ')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { prompt } = await import('../utils/interactive.js');
    const result = await prompt('Enter: ');
    expect(result).toBe('hello');
    expect(mockRl.close).toHaveBeenCalled();
  });

  it('confirm returns true for "y"', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('y')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { confirm } = await import('../utils/interactive.js');
    const result = await confirm('Continue?');
    expect(result).toBe(true);
  });

  it('confirm returns true for "yes"', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('yes')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { confirm } = await import('../utils/interactive.js');
    const result = await confirm('Continue?');
    expect(result).toBe(true);
  });

  it('confirm returns true for "YES" (case insensitive)', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('YES')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { confirm } = await import('../utils/interactive.js');
    const result = await confirm('Continue?');
    expect(result).toBe(true);
  });

  it('confirm returns false for "n"', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('n')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { confirm } = await import('../utils/interactive.js');
    const result = await confirm('Continue?');
    expect(result).toBe(false);
  });

  it('confirm returns false for empty string', async () => {
    const mockRl = {
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('')),
      close: vi.fn(),
    };
    vi.doMock('node:readline', () => ({
      createInterface: () => mockRl,
    }));
    const { confirm } = await import('../utils/interactive.js');
    const result = await confirm('Continue?');
    expect(result).toBe(false);
  });
});
