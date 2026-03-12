#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { runCommand } from './commands/run.js';
import { modelsCommand } from './commands/models.js';
import { statusCommand } from './commands/status.js';
import { watchCommand } from './commands/watch.js';
import { configCommand } from './commands/config.js';
import { infoCommand } from './commands/info.js';
import { killCommand } from './commands/kill.js';
import { cancelCommand } from './commands/cancel.js';
import { fetchSpecCommand } from './commands/fetch-spec.js';
import { parseModelSlug } from '@wiroai/sdk';

const HELP = `
\x1b[1m\x1b[36mWiro AI CLI\x1b[0m — Run AI models from the terminal

\x1b[1mUSAGE\x1b[0m
  wiro <command> [options]

\x1b[1mCOMMANDS\x1b[0m
  run <model>        Run an AI model (auto-fetches spec if needed)
  models             List available models
  status <token>     Check task status
  watch <token>      Watch task in real-time (WebSocket)
  info <model>       Show model parameters & usage examples
  kill <taskId>      Kill a running task
  cancel <taskId>    Cancel a queued task
  fetch-spec <model> Download model OpenAPI spec
  config <sub>       Manage configuration (set/get/list)

\x1b[1mEXAMPLES\x1b[0m
  wiro run google/nano-banana-pro -p "A sunset over mountains"
  wiro run openai/sora-2 -p "A cat walking" --param aspectRatio=16:9
  wiro run <model> --help                Show model-specific parameters
  wiro info alibaba/wan-2-6              Parameters + CLI usage
  wiro info alibaba/wan-2-6 --usage      Parameters + CLI/MCP/SDK usage
  wiro models --category text-to-image
  wiro fetch-spec https://wiro.ai/models/alibaba/wan-2-6
  wiro config set apiKey YOUR_KEY

\x1b[1mDYNAMIC PARAMETERS\x1b[0m
  Use --param key=value for any model parameter (from OpenAPI spec):
    wiro run google/nano-banana-pro -p "test" --param aspectRatio=16:9
    wiro run google/nano-banana-pro -p "test" --param resolution=2K

\x1b[1mGLOBAL OPTIONS\x1b[0m
  --help, -h       Show help
  --version, -v    Show version
  --json           Output as JSON
`;

const command = process.argv[2];
const restArgs = process.argv.slice(3);

switch (command) {
  case 'run': {
    const rawModel = restArgs[0];
    if (!rawModel || rawModel.startsWith('-')) {
      console.error('Usage: wiro run <owner/model | wiro-url> [options]');
      console.error('Example: wiro run openai/sora-2 -p "A cat playing piano"');
      console.error('         wiro run https://wiro.ai/models/openai/sora-2 -p "test"');
      process.exitCode = 1;
      break;
    }
    const model = parseModelSlug(rawModel);

    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: {
        prompt: { type: 'string', short: 'p' },
        'negative-prompt': { type: 'string', short: 'n' },
        width: { type: 'string' },
        height: { type: 'string' },
        steps: { type: 'string' },
        'cfg-scale': { type: 'string' },
        seed: { type: 'string' },
        'input-image': { type: 'string' },
        param: { type: 'string', multiple: true },
        'no-wait': { type: 'boolean' },
        timeout: { type: 'string' },
        output: { type: 'string', short: 'o' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
      allowPositionals: true,
    });

    await runCommand(model, {
      prompt: values['prompt'],
      negativePrompt: values['negative-prompt'],
      width: values['width'] ? parseInt(values['width'], 10) : undefined,
      height: values['height'] ? parseInt(values['height'], 10) : undefined,
      steps: values['steps'] ? parseInt(values['steps'], 10) : undefined,
      cfgScale: values['cfg-scale'] ? parseFloat(values['cfg-scale']) : undefined,
      seed: values['seed'] ? parseInt(values['seed'], 10) : undefined,
      inputImage: values['input-image'],
      param: values['param'],
      noWait: values['no-wait'],
      timeout: values['timeout'] ? parseInt(values['timeout'], 10) : undefined,
      output: values['output'],
      json: values['json'],
      help: values['help'],
    });
    break;
  }

  case 'models': {
    const { values } = parseArgs({
      args: restArgs,
      options: {
        category: { type: 'string', short: 'c' },
        search: { type: 'string', short: 's' },
        json: { type: 'boolean' },
      },
      allowPositionals: true,
    });

    await modelsCommand({
      category: values['category'],
      search: values['search'],
      json: values['json'],
    });
    break;
  }

  case 'status': {
    const token = restArgs[0];
    if (!token) {
      console.error('Usage: wiro status <task-token>');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: {
        json: { type: 'boolean' },
      },
      allowPositionals: true,
    });
    await statusCommand(token, { json: values['json'] });
    break;
  }

  case 'watch': {
    const token = restArgs[0];
    if (!token) {
      console.error('Usage: wiro watch <task-token>');
      process.exitCode = 1;
      break;
    }
    await watchCommand(token);
    break;
  }

  case 'info': {
    const rawInfo = restArgs[0];
    if (!rawInfo) {
      console.error('Usage: wiro info <owner/model | wiro-url>');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: {
        json: { type: 'boolean' },
        usage: { type: 'boolean' },
      },
      allowPositionals: true,
    });
    await infoCommand(parseModelSlug(rawInfo), { json: values['json'], usage: values['usage'] });
    break;
  }

  case 'kill': {
    const taskId = restArgs[0];
    if (!taskId) {
      console.error('Usage: wiro kill <taskId>');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: { json: { type: 'boolean' } },
      allowPositionals: true,
    });
    await killCommand(taskId, { json: values['json'] });
    break;
  }

  case 'cancel': {
    const taskId = restArgs[0];
    if (!taskId) {
      console.error('Usage: wiro cancel <taskId>');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: { json: { type: 'boolean' } },
      allowPositionals: true,
    });
    await cancelCommand(taskId, { json: values['json'] });
    break;
  }

  case 'fetch-spec': {
    const rawSpec = restArgs[0];
    if (!rawSpec || rawSpec.startsWith('-')) {
      console.error('Usage: wiro fetch-spec <owner/model | wiro-url>');
      console.error('Example: wiro fetch-spec google/nano-banana-2');
      console.error('         wiro fetch-spec https://wiro.ai/models/google/nano-banana-2');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: { json: { type: 'boolean' } },
      allowPositionals: true,
    });
    await fetchSpecCommand(parseModelSlug(rawSpec), { json: values['json'] });
    break;
  }

  case 'config': {
    await configCommand(restArgs);
    break;
  }

  case '--help':
  case '-h':
  case 'help':
  case undefined:
    console.log(HELP);
    break;

  case '--version':
  case '-v':
    console.log('wiro-cli 1.0.0');
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "wiro --help" for usage information.');
    process.exitCode = 1;
}
