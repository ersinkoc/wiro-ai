import { WiroClient } from '@wiro/sdk';
import { getApiKey, getApiSecret } from '../utils/config.js';
import { error, heading, info, success } from '../utils/output.js';

interface StatusOptions {
  json?: boolean;
}

export async function statusCommand(taskToken: string, options: StatusOptions): Promise<void> {
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

  try {
    const detail = await client.getTaskDetail(taskToken);
    const task = detail.tasklist[0];

    if (!task) {
      error('No task found for this token.');
      process.exitCode = 1;
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    heading(`Task ${task.id}`);
    const isSuccess = task.status === 'task_postprocess_end';
    const isFailed = task.status === 'task_cancel';
    const statusColor = isSuccess ? '\x1b[32m' : isFailed ? '\x1b[31m' : '\x1b[33m';
    console.log(`Status: ${statusColor}${task.status}\x1b[0m`);
    console.log(`Model: ${task.modelslugowner}/${task.modelslugproject}`);
    console.log(`Created: ${task.createtime}`);
    if (task.elapsedseconds && task.elapsedseconds !== '0') {
      console.log(`Elapsed: ${task.elapsedseconds}s`);
    }

    if (task.outputs.length > 0) {
      console.log('');
      info('Output Files:');
      for (const file of task.outputs) {
        info(`  ${file.name} (${file.contenttype}) — ${file.url}`);
      }
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
