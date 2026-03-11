import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiro/sdk';
import { formatTaskItem } from '../utils/format.js';

export function registerTaskStatus(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_task_status',
    {
      title: 'Task Status',
      description: 'Check the status of a running Wiro AI task.',
      inputSchema: z.object({
        task_token: z.string().describe('The socketAccessToken returned from wiro_run_model'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ task_token }) => {
      try {
        const detail = await client.getTaskDetail(task_token);
        const task = detail.tasklist[0];

        if (!task) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No task found for this token. Verify the task token is correct.',
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatTaskItem(task),
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
