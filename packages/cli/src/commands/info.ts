import { getModelRegistry } from '@wiroai/sdk';
import { error, heading, info, printTable } from '../utils/output.js';

export async function infoCommand(model: string, options: { json?: boolean }): Promise<void> {
  const registry = getModelRegistry();
  const def = registry.get(model);

  if (!def) {
    error(`No parameter specification found for "${model}".`);
    info('This model may still work — try running it with "wiro run".');
    info('To add specs, place an OpenAPI JSON file in the models/ directory.');
    process.exitCode = 1;
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(def, null, 2));
    return;
  }

  heading(`${def.slug} — ${def.name}`);
  console.log(def.description);
  if (def.processingTime) {
    info(`Processing Time: ~${def.processingTime}`);
  }
  console.log('');

  heading('Parameters');

  const rows: string[][] = [];
  for (const p of def.parameters) {
    const req = p.required ? '[REQUIRED]' : '';
    const defVal = p.default !== undefined ? `[default: ${String(p.default)}]` : '';
    let desc = p.description;
    if (p.enum) {
      desc += `\n  Options: ${p.enum.join(', ')}`;
    }
    if (p.options) {
      desc += `\n  Options: ${p.options.map(o => o.label || o.value).join(', ')}`;
    }
    rows.push([p.name, p.type, `${req} ${defVal}`.trim(), desc]);
  }

  printTable(['Parameter', 'Type', 'Flags', 'Description'], rows);
}
