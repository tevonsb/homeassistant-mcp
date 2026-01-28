import { AIModel } from '../types/index.js';

export interface PromptTemplate {
    system: string;
    user: string;
    examples: Array<{
        user: string;
        assistant: string;
    }>;
}

export class PromptTemplateManager {
    private templates: Record<AIModel, PromptTemplate>;

    constructor() {
        this.templates = {
            claude: {
                system: "You are a Home Assistant expert assistant. Convert natural language commands into structured actions for smart home devices.",
                user: "Command: {input}\nContext: {context}\nPlease interpret this command and provide the action, target entity, and parameters.",
                examples: [
                    {
                        user: "Turn on the living room lights",
                        assistant: "Action: turn_on\nTarget: light.living_room\nParameters: {}"
                    },
                    {
                        user: "Set the thermostat to 72 degrees",
                        assistant: "Action: set_temperature\nTarget: climate.thermostat\nParameters: {\"temperature\": 72}"
                    }
                ]
            },
            gpt4: {
                system: "You are an AI assistant specialized in Home Assistant automation. Your task is to interpret natural language commands and convert them into precise device control instructions.",
                user: "Please analyze this command: \"{input}\"\nGiven the context: {context}\nReturn the appropriate action, target device, and any required parameters in JSON format.",
                examples: [
                    {
                        user: "Dim the bedroom lights to 50%",
                        assistant: "{\"action\": \"turn_on\", \"target\": \"light.bedroom\", \"parameters\": {\"brightness\": 128}}"
                    },
                    {
                        user: "Close the garage door",
                        assistant: "{\"action\": \"close\", \"target\": \"cover.garage_door\", \"parameters\": {}}"
                    }
                ]
            },
            custom: {
                system: "Smart home command interpreter. Parse natural language into device actions.",
                user: "Input: {input}\nContext: {context}\nOutput structured command.",
                examples: [
                    {
                        user: "Turn off all lights",
                        assistant: "action=turn_off;target=light.*;parameters={}"
                    }
                ]
            }
        };
    }

    getTemplate(model: AIModel): PromptTemplate {
        return this.templates[model];
    }

    setCustomTemplate(template: PromptTemplate): void {
        this.templates.custom = template;
    }
}