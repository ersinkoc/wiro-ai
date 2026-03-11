import type { TaskResult, OutputFile, TaskItem } from 'wiro-sdk';
import type { ModelDefinition, ModelParameter } from 'wiro-sdk';

export function formatTaskResult(result: TaskResult): string {
  const lines: string[] = [];
  lines.push(`## Task ${result.id}`);
  lines.push(`**Status:** ${result.status}`);
  lines.push(`**Created:** ${result.createdAt}`);
  if (result.elapsedSeconds && result.elapsedSeconds !== '0') {
    lines.push(`**Elapsed:** ${result.elapsedSeconds}s`);
  }

  if (result.outputs.length > 0) {
    lines.push('');
    lines.push('### Output Files');
    for (const file of result.outputs) {
      lines.push(`- **${file.name}** (${file.contenttype}, ${formatFileSize(file.size)}) — ${file.url}`);
    }
  }

  return lines.join('\n');
}

export function formatTaskItem(task: TaskItem): string {
  const lines: string[] = [];
  lines.push(`## Task ${task.id}`);
  lines.push(`**Status:** ${task.status}`);
  lines.push(`**Model:** ${task.modelslugowner}/${task.modelslugproject}`);
  lines.push(`**Created:** ${task.createtime}`);
  if (task.elapsedseconds && task.elapsedseconds !== '0') {
    lines.push(`**Elapsed:** ${task.elapsedseconds}s`);
  }

  if (task.outputs.length > 0) {
    lines.push('');
    lines.push('### Output Files');
    for (const file of task.outputs) {
      lines.push(`- **${file.name}** (${file.contenttype}, ${formatFileSize(file.size)}) — ${file.url}`);
    }
  }

  return lines.join('\n');
}

function formatFileSize(sizeStr: string): string {
  const bytes = parseInt(sizeStr, 10);
  if (isNaN(bytes)) return sizeStr;
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatModelList(models: Array<{ slug: string; name: string; category: string }>): string {
  const lines: string[] = ['## Available Models', ''];
  const byCategory = new Map<string, Array<{ slug: string; name: string }>>();

  for (const model of models) {
    const list = byCategory.get(model.category) ?? [];
    list.push({ slug: model.slug, name: model.name });
    byCategory.set(model.category, list);
  }

  for (const [category, catModels] of byCategory) {
    lines.push(`### ${category}`);
    for (const m of catModels) {
      lines.push(`- **${m.name}** — \`${m.slug}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatModelDefinition(def: ModelDefinition): string {
  const lines: string[] = [];
  lines.push(`## ${def.slug} — ${def.name}`);
  lines.push('');
  lines.push(def.description);
  if (def.processingTime) {
    lines.push(`**Processing Time:** ${def.processingTime}`);
  }
  lines.push('');
  lines.push('### Parameters');
  lines.push('');
  lines.push('| Parameter | Type | Required | Default | Description |');
  lines.push('|-----------|------|----------|---------|-------------|');

  for (const p of def.parameters) {
    const req = p.required ? 'Yes' : 'No';
    const def_val = p.default !== undefined ? String(p.default) : '—';
    let desc = p.description;
    if (p.enum) {
      desc += ` (Options: ${p.enum.join(', ')})`;
    }
    if (p.options) {
      desc += ` (Options: ${p.options.map(o => o.label || o.value).join(', ')})`;
    }
    lines.push(`| ${p.name} | ${p.type} | ${req} | ${def_val} | ${desc} |`);
  }

  return lines.join('\n');
}
