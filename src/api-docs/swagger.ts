import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Home Assistant MCP Server API',
      version: '1.0.0',
      description: 'Comprehensive API for controlling Home Assistant through MCP',
      contact: {
        name: 'Home Assistant MCP',
        url: 'https://github.com/asafalfa/homeassistant-mcp',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
        },
      },
      schemas: {
        Device: {
          type: 'object',
          properties: {
            entity_id: { type: 'string', example: 'light.living_room' },
            state: { type: 'string', example: 'on' },
            attributes: {
              type: 'object',
              properties: {
                friendly_name: { type: 'string', example: 'Living Room Light' },
                brightness: { type: 'number', example: 255 },
                color_temp: { type: 'number', example: 4000 },
              },
            },
          },
        },
        ControlCommand: {
          type: 'object',
          required: ['command', 'entity_id'],
          properties: {
            command: {
              type: 'string',
              enum: ['turn_on', 'turn_off', 'toggle', 'set_temperature', 'set_position'],
              example: 'turn_on',
            },
            entity_id: { type: 'string', example: 'light.living_room' },
            brightness: { type: 'number', minimum: 0, maximum: 255 },
            color_temp: { type: 'number' },
            rgb_color: {
              type: 'array',
              items: { type: 'number' },
              minItems: 3,
              maxItems: 3,
            },
            temperature: { type: 'number' },
            position: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
        Addon: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Node-RED' },
            slug: { type: 'string', example: 'a0d7b954_nodered' },
            description: { type: 'string', example: 'Flow-based programming for IoT' },
            version: { type: 'string', example: '1.2.3' },
            installed: { type: 'boolean', example: true },
            state: { type: 'string', example: 'started' },
          },
        },
        HacsPackage: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'HACS Integration' },
            category: {
              type: 'string',
              enum: ['integration', 'plugin', 'theme', 'python_script', 'appdaemon', 'netdaemon'],
            },
            installed: { type: 'boolean' },
            version_installed: { type: 'string' },
            available_version: { type: 'string' },
          },
        },
        Automation: {
          type: 'object',
          properties: {
            alias: { type: 'string', example: 'Motion Light' },
            description: { type: 'string', example: 'Turn on light when motion detected' },
            mode: {
              type: 'string',
              enum: ['single', 'parallel', 'queued', 'restart'],
              example: 'single',
            },
            trigger: {
              type: 'array',
              items: { type: 'object' },
            },
            condition: {
              type: 'array',
              items: { type: 'object' },
            },
            action: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
        SSEConnection: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'client-uuid' },
            authenticated: { type: 'boolean', example: true },
            subscriptions: {
              type: 'object',
              properties: {
                events: { type: 'array', items: { type: 'string' } },
                entities: { type: 'array', items: { type: 'string' } },
                domains: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        AIRequest: {
          type: 'object',
          required: ['input', 'context'],
          properties: {
            input: { type: 'string', example: 'Turn on the living room lights' },
            context: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                session_id: { type: 'string' },
                timestamp: { type: 'string' },
                location: { type: 'string' },
                previous_actions: { type: 'array', items: { type: 'object' } },
                environment_state: { type: 'object' },
              },
            },
            model: {
              type: 'string',
              enum: ['claude', 'gpt4', 'custom'],
              example: 'claude',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Operation failed' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            details: { type: 'object' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.ts'], // Path to the API docs
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Home Assistant MCP API Documentation",
  }));
};

export default specs;

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 0.1.0
 */

/**
 * @swagger
 * /list_devices:
 *   get:
 *     summary: List all Home Assistant devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 devices:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Device'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /control:
 *   post:
 *     summary: Control Home Assistant devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ControlCommand'
 *     responses:
 *       200:
 *         description: Command executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid command or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /subscribe_events:
 *   get:
 *     summary: Subscribe to real-time events via Server-Sent Events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Authentication token
 *       - in: query
 *         name: events
 *         schema:
 *           type: string
 *         description: Comma-separated list of event types to subscribe to
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: string
 *         description: Specific entity ID to monitor
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *         description: Domain to monitor (e.g., "light", "switch")
 *     responses:
 *       200:
 *         description: SSE connection established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /ai/interpret:
 *   post:
 *     summary: Interpret natural language commands
 *     tags: [AI/NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIRequest'
 *     responses:
 *       200:
 *         description: Command interpreted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 natural_language:
 *                   type: string
 *                   example: "I'll turn on the living room lights"
 *                 structured_data:
 *                   type: object
 *                 next_suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 confidence:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: number
 *                       example: 0.95
 *       400:
 *         description: Could not interpret command
 */
