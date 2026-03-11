import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from '@wiroai/sdk';
import { getModelRegistry, parseOpenApiSpec, parseModelSlug } from '@wiroai/sdk';
import { formatModelDefinition } from '../utils/format.js';

export function registerFetchSpec(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_fetch_spec',
    {
      title: 'Fetch Model Spec',
      description: 'Downloads the OpenAPI spec for a model from Wiro API and saves it locally. After fetching, the model parameters become available in wiro_model_info and validation in wiro_run_model.',
      inputSchema: z.object({
        model: z.string().describe('Model slug (e.g. "openai/sora-2") or Wiro URL (e.g. "https://wiro.ai/models/openai/sora-2")'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ model: rawModel }) => {
      try {
        const model = parseModelSlug(rawModel);
        const spec = await client.fetchModelSpec(model);
        const registry = getModelRegistry();
        const filepath = registry.saveSpec(model, spec);
        const parsed = parseOpenApiSpec(spec);

        let text = `## Spec Fetched: ${model}\n\n**Saved to:** ${filepath}\n`;

        if (parsed) {
          text += `\n${formatModelDefinition(parsed)}`;
        }

        text += '\n\n> This model\'s parameters are now available for validation with `wiro_run_model` and details via `wiro_model_info`.';

        return {
          content: [{ type: 'text' as const, text }],
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
