# A Model Context Protocol Server for Home Assistant

The server uses the MCP protocol to share access to a local Home Assistant instance with an LLM application.

More about MCP here: https://modelcontextprotocol.io/introduction

More about Home Assistant here: https://www.home-assistant.io

## Usage

First build the server

```
yarn build
```

Then configure your application (like Claude Desktop) to use it.

```
{
    "mcpServers": {
        "homeassistant": {
            "command": "node",
            "args": [
                "/Users/tevonsb/Desktop/mcp/dist/index.js"
            ],
            "env": {
                "TOKEN": <home_assistant_token>,
                "BASE_URL": <base_url_for_home_assistant>
            }
        }
    }
}
```

You'll need a personal access token from home assistant.

Get one using this guide: https://community.home-assistant.io/t/how-to-get-long-lived-access-token/162159

## In Progress

- [x] Access to entities
- [x] Access to Floors
- [x] Access to Areas
- [ ] Control for entities
    - [ ] Lights
    - [ ] Thermostats
    - [ ] Covers
- [ ] Testing / writing custom prompts
- [ ] Testing using resources for high-level context
- [ ] Test varying tool organization
