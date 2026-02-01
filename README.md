# Home Assistant MCP Server

A Model Context Protocol (MCP) server that enables AI assistants like Claude to control your Home Assistant smart home.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.10.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude Code   │   MCP   │  This Server     │  REST   │ Home Assistant  │
│   Claude App    │ ──────► │  (Port 8124)     │ ──────► │ (Port 8123)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js 20.10.0+** or **Docker**
- **Home Assistant** instance with API access
- **Long-Lived Access Token** from Home Assistant

### 1. Get Your Home Assistant Token

1. Open Home Assistant → Profile (bottom left)
2. Scroll to "Long-Lived Access Tokens"
3. Click "Create Token", name it "MCP Server"
4. **Copy immediately** (shown only once)

### 2. Generate an MCP API Key

```bash
openssl rand -base64 32
```

This separates client authentication from your HA credentials (see [Security Model](#security-model)).

### 3. Run the Server

**Option A: Docker (Recommended)**

```bash
docker run -d \
  --name homeassistant-mcp \
  -p 8124:8124 \
  -e HASS_HOST=http://YOUR_HA_IP:8123 \
  -e HASS_TOKEN=your_ha_token \
  -e MCP_API_KEY=your_generated_key \
  ghcr.io/jango-blockchained/homeassistant-mcp:latest
```

**Option B: From Source**

```bash
git clone https://github.com/jango-blockchained/homeassistant-mcp.git
cd homeassistant-mcp
npm install && npm run build

# Create .env file
cat > .env << EOF
HASS_HOST=http://YOUR_HA_IP:8123
HASS_TOKEN=your_ha_token
MCP_API_KEY=your_generated_key
PORT=8124
EOF

npm start
```

**Verify it's running:**

```bash
curl http://localhost:8124/health
# {"status":"ok","timestamp":"...","version":"0.1.0"}
```

## Connect Claude

### Claude Code (HTTP)

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "home-assistant": {
      "type": "http",
      "url": "http://YOUR_SERVER_IP:8124/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

Restart Claude Code to connect.

### Claude Desktop (stdio)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "homeassistant": {
      "command": "node",
      "args": ["/path/to/homeassistant-mcp/dist/src/index.js"],
      "env": {
        "HASS_HOST": "http://YOUR_HA_IP:8123",
        "HASS_TOKEN": "your_ha_token",
        "MCP_API_KEY": "your_generated_key"
      }
    }
  }
}
```

## Security Model

This server uses **two separate tokens** for defense in depth:

| Token | Direction | Purpose |
|-------|-----------|---------|
| `HASS_TOKEN` | Server → Home Assistant | Internal only, never exposed to clients |
| `MCP_API_KEY` | Clients → Server | Shareable, rotate independently from HA |

**Why?** If `MCP_API_KEY` is compromised, revoke it without touching your Home Assistant credentials.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_devices` | List all Home Assistant devices and entities |
| `control` | Control lights, switches, covers, climate, media players |
| `get_history` | Get entity state history |
| `scene` | List and activate scenes |
| `automation` | Toggle or trigger automations |
| `automation_config` | Create and edit automations |
| `addon` | Manage Home Assistant add-ons |
| `package` | Manage HACS packages |
| `notify` | Send notifications |
| `subscribe_events` | Subscribe to real-time state changes (SSE) |
| `get_sse_stats` | Get SSE connection statistics |

## Docker Compose

```yaml
services:
  homeassistant-mcp:
    image: ghcr.io/jango-blockchained/homeassistant-mcp:latest
    ports:
      - "8124:8124"
    environment:
      - HASS_HOST=http://homeassistant:8123
      - HASS_TOKEN=${HASS_TOKEN}
      - MCP_API_KEY=${MCP_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8124/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `FATAL: HASS_TOKEN is required` | Set your HA Long-Lived Access Token in env |
| `FATAL: MCP_API_KEY is required` | Generate one: `openssl rand -base64 32` |
| `Unauthorized - Invalid API key` | Use `MCP_API_KEY` in client config, not `HASS_TOKEN` |
| Connection refused | Check server is running: `curl http://localhost:8124/health` |
| `toSorted is not a function` | Update to Node.js 20.10.0+: `nvm install 20` |
| `fetch failed` on tool calls | Check `HASS_HOST` is reachable from server/container |

## Development

```bash
npm install        # Install dependencies
npm run dev        # Development mode with hot reload
npm run build      # Build for production
npm run lint       # Lint code
npx jest           # Run tests
```

## License

MIT - See [LICENSE](LICENSE)

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Home Assistant](https://www.home-assistant.io/)
- [@digital-alchemy/hass](https://github.com/Digital-Alchemy-TS/hass)
