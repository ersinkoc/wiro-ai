import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiro/sdk';
import { formatTaskItem } from '../utils/format.js';

export function registerTaskCancel(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_task_cancel',
    {
      title: 'Cancel Task',
      description: 'Cancel a queued (not yet started) Wiro AI task.',
      inputSchema: z.object({
        task_id: z.string().describe('The task ID to cancel'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ task_id }) => {
      try {
        const detail = await client.cancelTask(task_id);
        const task = detail.tasklist[0];

        if (!task) {
          return {
            content: [{ type: 'text' as const, text: 'Task cancel request sent but no task details returned.' }],
          };
        }

        return {
          content: [{ type: 'text' as const, text: `## Task Cancelled\n\n${formatTaskItem(task)}` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `## Error\n\n${message}` }],
          isError: true,
        };
      }
    }
  );
}
