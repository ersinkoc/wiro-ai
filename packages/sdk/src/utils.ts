/**
 * Parse a model slug from either a direct slug or a Wiro URL.
 *
 * Accepts:
 *   - "google/gemini-3-pro"
 *   - "https://wiro.ai/models/google/gemini-3-pro"
 *   - "https://wiro.ai/models/google/gemini-3-pro?tab=api"
 *   - "wiro.ai/models/google/gemini-3-pro"
 *
 * Returns: "google/gemini-3-pro"
 */
export function parseModelSlug(input: string): string {
  const trimmed = input.trim();

  // URL format: extract slug after /models/
  const urlMatch = trimmed.match(/(?:https?:\/\/)?wiro\.ai\/models\/([^?\s#]+)/);
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  // Already a slug (contains / but not ://)
  if (trimmed.includes('/') && !trimmed.includes('://')) {
    return trimmed;
  }

  return trimmed;
}
