# @wiroai/mcp-server

Unofficial MCP (Model Context Protocol) server for [Wiro AI](https://wiro.ai). Use AI models from Claude, Cursor, Windsurf, and other MCP-compatible AI assistants.

> **Disclaimer:** This is an unofficial community project, not affiliated with Wiro AI.

## Quick Setup

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "wiro": {
      "command": "npx",
      "args": ["-y", "@wiroai/mcp-server"],
      "env": {
        "WIRO_API_KEY": "your-key",
        "WIRO_API_SECRET": "your-secret"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `wiro_run_model` | Run any AI model (image, video, LLM, audio, etc.) |
| `wiro_list_models` | List available models with optional filtering |
| `wiro_model_info` | Show model parameters and defaults |
| `wiro_fetch_spec` | Download model OpenAPI spec for validation |
| `wiro_task_status` | Check task status |
| `wiro_task_wait` | Wait for task completion |
| `wiro_task_kill` | Kill a running task |
| `wiro_task_cancel` | Cancel a queued task |
| `wiro_list_categories` | List model categories |

## Transport

Supports stdio (default) and HTTP/SSE:

```bash
# stdio (default, for Claude Desktop / Cursor)
npx @wiroai/mcp-server

# HTTP/SSE
TRANSPORT=http PORT=3000 npx @wiroai/mcp-server
```

## License

MIT
