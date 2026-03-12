# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-03-12

### Added

#### @wiroai/sdk
- 58 pre-bundled OpenAPI model specs (text-to-image, text-to-video, image-to-video, LLM, speech, 3D, OCR)
- Expanded `KNOWN_MODELS` registry with all available Wiro AI models
- Auto-fetch and cache model specs via `ModelRegistry.ensureSpec()`
- `generateModelHelp()` — formatted help output for any model (quick reference, MCP usage, CLI usage)
- `parseOpenApiSpec()` — robust OpenAPI 3.0.3 spec parser with enum, default, and description extraction

#### @wiroai/cli
- `wiro info` now auto-fetches specs from API when not cached locally
- Improved `wiro run` with parameter validation against OpenAPI specs
- Enhanced terminal output utilities (tables, spinners, colored output)

#### @wiroai/mcp-server
- `wiro_run_model` now validates parameters against OpenAPI specs before submission
- `wiro_model_info` auto-fetches and caches specs on demand
- `wiro_fetch_spec` tool for manual spec download
- HTTP/SSE transport support alongside stdio
- Formatted task results with output file URLs and metadata

### Changed
- All packages now exclude test files from TypeScript build output
- Improved error messages with actionable guidance

### Fixed
- TypeScript build errors caused by test files in compilation output
- WebSocket reconnection handling in task monitoring

## [1.0.0] - 2026-03-11

### Added

#### @wiroai/sdk
- `WiroClient` with HMAC-SHA256 authentication
- `runModel()` — run any AI model on Wiro AI
- `getTaskDetail()` / `getTaskDetailById()` — check task status
- `waitForTask()` — poll until task completion
- `connectTaskWebSocket()` — real-time task monitoring
- `killTask()` / `cancelTask()` — task lifecycle management
- `fetchModelSpec()` — download OpenAPI specs from Wiro API
- `ModelRegistry` — OpenAPI spec parser with parameter validation
- `parseOpenApiSpec()` — extract model parameters from OpenAPI 3.0.3 specs
- Custom error classes: `WiroApiError`, `WiroAuthError`, `WiroTimeoutError`, `WiroValidationError`
- Full TypeScript types for all API responses

#### @wiroai/cli
- `wiro run <model>` — run AI models with parameter support
- `wiro models` — list available models with category filtering
- `wiro info <model>` — show model parameters and defaults
- `wiro fetch-spec <model>` — download model OpenAPI spec
- `wiro status <token>` — check task status
- `wiro watch <token>` — real-time task monitoring via WebSocket
- `wiro kill <taskId>` — kill running tasks
- `wiro cancel <taskId>` — cancel queued tasks
- `wiro config` — manage API key configuration
- Colored terminal output with spinners and tables

#### @wiroai/mcp-server
- 9 MCP tools for AI assistant integration
- `wiro_run_model` — run models with parameter validation
- `wiro_list_models` — browse available models
- `wiro_model_info` — inspect model parameters
- `wiro_fetch_spec` — download model specs on demand
- `wiro_task_status` / `wiro_task_wait` — task monitoring
- `wiro_task_kill` / `wiro_task_cancel` — task management
- `wiro_list_categories` — model category listing
- stdio and HTTP/SSE transport support
- Compatible with Claude Desktop, Cursor, Windsurf, and other MCP clients
