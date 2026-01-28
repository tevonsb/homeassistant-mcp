import { AIIntent, AIContext } from '../types/index.js';

export class ContextAnalyzer {
  async analyze(intent: AIIntent, context: AIContext): Promise<{
    confidence: number;
    relevant_params: Record<string, any>;
  }> {
    const relevantParams: Record<string, any> = {};
    let confidence = 0.5; // Base confidence

    // Analyze location context
    if (context.location && intent.target) {
      const targetLocation = this.extractLocationFromTarget(intent.target);
      if (targetLocation && targetLocation.toLowerCase() === context.location.toLowerCase()) {
        confidence += 0.2;
        relevantParams.location_match = true;
      }
    }

    // Analyze previous actions
    if (context.previous_actions && context.previous_actions.length > 0) {
      const recentActions = context.previous_actions.slice(-3);
      const similarActions = recentActions.filter(action => 
        action.action === intent.action || 
        (action.target && intent.target && action.target.split('.')[0] === intent.target.split('.')[0])
      );

      if (similarActions.length > 0) {
        confidence += 0.15;
        relevantParams.action_pattern = true;
      }
    }

    // Analyze environment state
    if (context.environment_state) {
      // Check if target device is available
      const deviceDomain = intent.target.split('.')[0];
      if (context.environment_state[deviceDomain]) {
        confidence += 0.1;
        relevantParams.device_available = true;
      }

      // Time-based context
      const currentHour = new Date().getHours();
      if (intent.action === 'turn_on' && deviceDomain === 'light' && currentHour >= 18) {
        confidence += 0.1;
        relevantParams.evening_lighting = true;
      } else if (intent.action === 'turn_off' && deviceDomain === 'light' && currentHour >= 22) {
        confidence += 0.1;
        relevantParams.night_mode = true;
      }
    }

    // Analyze session continuity
    const sessionAge = Date.now() - new Date(context.timestamp).getTime();
    if (sessionAge < 5 * 60 * 1000) { // Within 5 minutes
      confidence += 0.05;
      relevantParams.session_active = true;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      confidence,
      relevant_params: relevantParams,
    };
  }

  private extractLocationFromTarget(target: string): string | null {
    const parts = target.split('.');
    if (parts.length >= 2) {
      const entityName = parts[1];
      // Common room patterns
      const roomPatterns = [
        'living_room', 'bedroom', 'kitchen', 'bathroom', 'office',
        'garage', 'basement', 'attic', 'dining_room', 'family_room',
        'guest_room', 'master_bedroom', 'kids_room', 'study', 'hallway',
      ];

      for (const room of roomPatterns) {
        if (entityName.includes(room)) {
          return room.replace('_', ' ');
        }
      }
    }
    return null;
  }
}