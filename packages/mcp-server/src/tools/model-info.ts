import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { getModelRegistry } from 'wiro-sdk';
import { formatModelDefinition } from '../utils/format.js';

export function registerModelInfo(server: McpServer): void {
  server.registerTool(
    'wiro_model_info',
    {
      title: 'Model Info',
      description: 'Get detailed parameter information for a specific Wiro AI model. Shows all available parameters, types, defaults, and valid options.',
      inputSchema: z.object({
        model: z.string().describe('Model slug in owner/model format, e.g. "google/nano-banana-2"'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ model }) => {
      const registry = getModelRegistry();
      const def = registry.get(model);

      if (!def) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No parameter specification found for "${model}".\n\nThis model may still work — try running it with \`wiro_run_model\`. Parameters will be passed through without validation.\n\nTo add parameter specs, place an OpenAPI JSON file in the models/ directory.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatModelDefinition(def),
          },
        ],
      };
    }
  );
}
