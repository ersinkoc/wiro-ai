# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-03-12

### Added

#### @wiroai/sdk
- 24 Wiro platform models added to `KNOWN_MODELS` (76 total):
  - Image Generation: FLUX.2 Dev, FLUX.2 Dev Turbo, InfiniteYou FLUX, Camera Angle Editor
  - Commerce & Marketing: Shopify Template Generator, Virtual Try-On V1/V2, UGC Creator, 3D Text Animations
  - LLM & Chat: Wiro Chat, RAG Chat, WiroAI Turkish LLM 8B/9B
  - HR & Recruitment: Resume Parser, Resume Evaluator (Job Desc/Skills), Feedback Generator, Job Description Generator, Culture Fit Test/Evaluator, Exit Interview Generator/Evaluator, Leave Analysis, Pulse Survey Analyzer
- 4 new model categories: `virtual-try-on`, `product-ads`, `template`, `text-to-3d`
- 24 new OpenAPI spec files for all Wiro platform models
- `llms.txt` — concise LLM-friendly project index following [llmstxt.org](https://llmstxt.org) spec
- `llms-full.txt` — complete API reference with all SDK/CLI/MCP usage examples and 76 model slugs

### Changed
- README rewritten with full 76-model catalog table, architecture diagram, and improved Quick Start sections

## [1.0.2] - 2026-03-12

### Added

#### @wiroai/sdk
- 58 pre-bundled OpenAPI model specs across 10 categories (text-to-image, text-to-video, image-to-video, image-editing, LLM, translation, speech, talking-head, 3D, OCR)
- Expanded `KNOWN_MODELS` registry from 7 to 58 models with proper categorization
- Auto-fetch and cache model specs via `ModelRegistry.ensureSpec()` — unknown models are discovered on first use
- `generateModelHelp()` — formatted help output with quick reference, MCP usage examples, and CLI usage
- `parseOpenApiSpec()` — robust OpenAPI 3.0.3 spec parser with enum, default, and description extraction
- Comprehensive test suite: 257 tests across 14 test files with 100% code coverage

#### @wiroai/cli
- `wiro info` now auto-fetches specs from API when model is not cached locally
- `wiro run` validates parameters against OpenAPI specs before submission
- Enhanced terminal output utilities (tables, spinners, colored output)

#### @wiroai/mcp-server
- `wiro_run_model` validates parameters against OpenAPI specs before submission
- `wiro_model_info` auto-fetches and caches specs on demand
- `wiro_fetch_spec` tool for manual spec download with formatted output
- HTTP/SSE transport support alongside stdio (set `TRANSPORT=http`)
- Formatted task results with output file URLs, sizes, and metadata

### Changed
- All packages now exclude test files from TypeScript build output
- Improved error messages with actionable guidance across all packages

### Fixed
- TypeScript build errors caused by test files included in compilation output
- WebSocket reconnection handling in task monitoring

## [1.0.1] - 2026-03-11

### Changed
- Bump all package versions to 1.0.1
- Updated README with package scoping, badges, and improved documentation structure
- Renamed SDK package from `@wiro/sdk` to `@wiroai/sdk`

## [1.0.0] - 2026-03-11

### Added

#### @wiroai/sdk
- `WiroClient` with HMAC-SHA256 authentication
- `runModel()` — run any AI model on Wiro AI
- `getTaskDetail()` / `getTaskDetailById()` — check task status
- `waitForTask()` — poll until task completion
- `connectTaskWebSocket()` — real-time task monitoring via WebSocket
- `killTask()` / `cancelTask()` — task lifecycle management
- `fetchModelSpec()` — download OpenAPI specs from Wiro API
- `ModelRegistry` — OpenAPI spec parser with parameter validation
- `parseOpenApiSpec()` — extract model parameters from OpenAPI 3.0.3 specs
- Custom error classes: `WiroApiError`, `WiroAuthError`, `WiroTimeoutError`, `WiroValidationError`
- Full TypeScript types for all API responses

#### @wiroai/cli
- `wiro run <model>` — run AI models with full parameter support
- `wiro models` — list available models with category filtering
- `wiro info <model>` — show model parameters, types, defaults, and examples
- `wiro fetch-spec <model>` — download model OpenAPI spec
- `wiro status <token>` — check task status
- `wiro watch <token>` — real-time task monitoring via WebSocket
- `wiro kill <taskId>` — kill running tasks
- `wiro cancel <taskId>` — cancel queued tasks
- `wiro config` — manage API key configuration
- Colored terminal output with spinners and tables

#### @wiroai/mcp-server
- 9 MCP tools for AI assistant integration:
  - `wiro_run_model` — run models with parameter validation
  - `wiro_list_models` — browse available models
  - `wiro_model_info` — inspect model parameters
  - `wiro_fetch_spec` — download model specs on demand
  - `wiro_task_status` / `wiro_task_wait` — task monitoring
  - `wiro_task_kill` / `wiro_task_cancel` — task management
  - `wiro_list_categories` — model category listing
- stdio and HTTP/SSE transport support
- Compatible with Claude Desktop, Cursor, Windsurf, and other MCP clients
