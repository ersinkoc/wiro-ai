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

const HELP = `
\x1b[1m\x1b[36mWiro AI CLI\x1b[0m — Run AI models from the terminal

\x1b[1mUSAGE\x1b[0m
  wiro <command> [options]

\x1b[1mCOMMANDS\x1b[0m
  run <model>        Run an AI model
  models             List available models
  status <token>     Check task status
  watch <token>      Watch task in real-time (WebSocket)
  info <model>       Show model parameters
  kill <taskId>      Kill a running task
  cancel <taskId>    Cancel a queued task
  fetch-spec <model> Download model OpenAPI spec
  config <sub>       Manage configuration (set/get/list)

\x1b[1mEXAMPLES\x1b[0m
  wiro run google/nano-banana-pro -p "A sunset over mountains"
  wiro run openai/sora-2 -p "A cat walking" --no-wait
  wiro models --category text-to-image
  wiro status <task-token>
  wiro watch <task-token>
  wiro fetch-spec google/nano-banana-2
  wiro config set apiKey YOUR_KEY

\x1b[1mGLOBAL OPTIONS\x1b[0m
  --help, -h       Show help
  --version, -v    Show version
  --json           Output as JSON
  --verbose        Verbose logging
`;

const command = process.argv[2];
const restArgs = process.argv.slice(3);

switch (command) {
  case 'run': {
    const model = restArgs[0];
    if (!model || model.startsWith('-')) {
      console.error('Usage: wiro run <owner/model> [options]');
      console.error('Example: wiro run openai/sora-2 -p "A cat playing piano"');
      process.exitCode = 1;
      break;
    }

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
    const model = restArgs[0];
    if (!model) {
      console.error('Usage: wiro info <owner/model>');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: { json: { type: 'boolean' } },
      allowPositionals: true,
    });
    await infoCommand(model, { json: values['json'] });
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
    const model = restArgs[0];
    if (!model || model.startsWith('-')) {
      console.error('Usage: wiro fetch-spec <owner/model>');
      console.error('Example: wiro fetch-spec google/nano-banana-2');
      process.exitCode = 1;
      break;
    }
    const { values } = parseArgs({
      args: restArgs.slice(1),
      options: { json: { type: 'boolean' } },
      allowPositionals: true,
    });
    await fetchSpecCommand(model, { json: values['json'] });
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
