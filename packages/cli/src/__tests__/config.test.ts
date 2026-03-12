import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { colors } from '../utils/output.js';

// Dynamic import after mocking the config module paths
describe('colors', () => {
  it('has reset escape code', () => {
    expect(colors.reset).toContain('[0m');
  });

  it('has common color codes', () => {
    expect(colors.red).toBeDefined();
    expect(colors.green).toBeDefined();
    expect(colors.blue).toBeDefined();
    expect(colors.cyan).toBeDefined();
    expect(colors.yellow).toBeDefined();
  });
});

// Config tests with filesystem isolation
describe('config functions', () => {
  const testDir = join(tmpdir(), `wiro-config-test-${Date.now()}`);
  const configDir = join(testDir, '.wiro');
  const configFile = join(configDir, 'config.json');

  // We need to mock the module-level constants
  // Instead, we test config logic by directly importing and mocking homedir
  let loadConfig: typeof import('../utils/config.js').loadConfig;
  let saveConfig: typeof import('../utils/config.js').saveConfig;
  let getConfigValue: typeof import('../utils/config.js').getConfigValue;
  let setConfigValue: typeof import('../utils/config.js').setConfigValue;
  let getApiKey: typeof import('../utils/config.js').getApiKey;
  let getApiSecret: typeof import('../utils/config.js').getApiSecret;
  let getOutputDir: typeof import('../utils/config.js').getOutputDir;
  let getDefaultTimeout: typeof import('../utils/config.js').getDefaultTimeout;

  beforeEach(async () => {
    mkdirSync(testDir, { recursive: true });

    // Mock homedir to return our test directory
    vi.resetModules();
    vi.doMock('node:os', () => ({
      homedir: () => testDir,
    }));

    const configModule = await import('../utils/config.js');
    loadConfig = configModule.loadConfig;
    saveConfig = configModule.saveConfig;
    getConfigValue = configModule.getConfigValue;
    setConfigValue = configModule.setConfigValue;
    getApiKey = configModule.getApiKey;
    getApiSecret = configModule.getApiSecret;
    getOutputDir = configModule.getOutputDir;
    getDefaultTimeout = configModule.getDefaultTimeout;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('loadConfig returns empty object when no config file exists', () => {
    expect(loadConfig()).toEqual({});
  });

  it('loadConfig reads existing config file', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ apiKey: 'test-key' }));
    expect(loadConfig().apiKey).toBe('test-key');
  });

  it('loadConfig returns empty object on malformed JSON', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, 'not valid json{');
    expect(loadConfig()).toEqual({});
  });

  it('saveConfig creates config dir and writes file', () => {
    saveConfig({ apiKey: 'my-key', apiSecret: 'my-secret' });
    expect(existsSync(configFile)).toBe(true);
    const raw = require('node:fs').readFileSync(configFile, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.apiKey).toBe('my-key');
  });

  it('saveConfig works when config dir already exists', () => {
    mkdirSync(configDir, { recursive: true });
    saveConfig({ apiKey: 'first' });
    saveConfig({ apiKey: 'second' });
    expect(loadConfig().apiKey).toBe('second');
  });

  it('getConfigValue returns value for existing key', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ apiKey: 'val' }));
    expect(getConfigValue('apiKey')).toBe('val');
  });

  it('getConfigValue returns undefined for missing key', () => {
    expect(getConfigValue('apiKey')).toBeUndefined();
  });

  it('getConfigValue converts number to string', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ defaultTimeout: 300 }));
    expect(getConfigValue('defaultTimeout')).toBe('300');
  });

  it('setConfigValue sets a string value', () => {
    setConfigValue('apiKey', 'new-key');
    expect(loadConfig().apiKey).toBe('new-key');
  });

  it('setConfigValue parses defaultTimeout as integer', () => {
    setConfigValue('defaultTimeout', '300');
    expect(loadConfig().defaultTimeout).toBe(300);
  });

  it('getApiKey returns env var first', () => {
    const orig = process.env['WIRO_API_KEY'];
    process.env['WIRO_API_KEY'] = 'env-key';
    expect(getApiKey()).toBe('env-key');
    if (orig !== undefined) {
      process.env['WIRO_API_KEY'] = orig;
    } else {
      delete process.env['WIRO_API_KEY'];
    }
  });

  it('getApiKey falls back to config', () => {
    const orig = process.env['WIRO_API_KEY'];
    delete process.env['WIRO_API_KEY'];
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ apiKey: 'cfg-key' }));
    expect(getApiKey()).toBe('cfg-key');
    if (orig !== undefined) {
      process.env['WIRO_API_KEY'] = orig;
    }
  });

  it('getApiSecret returns env var first', () => {
    const orig = process.env['WIRO_API_SECRET'];
    process.env['WIRO_API_SECRET'] = 'env-secret';
    expect(getApiSecret()).toBe('env-secret');
    if (orig !== undefined) {
      process.env['WIRO_API_SECRET'] = orig;
    } else {
      delete process.env['WIRO_API_SECRET'];
    }
  });

  it('getApiSecret falls back to config', () => {
    const orig = process.env['WIRO_API_SECRET'];
    delete process.env['WIRO_API_SECRET'];
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ apiSecret: 'cfg-secret' }));
    expect(getApiSecret()).toBe('cfg-secret');
    if (orig !== undefined) {
      process.env['WIRO_API_SECRET'] = orig;
    }
  });

  it('getOutputDir returns default when not configured', () => {
    expect(getOutputDir()).toBe('./wiro-output');
  });

  it('getOutputDir returns configured value', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ outputDir: '/custom/out' }));
    expect(getOutputDir()).toBe('/custom/out');
  });

  it('getDefaultTimeout returns 120 when not configured', () => {
    expect(getDefaultTimeout()).toBe(120);
  });

  it('getDefaultTimeout returns configured value', () => {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configFile, JSON.stringify({ defaultTimeout: 300 }));
    expect(getDefaultTimeout()).toBe(300);
  });
});
