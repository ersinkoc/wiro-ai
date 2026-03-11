import { KNOWN_MODELS, MODEL_CATEGORIES, getModelRegistry } from 'wiro-sdk';
import { heading, printTable, info } from '../utils/output.js';

interface ModelsOptions {
  category?: string;
  search?: string;
  json?: boolean;
}

export async function modelsCommand(options: ModelsOptions): Promise<void> {
  // Merge registry models with static KNOWN_MODELS
  const registry = getModelRegistry();
  const registryModels = registry.getAll().map((def) => ({
    slug: def.slug,
    name: def.name,
    category: def.category ?? 'other',
    hasSpec: true,
  }));

  const registrySlugs = new Set(registryModels.map((m) => m.slug));
  let models = [
    ...registryModels,
    ...KNOWN_MODELS
      .filter((m) => !registrySlugs.has(m.slug))
      .map((m) => ({ ...m, hasSpec: false })),
  ];

  if (options.category) {
    models = models.filter((m) => m.category === options.category);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    models = models.filter(
      (m) => m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q)
    );
  }

  if (options.json) {
    console.log(JSON.stringify(models, null, 2));
    return;
  }

  if (models.length === 0) {
    console.log('No models found. Note: This is not an exhaustive list. Any owner/model slug can be used.');
    return;
  }

  heading('Available Models');
  printTable(
    ['Name', 'Slug', 'Category', 'Spec'],
    models.map((m) => [m.name, m.slug, m.category, m.hasSpec ? 'Yes' : '—'])
  );

  const specCount = models.filter((m) => m.hasSpec).length;
  console.log(`\nShowing ${models.length} model(s) (${specCount} with parameter specs). Any owner/model slug can be used with "wiro run".`);
  if (specCount > 0) {
    info('Run "wiro info <model>" to see parameters for models with specs.');
  }
}
