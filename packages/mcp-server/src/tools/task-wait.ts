import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiro/sdk';
import { formatTaskResult } from '../utils/format.js';

export function registerTaskWait(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_task_wait',
    {
      title: 'Wait for Task',
      description: 'Wait for a Wiro AI task to complete using polling.',
      inputSchema: z.object({
        task_token: z.string().describe('The socketAccessToken returned from wiro_run_model'),
        timeout_seconds: z.number().int().min(10).max(600).default(120).describe('Max seconds to wait'),
        poll_interval_seconds: z.number().int().min(1).max(30).default(3).describe('Seconds between polls'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ task_token, timeout_seconds, poll_interval_seconds }) => {
      try {
        const result = await client.waitForTask(task_token, {
          timeoutSeconds: timeout_seconds,
          pollIntervalSeconds: poll_interval_seconds,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: formatTaskResult(result),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `## Error\n\n${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
