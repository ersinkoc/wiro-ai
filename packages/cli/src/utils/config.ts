import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface WiroCliConfig {
  apiKey?: string;
  apiSecret?: string;
  defaultTimeout?: number;
  outputDir?: string;
}

const CONFIG_DIR = join(homedir(), '.wiro');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): WiroCliConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as WiroCliConfig;
    }
  } catch {
    // Return default config on parse error
  }
  return {};
}

export function saveConfig(config: WiroCliConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function getConfigValue(key: string): string | undefined {
  const config = loadConfig();
  return config[key as keyof WiroCliConfig]?.toString();
}

export function setConfigValue(key: string, value: string): void {
  const config = loadConfig();
  if (key === 'defaultTimeout') {
    (config as Record<string, unknown>)[key] = parseInt(value, 10);
  } else {
    (config as Record<string, unknown>)[key] = value;
  }
  saveConfig(config);
}

export function getApiKey(): string | undefined {
  return process.env['WIRO_API_KEY'] ?? loadConfig().apiKey;
}

export function getApiSecret(): string | undefined {
  return process.env['WIRO_API_SECRET'] ?? loadConfig().apiSecret;
}

export function getOutputDir(): string {
  return loadConfig().outputDir ?? './wiro-output';
}

export function getDefaultTimeout(): number {
  return loadConfig().defaultTimeout ?? 120;
}
