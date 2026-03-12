import type { ModelInfo } from './types.js';

export const KNOWN_MODELS: readonly ModelInfo[] = [
  // ── Text-to-Image ─────────────────────────────────────
  { slug: 'ByteDance/seedream-v5-lite-uncensored', category: 'text-to-image', name: 'Seedream V5 Lite Uncensored' },
  { slug: 'ByteDance/seedream-v5-lite', category: 'text-to-image', name: 'Seedream V5 Lite' },
  { slug: 'ByteDance/seedream-v4-5', category: 'text-to-image', name: 'Seedream V4.5' },
  { slug: 'google/nano-banana-2', category: 'text-to-image', name: 'Nano Banana 2' },
  { slug: 'google/nano-banana-pro', category: 'text-to-image', name: 'Nano Banana Pro' },
  { slug: 'FireRedTeam/FireRed-Image-Edit', category: 'image-editing', name: 'FireRed Image Edit' },
  { slug: 'zai-org/GLM-IMAGE', category: 'text-to-image', name: 'GLM Image' },
  { slug: 'black-forest-labs/FLUX.2-klein-base-9B', category: 'text-to-image', name: 'FLUX.2 Klein Base 9B' },
  { slug: 'black-forest-labs/FLUX.2-klein-base-4B', category: 'text-to-image', name: 'FLUX.2 Klein Base 4B' },
  { slug: 'black-forest-labs/FLUX.2-klein-4B', category: 'text-to-image', name: 'FLUX.2 Klein 4B' },
  { slug: 'black-forest-labs/FLUX.2-klein-9B', category: 'text-to-image', name: 'FLUX.2 Klein 9B' },
  { slug: 'black-forest-labs/flux-2-flex', category: 'text-to-image', name: 'FLUX.2 Flex' },
  { slug: 'black-forest-labs/flux-2-pro', category: 'text-to-image', name: 'FLUX.2 Pro' },
  { slug: 'black-forest-labs/FLUX.1-Krea-dev', category: 'text-to-image', name: 'FLUX.1 Krea Dev' },
  { slug: 'meituan-longcat/LongCat-Image-Edit', category: 'image-editing', name: 'LongCat Image Edit' },
  { slug: 'meituan-longcat/LongCat-Image', category: 'text-to-image', name: 'LongCat Image' },
  { slug: 'pruna/wan-image-small', category: 'text-to-image', name: 'Wan Image Small' },
  { slug: 'pruna/p-image', category: 'text-to-image', name: 'P-Image' },
  { slug: 'reve/Generate', category: 'text-to-image', name: 'Reve Generate' },
  { slug: 'Qwen/Qwen-Image', category: 'text-to-image', name: 'Qwen Image' },
  { slug: 'AIDC-AI/Ovis-Image-7B', category: 'text-to-image', name: 'Ovis Image 7B' },
  { slug: 'xiabs/DreamOmni2', category: 'text-to-image', name: 'DreamOmni2' },
  { slug: 'decart-ai/Lucy-Edit-Dev', category: 'image-editing', name: 'Lucy Edit Dev' },

  // ── Text-to-Video ─────────────────────────────────────
  { slug: 'ByteDance/seedance-pro-v1.5-uncensored', category: 'text-to-video', name: 'Seedance Pro V1.5 Uncensored' },
  { slug: 'ByteDance/seedance-pro-v1.5', category: 'text-to-video', name: 'Seedance Pro V1.5' },
  { slug: 'ByteDance/seedance-v1-pro-fast', category: 'text-to-video', name: 'Seedance V1 Pro Fast' },
  { slug: 'openai/sora-2', category: 'text-to-video', name: 'Sora 2' },
  { slug: 'openai/sora-2-pro', category: 'text-to-video', name: 'Sora 2 Pro' },
  { slug: 'klingai/kling-v3', category: 'text-to-video', name: 'Kling V3' },
  { slug: 'klingai/kling-v3-omni', category: 'text-to-video', name: 'Kling V3 Omni' },
  { slug: 'klingai/kling-v2.6', category: 'text-to-video', name: 'Kling V2.6' },
  { slug: 'klingai/kling-v2.5-turbo', category: 'text-to-video', name: 'Kling V2.5 Turbo' },
  { slug: 'alibaba/wan 2.6', category: 'text-to-video', name: 'Wan 2.6' },
  { slug: 'pruna/p-video', category: 'text-to-video', name: 'P-Video' },
  { slug: 'PixVerse/text-to-video-v5', category: 'text-to-video', name: 'PixVerse V5' },

  // ── Image-to-Video ────────────────────────────────────
  { slug: 'lightricks/ ltx-2.3', category: 'image-to-video', name: 'LTX 2.3' },
  { slug: 'lightricks/ ltx-2-distilled', category: 'image-to-video', name: 'LTX 2 Distilled' },
  { slug: 'klingai/kling-v3-motion-control', category: 'image-to-video', name: 'Kling V3 Motion Control' },
  { slug: 'Wan-AI/Wan2.2-Animate-Animation', category: 'image-to-video', name: 'Wan 2.2 Animate Animation' },
  { slug: 'Wan-AI/Wan2.2-Animate-Replace', category: 'image-to-video', name: 'Wan 2.2 Animate Replace' },

  // ── LLM / Chat ────────────────────────────────────────
  { slug: 'google/gemini-3-pro', category: 'llm', name: 'Gemini 3 Pro' },
  { slug: 'google/gemini-3-flash', category: 'llm', name: 'Gemini 3 Flash' },
  { slug: 'Qwen/Qwen3.5-27B', category: 'llm', name: 'Qwen 3.5 27B' },
  { slug: 'zai-org/GLM-4.7-Flash', category: 'llm', name: 'GLM 4.7 Flash' },

  // ── Translation ───────────────────────────────────────
  { slug: 'google/translate-gemma-4b-it', category: 'llm', name: 'Translate Gemma 4B IT' },
  { slug: 'google/translate-gemma-12b-it', category: 'llm', name: 'Translate Gemma 12B IT' },
  { slug: 'google/translate-gemma-27b-it', category: 'llm', name: 'Translate Gemma 27B IT' },
  { slug: 'google/translate-gemma-4b-it-image', category: 'llm', name: 'Translate Gemma 4B IT Image' },
  { slug: 'google/translate-gemma-12b-it-image', category: 'llm', name: 'Translate Gemma 12B IT Image' },
  { slug: 'google/translate-gemma-27b-it-image', category: 'llm', name: 'Translate Gemma 27B IT Image' },

  // ── Speech ────────────────────────────────────────────
  { slug: 'Qwen/Qwen3-TTS-12Hz-1.7B', category: 'text-to-speech', name: 'Qwen3 TTS 12Hz 1.7B' },
  { slug: 'Qwen/Qwen3-ASR-1.7B', category: 'speech-to-text', name: 'Qwen3 ASR 1.7B' },
  { slug: 'microsoft/VibeVoice-Realtime', category: 'realtime-conversation', name: 'VibeVoice Realtime' },

  // ── Talking Head ──────────────────────────────────────
  { slug: 'Alibaba-Quark/Live-Avatar', category: 'talking-head', name: 'Live Avatar' },

  // ── 3D / Panorama ─────────────────────────────────────
  { slug: 'microsoft/Trellis-2', category: '3d-generation', name: 'Trellis 2' },
  { slug: 'tencent/HunyuanWorld-text-to-panorama', category: '3d-generation', name: 'HunyuanWorld Panorama' },

  // ── OCR ────────────────────────────────────────────────
  { slug: 'kristaller486/dots.ocr-1.5', category: 'rag', name: 'Dots OCR 1.5' },

  // ── Other ─────────────────────────────────────────────
  { slug: 'chetwinlow1/ovi', category: 'llm', name: 'Ovi' },
] as const;
