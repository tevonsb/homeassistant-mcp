import './polyfills.js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { get_hass } from './hass/index.js';
import { LiteMCP } from 'litemcp';
import { z } from 'zod';
import { DomainSchema } from './schemas.js';
import { createEnhancedTools } from './tools/enhanced-tools.js';

// Suppress Home Assistant verbose logging for clean MCP stdio
process.env.LOG_LEVEL = 'error';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env'
  : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env.development';

config({ path: resolve(process.cwd(), envFile) });

// Configuration
const HASS_HOST = process.env.HASS_HOST || 'http://192.168.178.63:8123';
const HASS_TOKEN = process.env.HASS_TOKEN;

// Define Tool interface
interface Tool {
  name: string;
  description: string;
  parameters: z.ZodType<any>;
  execute: (params: any) => Promise<any>;
}

interface CommandParams {
  command: string;
  entity_id: string;
  // Common parameters
  state?: string;
  // Light parameters
  brightness?: number;
  color_temp?: number;
  rgb_color?: [number, number, number];
  // Cover parameters
  position?: number;
  tilt_position?: number;
  // Climate parameters
  temperature?: number;
  target_temp_high?: number;
  target_temp_low?: number;
  hvac_mode?: string;
  fan_mode?: string;
  humidity?: number;
}

const commonCommands = ['turn_on', 'turn_off', 'toggle'] as const;
const coverCommands = [...commonCommands, 'open', 'close', 'stop', 'set_position', 'set_tilt_position'] as const;
const climateCommands = [...commonCommands, 'set_temperature', 'set_hvac_mode', 'set_fan_mode', 'set_humidity'] as const;

interface HassState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    description?: string;
    [key: string]: any;
  };
}

interface HistoryParams {
  entity_id: string;
  start_time?: string;
  end_time?: string;
  minimal_response?: boolean;
  significant_changes_only?: boolean;
}

interface SceneParams {
  action: 'list' | 'activate';
  scene_id?: string;
}

interface NotifyParams {
  message: string;
  title?: string;
  target?: string;
  data?: Record<string, any>;
}

interface AutomationParams {
  action: 'list' | 'toggle' | 'trigger';
  automation_id?: string;
}

async function main() {
  console.error('Initializing Home Assistant MCP Server for stdio...');
  
  const hass = await get_hass();
  
  // Initialize LiteMCP for stdio
  const server = new LiteMCP('home-assistant', '0.1.0');

  // Add the list devices tool
  const listDevicesTool = {
    name: 'list_devices',
    description: 'List all available Home Assistant devices',
    parameters: z.object({}).describe('No parameters required'),
    execute: async () => {
      try {
        const response = await fetch(`${HASS_HOST}/api/states`, {
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch devices: ${response.statusText}`);
        }

        const states = await response.json() as HassState[];
        const devices: Record<string, HassState[]> = {};

        // Group devices by domain
        states.forEach(state => {
          const [domain] = state.entity_id.split('.');
          if (!devices[domain]) {
            devices[domain] = [];
          }
          devices[domain].push(state);
        });

        return {
          success: true,
          devices
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  };
  server.addTool(listDevicesTool);

  // Add the Home Assistant control tool
  const controlTool = {
    name: 'control',
    description: 'Control Home Assistant devices and services',
    parameters: z.object({
      command: z.enum([...commonCommands, ...coverCommands, ...climateCommands])
        .describe('The command to execute'),
      entity_id: z.string().describe('The entity ID to control'),
      // Common parameters
      state: z.string().optional().describe('The desired state for the entity'),
      // Light parameters
      brightness: z.number().min(0).max(255).optional()
        .describe('Brightness level for lights (0-255)'),
      color_temp: z.number().optional()
        .describe('Color temperature for lights'),
      rgb_color: z.tuple([z.number(), z.number(), z.number()]).optional()
        .describe('RGB color values'),
      // Cover parameters
      position: z.number().min(0).max(100).optional()
        .describe('Position for covers (0-100)'),
      tilt_position: z.number().min(0).max(100).optional()
        .describe('Tilt position for covers (0-100)'),
      // Climate parameters
      temperature: z.number().optional()
        .describe('Target temperature for climate devices'),
      target_temp_high: z.number().optional()
        .describe('Target high temperature for climate devices'),
      target_temp_low: z.number().optional()
        .describe('Target low temperature for climate devices'),
      hvac_mode: z.enum(['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only']).optional()
        .describe('HVAC mode for climate devices'),
      fan_mode: z.enum(['auto', 'low', 'medium', 'high']).optional()
        .describe('Fan mode for climate devices'),
      humidity: z.number().min(0).max(100).optional()
        .describe('Target humidity for climate devices')
    }),
    execute: async (params: CommandParams) => {
      try {
        const domain = params.entity_id.split('.')[0] as keyof typeof DomainSchema.Values;

        if (!Object.values(DomainSchema.Values).includes(domain)) {
          throw new Error(`Unsupported domain: ${domain}`);
        }

        const service = params.command;
        const serviceData: Record<string, any> = {
          entity_id: params.entity_id
        };

        // Handle domain-specific parameters
        switch (domain) {
          case 'light':
            if (params.brightness !== undefined) {
              serviceData.brightness = params.brightness;
            }
            if (params.color_temp !== undefined) {
              serviceData.color_temp = params.color_temp;
            }
            if (params.rgb_color !== undefined) {
              serviceData.rgb_color = params.rgb_color;
            }
            break;

          case 'cover':
            if (service === 'set_position' && params.position !== undefined) {
              serviceData.position = params.position;
            }
            if (service === 'set_tilt_position' && params.tilt_position !== undefined) {
              serviceData.tilt_position = params.tilt_position;
            }
            break;

          case 'climate':
            if (service === 'set_temperature') {
              if (params.temperature !== undefined) {
                serviceData.temperature = params.temperature;
              }
              if (params.target_temp_high !== undefined) {
                serviceData.target_temp_high = params.target_temp_high;
              }
              if (params.target_temp_low !== undefined) {
                serviceData.target_temp_low = params.target_temp_low;
              }
            }
            if (service === 'set_hvac_mode' && params.hvac_mode !== undefined) {
              serviceData.hvac_mode = params.hvac_mode;
            }
            if (service === 'set_fan_mode' && params.fan_mode !== undefined) {
              serviceData.fan_mode = params.fan_mode;
            }
            if (service === 'set_humidity' && params.humidity !== undefined) {
              serviceData.humidity = params.humidity;
            }
            break;

          case 'switch':
          case 'contact':
            // These domains only support basic operations (turn_on, turn_off, toggle)
            break;

          default:
            throw new Error(`Unsupported operation for domain: ${domain}`);
        }

        // Call Home Assistant service
        try {
          const response = await fetch(`${HASS_HOST}/api/services/${domain}/${service}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(serviceData),
          });

          if (!response.ok) {
            throw new Error(`Failed to execute ${service} for ${params.entity_id}: ${response.statusText}`);
          }

          return {
            success: true,
            message: `Successfully executed ${service} for ${params.entity_id}`
          };
        } catch (error) {
          throw new Error(`Failed to execute ${service} for ${params.entity_id}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  };
  server.addTool(controlTool);

  // Add the history tool
  const historyTool = {
    name: 'get_history',
    description: 'Get state history for Home Assistant entities',
    parameters: z.object({
      entity_id: z.string().describe('The entity ID to get history for'),
      start_time: z.string().optional().describe('Start time in ISO format. Defaults to 24 hours ago'),
      end_time: z.string().optional().describe('End time in ISO format. Defaults to now'),
      minimal_response: z.boolean().optional().describe('Return minimal response to reduce data size'),
      significant_changes_only: z.boolean().optional().describe('Only return significant state changes'),
    }),
    execute: async (params: HistoryParams) => {
      try {
        const now = new Date();
        const startTime = params.start_time ? new Date(params.start_time) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const endTime = params.end_time ? new Date(params.end_time) : now;

        // Build query parameters
        const queryParams = new URLSearchParams({
          filter_entity_id: params.entity_id,
          minimal_response: String(!!params.minimal_response),
          significant_changes_only: String(!!params.significant_changes_only),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        });

        const response = await fetch(`${HASS_HOST}/api/history/period/${startTime.toISOString()}?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const history = await response.json();
        return {
          success: true,
          history,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  };
  server.addTool(historyTool);

  // Add the scenes tool
  const sceneTool = {
    name: 'scene',
    description: 'Manage and activate Home Assistant scenes',
    parameters: z.object({
      action: z.enum(['list', 'activate']).describe('Action to perform with scenes'),
      scene_id: z.string().optional().describe('Scene ID to activate (required for activate action)'),
    }),
    execute: async (params: SceneParams) => {
      try {
        if (params.action === 'list') {
          const response = await fetch(`${HASS_HOST}/api/states`, {
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch scenes: ${response.statusText}`);
          }

          const states = (await response.json()) as HassState[];
          const scenes = states.filter((state) => state.entity_id.startsWith('scene.'));

          return {
            success: true,
            scenes: scenes.map((scene) => ({
              entity_id: scene.entity_id,
              name: scene.attributes.friendly_name || scene.entity_id.split('.')[1],
              description: scene.attributes.description,
            })),
          };
        } else if (params.action === 'activate') {
          if (!params.scene_id) {
            throw new Error('Scene ID is required for activate action');
          }

          const response = await fetch(`${HASS_HOST}/api/services/scene/turn_on`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entity_id: params.scene_id,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to activate scene: ${response.statusText}`);
          }

          return {
            success: true,
            message: `Successfully activated scene ${params.scene_id}`,
          };
        }

        throw new Error('Invalid action specified');
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  };
  server.addTool(sceneTool);

  // Add the notification tool
  const notifyTool = {
    name: 'notify',
    description: 'Send notifications through Home Assistant',
    parameters: z.object({
      message: z.string().describe('The notification message'),
      title: z.string().optional().describe('The notification title'),
      target: z.string().optional().describe('Specific notification target (e.g., mobile_app_phone)'),
      data: z.record(z.any()).optional().describe('Additional notification data'),
    }),
    execute: async (params: NotifyParams) => {
      try {
        const service = params.target ? `notify.${params.target}` : 'notify.notify';
        const [domain, service_name] = service.split('.');

        const response = await fetch(`${HASS_HOST}/api/services/${domain}/${service_name}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${HASS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: params.message,
            title: params.title,
            data: params.data,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`);
        }

        return {
          success: true,
          message: 'Notification sent successfully',
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  };
  server.addTool(notifyTool);

  // Add the automation tool
  const automationTool = {
    name: 'automation',
    description: 'Manage Home Assistant automations',
    parameters: z.object({
      action: z.enum(['list', 'toggle', 'trigger']).describe('Action to perform with automation'),
      automation_id: z.string().optional().describe('Automation ID (required for toggle and trigger actions)'),
    }),
    execute: async (params: AutomationParams) => {
      try {
        if (params.action === 'list') {
          const response = await fetch(`${HASS_HOST}/api/states`, {
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch automations: ${response.statusText}`);
          }

          const states = (await response.json()) as HassState[];
          const automations = states.filter((state) => state.entity_id.startsWith('automation.'));

          return {
            success: true,
            automations: automations.map((automation) => ({
              entity_id: automation.entity_id,
              name: automation.attributes.friendly_name || automation.entity_id.split('.')[1],
              state: automation.state,
              last_triggered: automation.attributes.last_triggered,
            })),
          };
        } else {
          if (!params.automation_id) {
            throw new Error('Automation ID is required for toggle and trigger actions');
          }

          const service = params.action === 'toggle' ? 'toggle' : 'trigger';
          const response = await fetch(`${HASS_HOST}/api/services/automation/${service}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entity_id: params.automation_id,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to ${service} automation: ${response.statusText}`);
          }

          return {
            success: true,
            message: `Successfully ${service}d automation ${params.automation_id}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  };
  server.addTool(automationTool);

  // Add enhanced tools if HASS credentials are available
  if (HASS_HOST && HASS_TOKEN) {
    const enhancedTools = createEnhancedTools(HASS_HOST, HASS_TOKEN);
    enhancedTools.forEach((tool: any) => {
      server.addTool(tool);
    });
    console.error(`Enhanced tools loaded: ${enhancedTools.length} additional tools`);
  } else {
    console.error('HASS_HOST or HASS_TOKEN not configured - enhanced tools disabled');
  }

  console.error('Starting MCP Server on stdio...');
  
  // Start the server on stdio (this is what Cursor expects)
  await server.start();
  
  console.error('MCP Server ready for stdio communication');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
