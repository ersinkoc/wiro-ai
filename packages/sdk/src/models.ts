import type { ModelInfo } from './types.js';

export const KNOWN_MODELS: readonly ModelInfo[] = [
  { slug: 'google/nano-banana-pro', category: 'text-to-image', name: 'Nano Banana Pro' },
  { slug: 'black-forest-labs/flux-1-schnell', category: 'text-to-image', name: 'FLUX.1 Schnell' },
  { slug: 'openai/sora-2', category: 'text-to-video', name: 'Sora 2' },
  { slug: 'openai/sora-2-pro', category: 'text-to-video', name: 'Sora 2 Pro' },
  { slug: 'kling-ai/kling-v3', category: 'text-to-video', name: 'Kling V3' },
  { slug: 'google/gemini-3-pro', category: 'llm', name: 'Gemini 3 Pro' },
  { slug: 'elevenlabs/voice-agent', category: 'realtime-conversation', name: 'ElevenLabs Voice Agent' },
] as const;
