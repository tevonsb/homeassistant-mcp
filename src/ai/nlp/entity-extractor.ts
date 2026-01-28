export class EntityExtractor {
  async extract(input: string): Promise<{
    primary_target: string;
    parameters: Record<string, any>;
    confidence: number;
  }> {
    // Simple pattern-based entity extraction
    // In a real implementation, this would use more sophisticated NLP
    
    const lowercaseInput = input.toLowerCase();
    let primaryTarget = '';
    const parameters: Record<string, any> = {};
    
    // Extract device names and rooms
    const devicePatterns = [
      /(?:light|lamp)s?\s+(?:in\s+)?(?:the\s+)?(\w+)/,
      /(\w+)\s+(?:light|lamp)s?/,
      /(?:climate|thermostat|ac)\s+(?:in\s+)?(?:the\s+)?(\w+)/,
      /(\w+)\s+(?:climate|thermostat|ac)/,
      /(?:switch|outlet)\s+(?:in\s+)?(?:the\s+)?(\w+)/,
      /(\w+)\s+(?:switch|outlet)/,
    ];

    for (const pattern of devicePatterns) {
      const match = lowercaseInput.match(pattern);
      if (match) {
        const room = match[1];
        if (lowercaseInput.includes('light') || lowercaseInput.includes('lamp')) {
          primaryTarget = `light.${room.replace(/\s+/g, '_')}`;
        } else if (lowercaseInput.includes('climate') || lowercaseInput.includes('thermostat')) {
          primaryTarget = `climate.${room.replace(/\s+/g, '_')}`;
        } else if (lowercaseInput.includes('switch') || lowercaseInput.includes('outlet')) {
          primaryTarget = `switch.${room.replace(/\s+/g, '_')}`;
        }
        break;
      }
    }

    // Extract numeric parameters
    const tempMatch = lowercaseInput.match(/(\d+)\s*(?:degrees?|°)/);
    if (tempMatch) {
      parameters.temperature = parseInt(tempMatch[1]);
    }

    const brightnessMatch = lowercaseInput.match(/(\d+)%|brightness\s+(\d+)/);
    if (brightnessMatch) {
      const brightness = parseInt(brightnessMatch[1] || brightnessMatch[2]);
      parameters.brightness = Math.round((brightness / 100) * 255);
    }

    // Extract colors
    const colorMatch = lowercaseInput.match(/\b(red|green|blue|yellow|orange|purple|pink|white|warm|cool)\b/);
    if (colorMatch) {
      const colorMap: Record<string, [number, number, number]> = {
        red: [255, 0, 0],
        green: [0, 255, 0],
        blue: [0, 0, 255],
        yellow: [255, 255, 0],
        orange: [255, 165, 0],
        purple: [128, 0, 128],
        pink: [255, 192, 203],
        white: [255, 255, 255],
      };
      
      if (colorMap[colorMatch[1]]) {
        parameters.rgb_color = colorMap[colorMatch[1]];
      } else if (colorMatch[1] === 'warm') {
        parameters.color_temp = 2700;
      } else if (colorMatch[1] === 'cool') {
        parameters.color_temp = 6500;
      }
    }

    const confidence = primaryTarget ? 0.9 : 0.3;

    return {
      primary_target: primaryTarget,
      parameters,
      confidence,
    };
  }
}