import { z } from 'zod';

// Weather schemas
export const WeatherConditionSchema = z.object({
  condition: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  wind_speed: z.number(),
  wind_bearing: z.number(),
  visibility: z.number().optional(),
  uv_index: z.number().optional(),
  cloud_coverage: z.number().optional(),
});

export const WeatherForecastSchema = z.object({
  datetime: z.string(),
  condition: z.string(),
  temperature: z.number(),
  templow: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  wind_speed: z.number(),
  wind_bearing: z.number(),
  precipitation: z.number(),
  precipitation_probability: z.number(),
});

export const WeatherAlertSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['minor', 'moderate', 'severe', 'extreme']),
  certainty: z.enum(['observed', 'likely', 'possible', 'unlikely']),
  urgency: z.enum(['immediate', 'expected', 'future', 'past']),
  areas: z.array(z.string()),
  start_time: z.string(),
  end_time: z.string(),
});

export interface WeatherParams {
  action: 'current' | 'forecast' | 'alerts' | 'history' | 'air_quality';
  entity_id?: string;
  days?: number;
  hours?: number;
  start_time?: string;
  end_time?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export class WeatherManager {
  private hassHost: string;
  private hassToken: string;

  constructor(hassHost: string, hassToken: string) {
    this.hassHost = hassHost;
    this.hassToken = hassToken;
  }

  async execute(params: WeatherParams): Promise<any> {
    try {
      switch (params.action) {
        case 'current':
          return await this.getCurrentWeather(params.entity_id);
        
        case 'forecast':
          return await this.getWeatherForecast(params.entity_id, params.days, params.hours);
        
        case 'alerts':
          return await this.getWeatherAlerts(params.location);
        
        case 'history':
          return await this.getWeatherHistory(params.entity_id, params.start_time, params.end_time);
        
        case 'air_quality':
          return await this.getAirQuality(params.location);
        
        default:
          throw new Error(`Unsupported weather action: ${params.action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async getCurrentWeather(entityId?: string): Promise<any> {
    // Get weather entities
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    const weatherEntities = states.filter((state: any) => 
      state.entity_id.startsWith('weather.') && 
      (!entityId || state.entity_id === entityId)
    );

    if (weatherEntities.length === 0) {
      throw new Error('No weather entities found');
    }

    const primaryWeather = weatherEntities[0];
    
    return {
      success: true,
      current: {
        entity_id: primaryWeather.entity_id,
        condition: primaryWeather.state,
        temperature: primaryWeather.attributes.temperature,
        humidity: primaryWeather.attributes.humidity,
        pressure: primaryWeather.attributes.pressure,
        wind_speed: primaryWeather.attributes.wind_speed,
        wind_bearing: primaryWeather.attributes.wind_bearing,
        visibility: primaryWeather.attributes.visibility,
        uv_index: primaryWeather.attributes.uv_index,
        last_updated: primaryWeather.last_updated,
      },
    };
  }

  private async getWeatherForecast(entityId?: string, days = 5, hours?: number): Promise<any> {
    // Get weather entity
    const current = await this.getCurrentWeather(entityId);
    const weatherEntityId = current.current.entity_id;

    const response = await fetch(`${this.hassHost}/api/states/${weatherEntityId}`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather forecast: ${response.statusText}`);
    }

    const state = await response.json() as any;
    let forecast = state.attributes?.forecast || [];

    if (hours) {
      // Filter for hourly forecast
      forecast = forecast.slice(0, hours);
    } else {
      // Filter for daily forecast
      forecast = forecast.slice(0, days);
    }

    return {
      success: true,
      forecast,
      entity_id: weatherEntityId,
      forecast_type: hours ? 'hourly' : 'daily',
    };
  }

  private async getWeatherAlerts(location?: { latitude: number; longitude: number }): Promise<any> {
    // Check for weather alert entities
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather alerts: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    const alertEntities = states.filter((state: any) => 
      state.entity_id.includes('weather_alert') || 
      state.entity_id.includes('nws_alert') ||
      state.domain === 'alert'
    );

    const alerts = alertEntities.map((entity: any) => ({
      entity_id: entity.entity_id,
      title: entity.attributes.title || entity.attributes.friendly_name,
      description: entity.attributes.description || entity.state,
      severity: entity.attributes.severity || 'moderate',
      urgency: entity.attributes.urgency || 'expected',
      areas: entity.attributes.areas || [],
      start_time: entity.attributes.starts_at,
      end_time: entity.attributes.ends_at,
    }));

    return {
      success: true,
      alerts,
      count: alerts.length,
    };
  }

  private async getWeatherHistory(
    entityId?: string,
    startTime?: string,
    endTime?: string
  ): Promise<any> {
    const current = await this.getCurrentWeather(entityId);
    const weatherEntityId = current.current.entity_id;

    const now = new Date();
    const start = startTime ? new Date(startTime) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime) : now;

    const response = await fetch(
      `${this.hassHost}/api/history/period/${start.toISOString()}?filter_entity_id=${weatherEntityId}&end_time=${end.toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.hassToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch weather history: ${response.statusText}`);
    }

    const history = await response.json() as any[];
    
    return {
      success: true,
      history: history[0] || [],
      entity_id: weatherEntityId,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }

  private async getAirQuality(location?: { latitude: number; longitude: number }): Promise<any> {
    // Check for air quality entities
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch air quality data: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    const airQualityEntities = states.filter((state: any) => 
      state.entity_id.includes('air_quality') || 
      state.entity_id.includes('aqi') ||
      state.entity_id.includes('pm25') ||
      state.entity_id.includes('pm10')
    );

    const airQualityData = airQualityEntities.map((entity: any) => ({
      entity_id: entity.entity_id,
      parameter: entity.attributes.device_class || entity.entity_id.split('.')[1],
      value: parseFloat(entity.state),
      unit: entity.attributes.unit_of_measurement,
      last_updated: entity.last_updated,
    }));

    return {
      success: true,
      air_quality: airQualityData,
      overall_aqi: this.calculateOverallAQI(airQualityData),
    };
  }

  private calculateOverallAQI(data: any[]): { value: number; category: string } {
    // Simple AQI calculation - in practice, this should use proper AQI formulas
    const pm25Entity = data.find(d => d.parameter.includes('pm25'));
    const pm10Entity = data.find(d => d.parameter.includes('pm10'));
    
    let aqi = 0;
    if (pm25Entity) aqi = Math.max(aqi, pm25Entity.value * 4); // Simplified conversion
    if (pm10Entity) aqi = Math.max(aqi, pm10Entity.value * 2); // Simplified conversion

    let category = 'Good';
    if (aqi > 50) category = 'Moderate';
    if (aqi > 100) category = 'Unhealthy for Sensitive Groups';
    if (aqi > 150) category = 'Unhealthy';
    if (aqi > 200) category = 'Very Unhealthy';
    if (aqi > 300) category = 'Hazardous';

    return { value: Math.round(aqi), category };
  }

  // Weather-based automation suggestions
  async getWeatherAutomationSuggestions(): Promise<any> {
    const current = await this.getCurrentWeather();
    const forecast = await this.getWeatherForecast(undefined, 1);
    
    const suggestions: string[] = [];
    const weatherCondition = current.current.condition.toLowerCase();
    const temperature = current.current.temperature;
    const humidity = current.current.humidity;

    // Temperature-based suggestions
    if (temperature > 30) {
      suggestions.push('Consider closing blinds and turning on air conditioning');
      suggestions.push('Set up automation to water plants more frequently');
    } else if (temperature < 5) {
      suggestions.push('Check heating system and close windows');
      suggestions.push('Consider frost protection for plants');
    }

    // Condition-based suggestions
    if (weatherCondition.includes('rain')) {
      suggestions.push('Close windows and skylights automatically');
      suggestions.push('Turn on outdoor lighting earlier');
    } else if (weatherCondition.includes('snow')) {
      suggestions.push('Activate driveway heating if available');
      suggestions.push('Schedule snow removal reminders');
    } else if (weatherCondition.includes('wind')) {
      suggestions.push('Secure outdoor furniture');
      suggestions.push('Close awnings and umbrellas');
    }

    // Humidity-based suggestions
    if (humidity > 80) {
      suggestions.push('Run dehumidifiers to prevent mold');
      suggestions.push('Increase ventilation in bathrooms');
    } else if (humidity < 30) {
      suggestions.push('Run humidifiers for comfort');
      suggestions.push('Water indoor plants more frequently');
    }

    return {
      success: true,
      current_conditions: current.current,
      suggestions,
      automation_opportunities: [
        'Weather-based lighting schedules',
        'Temperature-controlled HVAC automation',
        'Rain detection for window/sprinkler control',
        'UV index-based blind control',
      ],
    };
  }
}
