import { WiroClient, getModelRegistry, generateModelHelp } from '@wiroai/sdk';
import { error, heading, info, createSpinner, printTable } from '../utils/output.js';
import { getApiKey, getApiSecret } from '../utils/config.js';

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

export async function infoCommand(model: string, options: { json?: boolean; usage?: boolean }): Promise<void> {
  const registry = getModelRegistry();

  // Auto-fetch spec if not available locally
  let def = registry.get(model);
  if (!def) {
    const apiKey = getApiKey();
    const apiSecret = getApiSecret();

    if (apiKey && apiSecret) {
      const spinner = createSpinner(`Fetching spec for ${model}...`);
      try {
        const client = new WiroClient({ apiKey, apiSecret });
        def = await registry.ensureSpec(client, model);
        spinner.stop();
        if (def) {
          info(`Spec fetched and cached for ${model}`);
        }
      } catch {
        spinner.stop();
      }
    }
  }

  if (!def) {
    error(`No parameter specification found for "${model}".`);
    info('This model may still work — try running it with "wiro run".');
    info('To fetch the spec: wiro fetch-spec ' + model);
    info('Or set WIRO_API_KEY/WIRO_API_SECRET to enable auto-fetch.');
    process.exitCode = 1;
    return;
  }

  const help = generateModelHelp(def);

  if (options.json) {
    console.log(JSON.stringify({
      ...def,
      help: {
        cliUsage: help.cliUsage,
        mcpUsage: help.mcpUsage,
        sdkUsage: help.sdkUsage,
        quickReference: help.quickReference,
      },
    }, null, 2));
    return;
  }

  // Header
  heading(`${def.slug} — ${def.name}`);
  console.log(def.description);
  if (def.processingTime) {
    info(`Processing Time: ~${def.processingTime}`);
  }
  if (def.category) {
    info(`Category: ${def.category}`);
  }
  console.log('');

  // Parameters table
  heading('Parameters');

  const rows: string[][] = [];
  for (const p of def.parameters) {
    const req = p.required ? '[REQUIRED]' : '';
    const defVal = p.default !== undefined ? `[default: ${truncate(String(p.default), 30)}]` : '';
    let desc = p.description;
    // Prefer options over enum to avoid duplication
    if (p.options && p.options.length > 0) {
      desc += `\n  Options: ${p.options.map(o => `${o.value}${o.label && o.label !== o.value ? ' (' + o.label + ')' : ''}`).filter(Boolean).join(', ')}`;
    } else if (p.enum) {
      desc += `\n  Options: ${p.enum.filter(v => v !== '').join(', ')}`;
    }
    rows.push([p.name, p.type, `${req} ${defVal}`.trim(), desc]);
  }

  printTable(['Parameter', 'Type', 'Flags', 'Description'], rows);

  // Usage examples
  console.log('');
  heading('CLI Usage');
  console.log(help.cliUsage);

  if (options.usage) {
    console.log('');
    heading('MCP Usage');
    console.log(help.mcpUsage);
    console.log('');
    heading('SDK Usage');
    console.log(help.sdkUsage);
  } else {
    console.log('');
    info('Use --usage flag to see MCP and SDK usage examples.');
  }
}
