import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiroai/sdk';
import { formatTaskItem } from '../utils/format.js';

export function registerTaskKill(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_task_kill',
    {
      title: 'Kill Task',
      description: 'Forcefully terminate a running Wiro AI task.',
      inputSchema: z.object({
        task_id: z.string().describe('The task ID to kill'),
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
        const detail = await client.killTask(task_id);
        const task = detail.tasklist[0];

        if (!task) {
          return {
            content: [{ type: 'text' as const, text: 'Task kill request sent but no task details returned.' }],
          };
        }

        return {
          content: [{ type: 'text' as const, text: `## Task Killed\n\n${formatTaskItem(task)}` }],
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
