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

  // ── Wiro Platform — Image Generation ────────────────────
  { slug: 'wiro/FLUX.2-dev', category: 'text-to-image', name: 'FLUX.2 Dev' },
  { slug: 'wiro/FLUX.2-dev-turbo', category: 'text-to-image', name: 'FLUX.2 Dev Turbo' },
  { slug: 'wiro/InfiniteYou-flux', category: 'image-to-image', name: 'InfiniteYou FLUX' },
  { slug: 'wiro/camera-angle-editor', category: 'image-editing', name: 'Camera Angle Editor' },

  // ── Wiro Platform — Commerce & Marketing ────────────────
  { slug: 'wiro/Shopify Template', category: 'template', name: 'Shopify Template Generator' },
  { slug: 'wiro/Virtual Try-On', category: 'virtual-try-on', name: 'Virtual Try-On' },
  { slug: 'wiro/Virtual Try-On-V2', category: 'virtual-try-on', name: 'Virtual Try-On V2' },
  { slug: 'wiro/ugc creator', category: 'product-ads', name: 'UGC Creator' },
  { slug: 'wiro/3D Text Animations', category: 'text-to-video', name: '3D Text Animations' },

  // ── Wiro Platform — LLM & Chat ──────────────────────────
  { slug: 'wiro/chat', category: 'chat', name: 'Wiro Chat' },
  { slug: 'wiro/rag-chat', category: 'rag', name: 'Wiro RAG Chat' },
  { slug: 'wiro/wiroai-turkish-llm-8b', category: 'llm', name: 'WiroAI Turkish LLM 8B' },
  { slug: 'wiro/wiroai-turkish-llm-9b', category: 'llm', name: 'WiroAI Turkish LLM 9B' },

  // ── Wiro Platform — HR & Recruitment ────────────────────
  { slug: 'wiro/AI-Resume-CV-Parser', category: 'rag', name: 'AI Resume/CV Parser' },
  { slug: 'wiro/AI-Resume-CV-Evaluator-JobDesc', category: 'rag', name: 'AI Resume Evaluator (Job Desc)' },
  { slug: 'wiro/AI-Resume-CV-Evaluator-SkillSets', category: 'rag', name: 'AI Resume Evaluator (Skills)' },
  { slug: 'wiro/AI-Resume-CV-Feedback-Generator', category: 'rag', name: 'AI Resume Feedback Generator' },
  { slug: 'wiro/AI-Job-Description-Generator', category: 'rag', name: 'AI Job Description Generator' },
  { slug: 'wiro/AI-Culture-Fit-Test-Generator', category: 'rag', name: 'AI Culture Fit Test Generator' },
  { slug: 'wiro/AI-Culture-Fit-Evaluator', category: 'rag', name: 'AI Culture Fit Evaluator' },
  { slug: 'wiro/AI-Exit-Interview-Generator', category: 'rag', name: 'AI Exit Interview Generator' },
  { slug: 'wiro/AI-Exit-Interview-Evaluator', category: 'rag', name: 'AI Exit Interview Evaluator' },
  { slug: 'wiro/AI-Leave-Analysis', category: 'rag', name: 'AI Leave Analysis' },
  { slug: 'wiro/AI-Pulse-Survey-Analyzer', category: 'rag', name: 'AI Pulse Survey Analyzer' },
] as const;
