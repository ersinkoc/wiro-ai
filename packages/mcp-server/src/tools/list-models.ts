import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { KNOWN_MODELS, MODEL_CATEGORIES, getModelRegistry } from '@wiroai/sdk';
import { formatModelList } from '../utils/format.js';

export function registerListModels(server: McpServer): void {
  server.registerTool(
    'wiro_list_models',
    {
      title: 'List Models',
      description: 'Lists available Wiro AI models, optionally filtered by category or search query.',
      inputSchema: z.object({
        category: z.string().optional().describe('Filter by category: ' + MODEL_CATEGORIES.join(', ')),
        search: z.string().optional().describe('Search models by name or slug'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ category, search }) => {
      // Merge static KNOWN_MODELS with dynamically loaded ModelRegistry entries
      const registry = getModelRegistry();
      const registryModels = registry.getAll().map((def: { slug: string; name: string; category?: string }) => ({
        slug: def.slug,
        name: def.name,
        category: def.category ?? 'Other',
      }));

      const knownSlugs = new Set(registryModels.map((m) => m.slug));
      let models = [
        ...registryModels,
        ...KNOWN_MODELS.filter((m) => !knownSlugs.has(m.slug)),
      ];

      if (category) {
        models = models.filter((m) => m.category === category);
      }

      if (search) {
        const q = search.toLowerCase();
        models = models.filter(
          (m) => m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q)
        );
      }

      if (models.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No models found matching your criteria. Note: This is not an exhaustive list. You can try any owner/model slug with wiro_run_model.',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatModelList(models) + '\n\n> Note: This list is not exhaustive. Any owner/model slug can be used with wiro_run_model.',
          },
        ],
      };
    }
  );
}
