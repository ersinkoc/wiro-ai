import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiroai/sdk';
import { getModelRegistry, parseModelSlug, generateModelHelp } from '@wiroai/sdk';
import { formatModelDefinition } from '../utils/format.js';

export function registerModelInfo(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_model_info',
    {
      title: 'Model Info',
      description:
        'Get detailed parameter information for a specific Wiro AI model. Auto-fetches and caches the OpenAPI spec if not already available.\n\n' +
        'Shows all available parameters, types, defaults, valid options, and usage examples for CLI, MCP, and SDK.',
      inputSchema: z.object({
        model: z.string().describe('Model slug (e.g. "google/nano-banana-2") or Wiro URL (e.g. "https://wiro.ai/models/google/nano-banana-2")'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ model: rawModel }) => {
      const model = parseModelSlug(rawModel);
      const registry = getModelRegistry();

      // Auto-fetch spec if not available
      let def = registry.get(model);
      if (!def) {
        try {
          def = await registry.ensureSpec(client, model);
        } catch {
          // Continue - will show not-found message
        }
      }

      if (!def) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No parameter specification found for "${model}".\n\nCould not fetch the OpenAPI spec from the API. This model may still work — try running it with \`wiro_run_model\`. Parameters will be passed through without validation.\n\nYou can also try \`wiro_fetch_spec\` to manually download the spec.`,
            },
          ],
        };
      }

      const help = generateModelHelp(def);
      const paramTable = formatModelDefinition(def);

      const text = [
        paramTable,
        '',
        '### MCP Usage Example',
        '',
        '```json',
        help.mcpUsage,
        '```',
        '',
        '### Quick Reference',
        '',
        '```',
        help.quickReference,
        '```',
      ].join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text,
          },
        ],
      };
    }
  );
}
