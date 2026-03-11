import { WiroClient } from 'wiro-sdk';
import { getApiKey, getApiSecret } from '../utils/config.js';
import { error, success, info } from '../utils/output.js';

export async function cancelCommand(taskId: string, options: { json?: boolean }): Promise<void> {
  const apiKey = getApiKey();
  const apiSecret = getApiSecret();

  if (!apiKey || !apiSecret) {
    error('API credentials not configured.');
    error('Run: wiro config set apiKey <key> && wiro config set apiSecret <secret>');
    process.exitCode = 1;
    return;
  }

  const client = new WiroClient({ apiKey, apiSecret });

  try {
    const detail = await client.cancelTask(taskId);

    if (options.json) {
      console.log(JSON.stringify(detail, null, 2));
      return;
    }

    const task = detail.tasklist[0];
    if (task) {
      success(`Task ${task.id} cancelled. Status: ${task.status}`);
    } else {
      success('Task cancel request sent.');
    }
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
