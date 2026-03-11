import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import type { WiroClient } from 'wiro-sdk';
import { getModelRegistry } from 'wiro-sdk';
import { formatTaskResult } from '../utils/format.js';

export function registerRunModel(server: McpServer, client: WiroClient): void {
  server.registerTool(
    'wiro_run_model',
    {
      title: 'Run Model',
      description: 'Runs an AI model on Wiro AI. Supports image generation, video generation, LLMs, audio, and more. Returns task results or a task token for async monitoring.',
      inputSchema: z.object({
        model: z.string().describe('Model slug in owner/model format, e.g. "openai/sora-2", "google/nano-banana-pro"'),
        params: z.record(z.string(), z.unknown()).describe('Model-specific parameters as key-value pairs. Common: prompt, negativePrompt, width, height, steps, cfg_scale, seed, inputImage (base64 or URL)'),
        wait: z.boolean().default(true).describe('If true, poll task until completion and return result. If false, return task token immediately.'),
        timeout_seconds: z.number().int().min(10).max(600).default(120).describe('Max seconds to wait for task completion (only if wait=true)'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ model, params, wait, timeout_seconds }) => {
      try {
        // Validate against model spec if available
        const registry = getModelRegistry();
        const validationErrors = registry.validateParams(model, params);
        if (validationErrors.length > 0) {
          return {
            content: [{ type: 'text' as const, text: `## Validation Error\n\n${validationErrors.join('\n')}\n\nUse \`wiro_model_info\` to see available parameters for this model.` }],
            isError: true,
          };
        }

        const runResult = await client.runModel(model, params);

        if (!wait) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `## Task Submitted\n\n**Task ID:** ${runResult.taskid}\n**Task Token:** ${runResult.socketaccesstoken}\n\nUse \`wiro_task_status\` or \`wiro_task_wait\` with this token to check results.`,
              },
            ],
          };
        }

        const result = await client.waitForTask(runResult.socketaccesstoken, {
          timeoutSeconds: timeout_seconds,
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
