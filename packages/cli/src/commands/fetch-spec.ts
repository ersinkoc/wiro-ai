import { WiroClient, getModelRegistry, parseOpenApiSpec } from '@wiro/sdk';
import { heading, success, error, info } from '../utils/output.js';

interface FetchSpecOptions {
  json?: boolean;
}

export async function fetchSpecCommand(model: string, options: FetchSpecOptions): Promise<void> {
  const apiKey = process.env['WIRO_API_KEY'];
  const apiSecret = process.env['WIRO_API_SECRET'];

  if (!apiKey || !apiSecret) {
    error('WIRO_API_KEY and WIRO_API_SECRET environment variables are required.');
    process.exitCode = 1;
    return;
  }

  const client = new WiroClient({ apiKey, apiSecret });
  const registry = getModelRegistry();

  try {
    info(`Fetching OpenAPI spec for ${model}...`);
    const spec = await client.fetchModelSpec(model);
    const filepath = registry.saveSpec(model, spec);
    const parsed = parseOpenApiSpec(spec);

    if (options.json) {
      console.log(JSON.stringify({ model, filepath, parameters: parsed?.parameters.length ?? 0 }, null, 2));
      return;
    }

    heading(`Spec saved: ${model}`);
    success(`File: ${filepath}`);
    if (parsed) {
      console.log(`  Parameters: ${parsed.parameters.length}`);
      console.log(`  Required:   ${parsed.requiredParameters.length}`);
      if (parsed.category) {
        console.log(`  Category:   ${parsed.category}`);
      }
    }
    console.log('');
    info('Run "wiro info ' + model + '" to see full parameter details.');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    error(`Failed to fetch spec: ${message}`);
    process.exitCode = 1;
  }
}
