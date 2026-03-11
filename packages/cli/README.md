# @wiroai/cli

Unofficial CLI for [Wiro AI](https://wiro.ai). Run AI models, download model specs, and manage tasks from your terminal.

> **Disclaimer:** This is an unofficial community project, not affiliated with Wiro AI.

## Installation

```bash
npm install -g @wiroai/cli
```

## Setup

```bash
export WIRO_API_KEY="your-key"
export WIRO_API_SECRET="your-secret"
```

Get your keys at [wiro.ai](https://wiro.ai).

## Commands

### Run a model
```bash
wiro run google/nano-banana-pro -p "A sunset over mountains"
wiro run openai/sora-2 -p "A cat on the beach" --no-wait
wiro run openai/sora-2 -p "prompt" --width 1920 --height 1080
```

### List models
```bash
wiro models
wiro models --category text-to-image
wiro models --search "flux"
```

### Download model spec
```bash
wiro fetch-spec alibaba/wan-2-6
wiro fetch-spec openai/sora-2
```

### Show model parameters
```bash
wiro info alibaba/wan-2-6
wiro info openai/sora-2 --json
```

### Check task status
```bash
wiro status <task-token>
wiro status <task-token> --json
```

### Watch task in real-time
```bash
wiro watch <task-token>
```

### Kill / Cancel tasks
```bash
wiro kill <task-id>
wiro cancel <task-id>
```

### Configuration
```bash
wiro config set apiKey YOUR_KEY
wiro config set apiSecret YOUR_SECRET
wiro config list
```

## License

MIT
