# 🏠 Enhanced Model Context Protocol Server for Home Assistant

**The most comprehensive MCP server for Home Assistant - now with enterprise-grade features!**

A powerful bridge between your Home Assistant instance and Language Learning Models (LLMs), enabling natural language control and monitoring of your smart home devices through the Model Context Protocol (MCP). This enhanced server provides a comprehensive API for managing your entire Home Assistant ecosystem, from device control to system administration, plus advanced features like energy monitoring, weather integration, backup management, and AI-powered natural language processing.

## 🚀 **NEW: Enterprise-Grade Features Added!**

This server now includes **7 new enhanced tools** and **advanced capabilities** that transform it from a basic MCP server into a production-ready, enterprise-grade smart home automation platform.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.10.0-green.svg)
![Docker Compose](https://img.shields.io/badge/docker-compose-%3E%3D1.27.0-blue.svg)
![NPM](https://img.shields.io/badge/npm-%3E%3D7.0.0-orange.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)
![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)

## 🎯 **Enhanced Features**

### 🆕 **NEW: Advanced Tools (7 Additional Tools)**
- ⚡ **Energy Management**: Monitor solar production, grid usage, battery levels, and get optimization suggestions
- 🌤️ **Weather Integration**: Advanced weather data, forecasts, alerts, and automation suggestions
- 🌐 **Network Monitoring**: Device tracking, security scanning, and performance optimization
- 💾 **Backup Management**: Automated backup scheduling, cloud storage, and restore operations
- 🔄 **Error Recovery**: Intelligent error detection and automated recovery strategies
- 📊 **System Health**: Comprehensive health scoring and performance monitoring
- ✅ **System Validation**: Connection testing and tool validation

### 🎮 **Core Device Control**
- **Device Control**: Control any Home Assistant device through natural language
- **Real-time Updates**: Get instant updates through Server-Sent Events (SSE)
- **Automation Management**: Create, update, and manage automations
- **State Monitoring**: Track and query device states
- **Secure**: Advanced token encryption, rate limiting, and input validation
- **Mobile Ready**: Works with any HTTP-capable client

### 🔒 **Enhanced Security Features**
- **Advanced Token Encryption**: AES-256-GCM encryption for sensitive data
- **Multi-layer Security**: Helmet.js integration and comprehensive middleware
- **Rate Limiting**: IP-based and user-based request throttling
- **Input Validation**: Schema-based parameter checking and sanitization
- **Error Handling**: Secure error responses without information leakage

## 📚 **NEW: Complete API Documentation & AI/NLP Processing**

### 🤖 **AI/NLP Natural Language Processing**
- **Intent Classification**: High-accuracy natural language command interpretation
- **Entity Extraction**: Automatic extraction of device names and parameters
- **Context Awareness**: Session management and user context tracking
- **Multi-Model Support**: Works with Claude, GPT-4, and custom models
- **Error Correction**: Smart suggestions for failed commands

### 📖 **Interactive API Documentation**
- **Swagger UI**: Complete OpenAPI 3.0 specification at `/api-docs`
- **Interactive Testing**: Test all endpoints directly from the documentation
- **Comprehensive Examples**: Request/response examples for every tool
- **Security Documentation**: Authentication and authorization details

## 🔄 **Real-time Updates with SSE**

The server includes a powerful Server-Sent Events (SSE) system that provides real-time updates from your Home Assistant instance. This allows you to:

- 🔄 Get instant state changes for any device
- 📡 Monitor automation triggers and executions
- 🎯 Subscribe to specific domains or entities
- 📊 Track service calls and script executions

### Quick SSE Example

```javascript
const eventSource = new EventSource(
  'http://localhost:3000/subscribe_events?token=YOUR_TOKEN&domain=light'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update received:', data);
};
```

See [SSE_API.md](docs/SSE_API.md) for complete documentation of the SSE system.

## 🆕 **NEW: Enhanced Tools Usage Examples**

### ⚡ **Energy Management**
```bash
# Get energy optimization suggestions
curl -X POST http://localhost:3000/api/energy_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "get_optimization_suggestions"}'

# Monitor solar production
curl -X POST http://localhost:3000/api/energy_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "get_dashboard", "source_type": "solar"}'
```

### 🌤️ **Weather Integration**
```bash
# Get weather automation suggestions
curl -X POST http://localhost:3000/api/weather_integration \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "automation_suggestions"}'

# Check air quality
curl -X POST http://localhost:3000/api/weather_integration \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "air_quality"}'
```

### 💾 **Backup Management**
```bash
# Schedule automated backups
curl -X POST http://localhost:3000/api/backup_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "schedule", "schedule": {"frequency": "daily", "time": "02:00:00"}}'

# Get backup statistics
curl -X POST http://localhost:3000/api/backup_management \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "statistics"}'
```

### 📊 **System Health**
```bash
# Get overall system health score
curl -X POST http://localhost:3000/api/system_health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "overall_health"}'

# Check performance metrics
curl -X POST http://localhost:3000/api/system_health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "performance_metrics"}'
```

## Table of Contents

- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
- [Configuration](#configuration)
- [Development](#development)
- [API Reference](#api-reference)
  - [Device Control](#device-control)
  - [Add-on Management](#add-on-management)
  - [Package Management](#package-management)
  - [Automation Management](#automation-management)
- [Natural Language Integration](#natural-language-integration)
- [Troubleshooting](#troubleshooting)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [Resources](#resources)
- [License](#license)

## Key Features

### Core Functionality 🎮
- **Smart Device Control**
  - 💡 **Lights**: Brightness, color temperature, RGB color
  - 🌡️ **Climate**: Temperature, HVAC modes, fan modes, humidity
  - 🚪 **Covers**: Position and tilt control
  - 🔌 **Switches**: On/off control
  - 🚨 **Sensors & Contacts**: State monitoring
  - 🎵 **Media Players**: Playback control, volume, source selection
  - 🌪️ **Fans**: Speed, oscillation, direction
  - 🔒 **Locks**: Lock/unlock control
  - 🧹 **Vacuums**: Start, stop, return to base
  - 📹 **Cameras**: Motion detection, snapshots

### System Management 🛠️
- **Add-on Management**
  - Browse available add-ons
  - Install/uninstall add-ons
  - Start/stop/restart add-ons
  - Version management
  - Configuration access

- **Package Management (HACS)**
  - Integration with Home Assistant Community Store
  - Multiple package types support:
    - Custom integrations
    - Frontend themes
    - Python scripts
    - AppDaemon apps
    - NetDaemon apps
  - Version control and updates
  - Repository management

- **Automation Management**
  - Create and edit automations
  - Advanced configuration options:
    - Multiple trigger types
    - Complex conditions
    - Action sequences
    - Execution modes
  - Duplicate and modify existing automations
  - Enable/disable automation rules
  - Trigger automation manually

### Architecture Features 🏗️
- **Intelligent Organization**
  - Area and floor-based device grouping
  - State monitoring and querying
  - Smart context awareness
  - Historical data access

- **Robust Architecture**
  - Comprehensive error handling
  - State validation
  - Secure API integration
  - TypeScript type safety
  - Extensive test coverage

## Prerequisites

- **Node.js** 20.10.0 or higher
- **NPM** package manager
- **Docker Compose** for containerization
- Running **Home Assistant** instance
- Home Assistant long-lived access token ([How to get token](https://community.home-assistant.io/t/how-to-get-long-lived-access-token/162159))
- **HACS** installed for package management features
- **Supervisor** access for add-on management

## Installation

### Basic Setup

```bash
# Clone the repository
git clone https://github.com/tevonsb/homeassistant-mcp.git
cd homeassistant-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Docker Setup (Recommended)

The project includes Docker support for easy deployment and consistent environments across different platforms.

1. **Clone the repository:**
    ```bash
    git clone https://github.com/tevonsb/homeassistant-mcp.git
    cd homeassistant-mcp
    ```

2. **Configure environment:**
    ```bash
    cp .env.example .env
    ```
    Edit the `.env` file with your Home Assistant configuration:
    ```env
    # Home Assistant Configuration
    HASS_HOST=http://homeassistant.local:8123
    HASS_TOKEN=your_home_assistant_token
    HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket

    # Server Configuration
    PORT=3000
    NODE_ENV=production
    DEBUG=false
    ```

3. **Build and run with Docker Compose:**
    ```bash
    # Build and start the containers
    docker compose up -d

    # View logs
    docker compose logs -f

    # Stop the service
    docker compose down
    ```

4. **Verify the installation:**
    The server should now be running at `http://localhost:3000`. You can check the health endpoint at `http://localhost:3000/health`.

5. **Update the application:**
    ```bash
    # Pull the latest changes
    git pull

    # Rebuild and restart the containers
    docker compose up -d --build
    ```

#### Docker Configuration

The Docker setup includes:
- Multi-stage build for optimal image size
- Health checks for container monitoring
- Volume mounting for environment configuration
- Automatic container restart on failure
- Exposed port 3000 for API access

#### Docker Compose Environment Variables

All environment variables can be configured in the `.env` file. The following variables are supported:
- `HASS_HOST`: Your Home Assistant instance URL
- `HASS_TOKEN`: Long-lived access token for Home Assistant
- `HASS_SOCKET_URL`: WebSocket URL for Home Assistant
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development)
- `DEBUG`: Enable debug mode (true/false)

## Configuration

### Environment Variables

```env
# Home Assistant Configuration
HASS_HOST=http://homeassistant.local:8123  # Your Home Assistant instance URL
HASS_TOKEN=your_home_assistant_token       # Long-lived access token
HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket  # WebSocket URL

# Server Configuration
PORT=3000                # Server port (default: 3000)
NODE_ENV=production     # Environment (production/development)
DEBUG=false            # Enable debug mode

# Test Configuration
TEST_HASS_HOST=http://localhost:8123  # Test instance URL
TEST_HASS_TOKEN=test_token           # Test token
```

### Configuration Files

1. **Development**: Copy `.env.example` to `.env.development`
2. **Production**: Copy `.env.example` to `.env.production`
3. **Testing**: Copy `.env.example` to `.env.test`

### Adding to Claude Desktop (or other clients)

To use your new Home Assistant MCP server, you can add Claude Desktop as a client. Add the following to the configuration. Note this will run the MCP within claude and does not work with the Docker method.

```
{
  "homeassistant": {
    "command": "node",
    "args": [<path/to/your/dist/folder>]
    "env": {
      NODE_ENV=development
      HASS_HOST=http://homeassistant.local:8123
      HASS_TOKEN=your_home_assistant_token
      PORT=3000
      HASS_SOCKET_URL=ws://homeassistant.local:8123/api/websocket
      LOG_LEVEL=debug
    }
  }
}

```



## API Reference

### Device Control

#### Common Entity Controls
```json
{
  "tool": "control",
  "command": "turn_on",  // or "turn_off", "toggle"
  "entity_id": "light.living_room"
}
```

#### Light Control
```json
{
  "tool": "control",
  "command": "turn_on",
  "entity_id": "light.living_room",
  "brightness": 128,
  "color_temp": 4000,
  "rgb_color": [255, 0, 0]
}
```

### Add-on Management

#### List Available Add-ons
```json
{
  "tool": "addon",
  "action": "list"
}
```

#### Install Add-on
```json
{
  "tool": "addon",
  "action": "install",
  "slug": "core_configurator",
  "version": "5.6.0"
}
```

#### Manage Add-on State
```json
{
  "tool": "addon",
  "action": "start",  // or "stop", "restart"
  "slug": "core_configurator"
}
```

### Package Management

#### List HACS Packages
```json
{
  "tool": "package",
  "action": "list",
  "category": "integration"  // or "plugin", "theme", "python_script", "appdaemon", "netdaemon"
}
```

#### Install Package
```json
{
  "tool": "package",
  "action": "install",
  "category": "integration",
  "repository": "hacs/integration",
  "version": "1.32.0"
}
```

### Automation Management

#### Create Automation
```json
{
  "tool": "automation_config",
  "action": "create",
  "config": {
    "alias": "Motion Light",
    "description": "Turn on light when motion detected",
    "mode": "single",
    "trigger": [
      {
        "platform": "state",
        "entity_id": "binary_sensor.motion",
        "to": "on"
      }
    ],
    "action": [
      {
        "service": "light.turn_on",
        "target": {
          "entity_id": "light.living_room"
        }
      }
    ]
  }
}
```

#### Duplicate Automation
```json
{
  "tool": "automation_config",
  "action": "duplicate",
  "automation_id": "automation.motion_light"
}
```

### Core Functions

#### State Management
```http
GET /api/state
POST /api/state
```

Manages the current state of the system.

**Example Request:**
```json
POST /api/state
{
  "context": "living_room",
  "state": {
    "lights": "on",
    "temperature": 22
  }
}
```

#### Context Updates
```http
POST /api/context
```

Updates the current context with new information.

**Example Request:**
```json
POST /api/context
{
  "user": "john",
  "location": "kitchen",
  "time": "morning",
  "activity": "cooking"
}
```

### Action Endpoints

#### Execute Action
```http
POST /api/action
```

Executes a specified action with given parameters.

**Example Request:**
```json
POST /api/action
{
  "action": "turn_on_lights",
  "parameters": {
    "room": "living_room",
    "brightness": 80
  }
}
```

#### Batch Actions
```http
POST /api/actions/batch
```

Executes multiple actions in sequence.

**Example Request:**
```json
POST /api/actions/batch
{
  "actions": [
    {
      "action": "turn_on_lights",
      "parameters": {
        "room": "living_room"
      }
    },
    {
      "action": "set_temperature",
      "parameters": {
        "temperature": 22
      }
    }
  ]
}
```

### Query Functions

#### Get Available Actions
```http
GET /api/actions
```

Returns a list of all available actions.

**Example Response:**
```json
{
  "actions": [
    {
      "name": "turn_on_lights",
      "parameters": ["room", "brightness"],
      "description": "Turns on lights in specified room"
    },
    {
      "name": "set_temperature",
      "parameters": ["temperature"],
      "description": "Sets temperature in current context"
    }
  ]
}
```

#### Context Query
```http
GET /api/context?type=current
```

Retrieves context information.

**Example Response:**
```json
{
  "current_context": {
    "user": "john",
    "location": "kitchen",
    "time": "morning",
    "activity": "cooking"
  }
}
```

### WebSocket Events

The server supports real-time updates via WebSocket connections.

```javascript
// Client-side connection example
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};
```

#### Supported Events

- `state_change`: Emitted when system state changes
- `context_update`: Emitted when context is updated
- `action_executed`: Emitted when an action is completed
- `error`: Emitted when an error occurs

**Example Event Data:**
```json
{
  "event": "state_change",
  "data": {
    "previous_state": {
      "lights": "off"
    },
    "current_state": {
      "lights": "on"
    },
    "timestamp": "2024-03-20T10:30:00Z"
  }
}
```

### Error Handling

All endpoints return standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Missing required parameter: room",
    "details": {
      "missing_fields": ["room"]
    }
  }
}
```

### Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per minute per IP for regular endpoints
- 1000 requests per minute per IP for WebSocket connections

When rate limit is exceeded, the server returns:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "reset_time": "2024-03-20T10:31:00Z"
  }
}
```

### Example Usage

#### Using curl
```bash
# Get current state
curl -X GET \
  http://localhost:3000/api/state \
  -H 'Authorization: ApiKey your_api_key_here'

# Execute action
curl -X POST \
  http://localhost:3000/api/action \
  -H 'Authorization: ApiKey your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "turn_on_lights",
    "parameters": {
      "room": "living_room",
      "brightness": 80
    }
  }'
```

#### Using JavaScript
```javascript
// Execute action
async function executeAction() {
  const response = await fetch('http://localhost:3000/api/action', {
    method: 'POST',
    headers: {
      'Authorization': 'ApiKey your_api_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'turn_on_lights',
      parameters: {
        room: 'living_room',
        brightness: 80
      }
    })
  });
  
  const data = await response.json();
  console.log('Action result:', data);
}
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Build project
npm run build

# Production mode
npm run start

# Run tests
npx jest --config=jest.config.cjs

# Run tests with coverage
npx jest --coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Common Issues

1. **Node.js Version (`toSorted is not a function`)**
   - **Solution:** Update to Node.js 20.10.0+
   ```bash
   nvm install 20.10.0
   nvm use 20.10.0
   ```

2. **Connection Issues**
   - Verify Home Assistant is running
   - Check `HASS_HOST` accessibility
   - Validate token permissions
   - Ensure WebSocket connection for real-time updates

3. **Add-on Management Issues**
   - Verify Supervisor access
   - Check add-on compatibility
   - Validate system resources

4. **HACS Integration Issues**
   - Verify HACS installation
   - Check HACS integration status
   - Validate repository access

5. **Automation Issues**
   - Verify entity availability
   - Check trigger conditions
   - Validate service calls
   - Monitor execution logs

## 🎯 **Project Status**

✅ **Complete & Enhanced**
- Entity, Floor, and Area access
- Device control (Lights, Climate, Covers, Switches, Contacts)
- Add-on management system
- Package management through HACS
- Advanced automation configuration
- Basic state management
- Error handling and validation
- Docker containerization
- Jest testing setup
- TypeScript integration
- Environment variable management
- Home Assistant API integration
- Project documentation

🚀 **NEW: Enterprise-Grade Features Added**

- ⚡ **Energy Management & Monitoring** - Complete energy optimization system
- 🌤️ **Advanced Weather Integration** - Weather-based automation suggestions
- 🌐 **Network Monitoring & Security** - Device tracking and security scanning
- 💾 **Backup Management** - Automated scheduling and cloud storage
- 🔄 **Error Recovery Systems** - Intelligent error detection and recovery
- 📊 **System Health Monitoring** - Comprehensive health scoring
- ✅ **System Validation** - Connection and tool testing
- 🔒 **Enhanced Security** - AES encryption, rate limiting, input validation
- 📚 **API Documentation** - Complete Swagger UI integration
- 🤖 **AI/NLP Processing** - Natural language command interpretation
- 🔄 **WebSocket Implementation** - Real-time updates and communication
- 🚀 **Performance Optimization** - Caching, batching, and resource management

🏆 **Production Ready**

This enhanced MCP server is now suitable for both development and production environments, with enterprise-grade security, monitoring, and automation capabilities.

## 🆕 **Enhanced Tools Overview**

### ⚡ **Energy Management Tool**
The `energy_management` tool provides comprehensive energy monitoring and optimization:
- **Solar Production Tracking**: Monitor solar panel efficiency and production
- **Grid Usage Analysis**: Track import/export and cost analysis
- **Battery Management**: Monitor charge levels and optimization
- **Device Consumption**: Track individual device energy usage
- **Optimization Suggestions**: AI-powered recommendations for energy savings

### 🌤️ **Weather Integration Tool**
The `weather_integration` tool offers advanced weather capabilities:
- **Current Conditions**: Real-time weather data and air quality
- **Forecasts**: Multi-day and hourly weather predictions
- **Weather Alerts**: Severe weather warnings and notifications
- **Automation Suggestions**: Weather-based smart home optimization
- **Historical Data**: Weather trend analysis and patterns

### 🌐 **Network Monitoring Tool**
The `network_monitoring` tool provides network security and performance:
- **Device Tracking**: Monitor all connected devices and their status
- **Security Scanning**: Detect unknown devices and vulnerabilities
- **Performance Metrics**: Network speed and health assessment
- **Data Usage**: Monitor bandwidth consumption and patterns
- **Optimization**: Network performance recommendations

### 💾 **Backup Management Tool**
The `backup_management` tool offers enterprise-grade backup solutions:
- **Automated Scheduling**: Daily, weekly, or monthly backup schedules
- **Cloud Storage**: Support for local and cloud backup locations
- **Selective Backups**: Choose specific add-ons and folders
- **Password Protection**: Encrypted backup security
- **Restore Operations**: Complete system restoration capabilities

### 🔄 **Error Recovery Tool**
The `error_recovery` tool provides intelligent error handling:
- **Pattern Detection**: Identify recurring error patterns
- **Automated Recovery**: Self-healing for common issues
- **Circuit Breaker**: Protect against cascading failures
- **Error Analytics**: Comprehensive error reporting and analysis
- **Recovery Strategies**: Multiple recovery approaches for different scenarios

### 📊 **System Health Tool**
The `system_health` tool offers comprehensive monitoring:
- **Health Scoring**: Overall system health assessment (0-100)
- **Performance Metrics**: Memory, CPU, and response time monitoring
- **Integration Status**: Check all system components and services
- **Proactive Recommendations**: Optimization suggestions before issues occur
- **Resource Monitoring**: Track system resource usage and trends

### ✅ **System Validation Tool**
The `system_validation` tool provides testing and validation:
- **Connection Testing**: Verify Home Assistant connectivity
- **Tool Validation**: Ensure all enhanced tools are working
- **System Status**: Comprehensive system status overview
- **Performance Testing**: Validate system performance metrics
- **Integration Testing**: Test all system integrations

## 🚀 **Getting Started with Enhanced Features**

### **1. Access API Documentation**
Visit `http://localhost:3000/api-docs` for interactive API documentation

### **2. Test Enhanced Tools**
Use the `system_validation` tool to verify all features are working:
```bash
curl -X POST http://localhost:3000/api/system_validation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "check_tools"}'
```

### **3. Monitor System Health**
Get a complete system overview:
```bash
curl -X POST http://localhost:3000/api/system_health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "overall_health"}'
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/introduction)
- [Home Assistant Docs](https://www.home-assistant.io)
- [HA REST API](https://developers.home-assistant.io/docs/api/rest)
- [HACS Documentation](https://hacs.xyz)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## License

MIT License - See [LICENSE](LICENSE) file
