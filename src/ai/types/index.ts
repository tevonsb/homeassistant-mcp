// AI and NLP related types
export interface AIIntent {
  action: string;
  target: string;
  parameters: Record<string, any>;
  raw_input: string;
}

export interface AIContext {
  user_id: string;
  session_id: string;
  timestamp: string;
  location: string;
  previous_actions: any[];
  environment_state: Record<string, any>;
}

export interface AIConfidence {
  overall: number;
  intent: number;
  entities: number;
  context: number;
}

export interface AIError {
  code: string;
  message: string;
  suggestion: string;
  recovery_options: string[];
  context: AIContext;
}

export interface AIResponse {
  natural_language: string;
  structured_data: {
    success: boolean;
    action_taken: string;
    entities_affected: string[];
    state_changes: Record<string, any>;
  };
  next_suggestions: string[];
  confidence: AIConfidence;
  context: AIContext;
}

export interface AIRateLimit {
  requests_per_minute: number;
  requests_per_hour: number;
  concurrent_requests: number;
  model_specific_limits: Record<AIModel, {
    requests_per_minute: number;
    requests_per_hour: number;
  }>;
}

export type AIModel = 'claude' | 'gpt4' | 'custom';