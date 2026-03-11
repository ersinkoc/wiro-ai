import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { WiroClient, getModelRegistry } from '@wiro/sdk';
import { getApiKey, getApiSecret, getOutputDir, getDefaultTimeout } from '../utils/config.js';
import { error, success, info, createSpinner, heading } from '../utils/output.js';

interface RunOptions {
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  inputImage?: string;
  param?: string[];
  noWait?: boolean;
  timeout?: number;
  output?: string;
  json?: boolean;
}

function parseExtraParams(params: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const p of params) {
    const eqIndex = p.indexOf('=');
    if (eqIndex === -1) {
      result[p] = true;
    } else {
      const key = p.slice(0, eqIndex);
      const value = p.slice(eqIndex + 1);
      const num = Number(value);
      result[key] = isNaN(num) ? value : num;
    }
  }
  return result;
}

function loadImageAsBase64(path: string): string {
  const buffer = readFileSync(path);
  return buffer.toString('base64');
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destPath, buffer);
}

export async function runCommand(model: string, options: RunOptions): Promise<void> {
  const apiKey = getApiKey();
  const apiSecret = getApiSecret();

  if (!apiKey || !apiSecret) {
    error('API credentials not configured.');
    error('Run: wiro config set apiKey <key> && wiro config set apiSecret <secret>');
    error('Or set WIRO_API_KEY and WIRO_API_SECRET environment variables.');
    process.exitCode = 1;
    return;
  }

  const client = new WiroClient({ apiKey, apiSecret });

  const params: Record<string, unknown> = {};

  if (options.prompt) params['prompt'] = options.prompt;
  if (options.negativePrompt) params['negativePrompt'] = options.negativePrompt;
  if (options.width) params['width'] = options.width;
  if (options.height) params['height'] = options.height;
  if (options.steps) params['steps'] = options.steps;
  if (options.cfgScale) params['cfg_scale'] = options.cfgScale;
  if (options.seed !== undefined) params['seed'] = options.seed;

  if (options.inputImage) {
    if (options.inputImage.startsWith('http://') || options.inputImage.startsWith('https://')) {
      params['inputImage'] = options.inputImage;
    } else if (existsSync(options.inputImage)) {
      params['inputImage'] = loadImageAsBase64(options.inputImage);
    } else {
      error(`Input image not found: ${options.inputImage}`);
      process.exitCode = 1;
      return;
    }
  }

  if (options.param) {
    Object.assign(params, parseExtraParams(options.param));
  }

  // Validate against model spec if available
  const registry = getModelRegistry();
  const validationErrors = registry.validateParams(model, params);
  if (validationErrors.length > 0) {
    error('Validation errors:');
    for (const e of validationErrors) {
      error(`  ${e}`);
    }
    info('Run "wiro info ' + model + '" to see available parameters.');
    process.exitCode = 1;
    return;
  }

  const spinner = createSpinner(`Running ${model}...`);

  try {
    const runResult = await client.runModel(model, params);

    if (options.noWait) {
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify(runResult, null, 2));
      } else {
        success('Task submitted!');
        info(`Task ID: ${runResult.taskid}`);
        info(`Task Token: ${runResult.socketaccesstoken}`);
        info('Check status: wiro status ' + runResult.socketaccesstoken);
        info('Watch live: wiro watch ' + runResult.socketaccesstoken);
      }
      return;
    }

    spinner.update('Waiting for task to complete...');

    const timeout = options.timeout ?? getDefaultTimeout();
    const result = await client.waitForTask(runResult.socketaccesstoken, {
      timeoutSeconds: timeout,
    });

    spinner.stop();

    if (result.status === 'task_cancel') {
      error('Task was cancelled.');
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      }
      process.exitCode = 1;
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    success('Task completed!');
    if (result.elapsedSeconds && result.elapsedSeconds !== '0') {
      info(`Elapsed: ${result.elapsedSeconds}s`);
    }

    if (result.outputs.length > 0) {
      const outputDir = options.output ?? getOutputDir();
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      heading('Downloaded Files');
      for (const file of result.outputs) {
        const destPath = join(outputDir, file.name);

        try {
          await downloadFile(file.url, destPath);
          success(`${destPath} (${file.contenttype})`);
        } catch {
          error(`Failed to download: ${file.name}`);
          info(`URL: ${file.url}`);
        }
      }

      const firstFile = result.outputs[0];
      if (firstFile) {
        info(`Open with: open ${join(outputDir, firstFile.name)}`);
      }
    }
  } catch (err) {
    spinner.stop();
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
