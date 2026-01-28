export class IntentClassifier {
  async classify(input: string, entities: any): Promise<{
    action: string;
    confidence: number;
    parameters: Record<string, any>;
  }> {
    const lowercaseInput = input.toLowerCase();
    let action = '';
    let confidence = 0;
    const parameters: Record<string, any> = {};

    // Intent patterns
    const intentPatterns = [
      { pattern: /turn\s+on|switch\s+on|enable/, action: 'turn_on', confidence: 0.95 },
      { pattern: /turn\s+off|switch\s+off|disable/, action: 'turn_off', confidence: 0.95 },
      { pattern: /toggle/, action: 'toggle', confidence: 0.9 },
      { pattern: /set\s+(?:temperature|temp)/, action: 'set_temperature', confidence: 0.9 },
      { pattern: /set\s+(?:brightness|dim)/, action: 'turn_on', confidence: 0.85 },
      { pattern: /open/, action: 'open', confidence: 0.8 },
      { pattern: /close/, action: 'close', confidence: 0.8 },
      { pattern: /start/, action: 'turn_on', confidence: 0.8 },
      { pattern: /stop/, action: 'turn_off', confidence: 0.8 },
      { pattern: /increase|raise|up/, action: 'turn_on', confidence: 0.7 },
      { pattern: /decrease|lower|down/, action: 'turn_on', confidence: 0.7 },
    ];

    for (const { pattern, action: intentAction, confidence: intentConfidence } of intentPatterns) {
      if (pattern.test(lowercaseInput)) {
        action = intentAction;
        confidence = intentConfidence;
        break;
      }
    }

    // Default fallback
    if (!action) {
      action = 'turn_on';
      confidence = 0.3;
    }

    // Adjust confidence based on entity extraction quality
    if (entities.confidence > 0.8) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    return {
      action,
      confidence,
      parameters,
    };
  }
}