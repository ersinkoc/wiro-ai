import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { MODEL_CATEGORIES } from '@wiroai/sdk';

export function registerListCategories(server: McpServer): void {
  server.registerTool(
    'wiro_list_categories',
    {
      title: 'List Model Categories',
      description: 'Lists all available Wiro AI model categories (text-to-image, text-to-video, llm, etc.)',
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const categories = MODEL_CATEGORIES.map((c) => `- ${c}`).join('\n');
      return {
        content: [
          {
            type: 'text' as const,
            text: `## Available Model Categories\n\n${categories}`,
          },
        ],
      };
    }
  );
}
