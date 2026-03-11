import { connectTaskWebSocket, type OutputFile } from 'wiro-sdk';
import { getApiKey, getApiSecret } from '../utils/config.js';
import { error, success, info, createSpinner } from '../utils/output.js';

export async function watchCommand(taskToken: string): Promise<void> {
  const apiKey = getApiKey();
  const apiSecret = getApiSecret();

  if (!apiKey || !apiSecret) {
    error('API credentials not configured.');
    error('Run: wiro config set apiKey <key> && wiro config set apiSecret <secret>');
    process.exitCode = 1;
    return;
  }

  const spinner = createSpinner('Connecting to task...');

  return new Promise<void>((resolve) => {
    const disconnect = connectTaskWebSocket(taskToken, {
      onQueued() {
        spinner.update('Task queued, waiting...');
      },
      onProcessing() {
        spinner.update('Task processing...');
      },
      onCompleted(outputs: OutputFile[]) {
        spinner.stop();
        success('Task completed!');
        for (const file of outputs) {
          info(`${file.name} (${file.contenttype}) — ${file.url}`);
        }
        disconnect();
        resolve();
      },
      onFailed(err: string) {
        spinner.stop();
        error(`Task failed: ${err}`);
        disconnect();
        process.exitCode = 1;
        resolve();
      },
      onError(err: Error) {
        spinner.stop();
        error(`WebSocket error: ${err.message}`);
        disconnect();
        process.exitCode = 1;
        resolve();
      },
    });
  });
}
