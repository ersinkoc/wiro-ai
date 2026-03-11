# Wiro AI — MCP Server & CLI

Interact with [Wiro AI](https://wiro.ai) models via MCP (for LLM agents) or CLI (for terminal).

## Quick Start

### 1. Install
```bash
npm install -g wiro-mcp-server
# or use with Claude Code / Claude Desktop
```

### 2. Configure
```bash
# Via environment variables
export WIRO_API_KEY="your-api-key"
export WIRO_API_SECRET="your-api-secret"

# Or via CLI
wiro config set apiKey your-api-key
wiro config set apiSecret your-api-secret
```

### 3. Use CLI
```bash
# Generate an image
wiro run google/nano-banana-pro -p "A beautiful sunset over Istanbul"

# Generate a video
wiro run openai/sora-2 -p "A cat walking on the moon" --no-wait

# Check task status
wiro status <task-token>

# Watch task in real-time
wiro watch <task-token>

# List available models
wiro models --category text-to-image
```

### 4. Use as MCP Server

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "wiro": {
      "command": "npx",
      "args": ["wiro-mcp-server"],
      "env": {
        "WIRO_API_KEY": "your-api-key",
        "WIRO_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

#### Claude Code
```bash
claude mcp add wiro -- npx wiro-mcp-server
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `wiro_run_model` | Run any AI model (image, video, audio, text) |
| `wiro_list_models` | Browse available models by category |
| `wiro_task_status` | Check task completion status |
| `wiro_task_wait` | Poll until task completes |
| `wiro_list_categories` | List all model categories |

## CLI Commands

| Command | Description |
|---------|-------------|
| `wiro run <model>` | Run an AI model with parameters |
| `wiro models` | List available models |
| `wiro status <token>` | Check task status |
| `wiro watch <token>` | Watch task via WebSocket |
| `wiro config <sub>` | Manage configuration |

## API Authentication

Wiro AI uses HMAC-SHA256 authentication. You need an API Key and API Secret from [wiro.ai](https://wiro.ai).

## License

MIT
