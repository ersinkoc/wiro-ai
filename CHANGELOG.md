# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
