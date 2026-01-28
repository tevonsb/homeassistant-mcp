import { z } from 'zod';

// Energy monitoring schemas
export const EnergySourceSchema = z.object({
  source_id: z.string(),
  source_type: z.enum(['grid', 'solar', 'battery', 'gas']),
  name: z.string(),
  unit_of_measurement: z.string(),
  state_class: z.string(),
  device_class: z.string(),
  last_updated: z.string(),
  current_value: z.number(),
  daily_total: z.number(),
  weekly_total: z.number(),
  monthly_total: z.number(),
  yearly_total: z.number(),
});

export const EnergyDeviceSchema = z.object({
  entity_id: z.string(),
  name: z.string(),
  device_class: z.string(),
  unit_of_measurement: z.string(),
  current_consumption: z.number(),
  daily_consumption: z.number(),
  cost_per_kwh: z.number().optional(),
  estimated_daily_cost: z.number().optional(),
});

export const EnergyDashboardSchema = z.object({
  grid: z.object({
    imported: z.number(),
    exported: z.number(),
    cost: z.number(),
  }),
  solar: z.object({
    production: z.number(),
    self_consumption: z.number(),
    efficiency: z.number(),
  }),
  battery: z.object({
    charge_level: z.number(),
    charging_rate: z.number(),
    discharging_rate: z.number(),
  }).optional(),
  total_consumption: z.number(),
  carbon_footprint: z.number(),
  savings: z.number(),
});

export interface EnergyParams {
  action: 'list_sources' | 'get_dashboard' | 'get_device_consumption' | 'get_statistics';
  source_type?: 'grid' | 'solar' | 'battery' | 'gas';
  entity_id?: string;
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
  start_time?: string;
  end_time?: string;
}

export class EnergyManager {
  private hassHost: string;
  private hassToken: string;

  constructor(hassHost: string, hassToken: string) {
    this.hassHost = hassHost;
    this.hassToken = hassToken;
  }

  async execute(params: EnergyParams): Promise<any> {
    try {
      switch (params.action) {
        case 'list_sources':
          return await this.listEnergySources(params.source_type);
        
        case 'get_dashboard':
          return await this.getEnergyDashboard();
        
        case 'get_device_consumption':
          if (!params.entity_id) {
            throw new Error('Entity ID is required for device consumption');
          }
          return await this.getDeviceConsumption(params.entity_id, params.period);
        
        case 'get_statistics':
          return await this.getEnergyStatistics(params.period, params.start_time, params.end_time);
        
        default:
          throw new Error(`Unsupported energy action: ${params.action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async listEnergySources(sourceType?: string): Promise<any> {
    const endpoint = sourceType 
      ? `/api/energy/sources?type=${sourceType}`
      : '/api/energy/sources';

    const response = await fetch(`${this.hassHost}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch energy sources: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      success: true,
      sources: data.sources || [],
    };
  }

  private async getEnergyDashboard(): Promise<any> {
    const response = await fetch(`${this.hassHost}/api/energy/dashboard`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch energy dashboard: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      dashboard: data,
    };
  }

  private async getDeviceConsumption(entityId: string, period = 'day'): Promise<any> {
    const response = await fetch(
      `${this.hassHost}/api/energy/device/${entityId}/consumption?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${this.hassToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch device consumption: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      consumption: data,
    };
  }

  private async getEnergyStatistics(
    period = 'day',
    startTime?: string,
    endTime?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      period,
      ...(startTime && { start_time: startTime }),
      ...(endTime && { end_time: endTime }),
    });

    const response = await fetch(
      `${this.hassHost}/api/energy/statistics?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.hassToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch energy statistics: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      statistics: data,
    };
  }

  // Real-time energy monitoring
  async subscribeToEnergyUpdates(callback: (data: any) => void): Promise<void> {
    // This would integrate with the existing SSE system
    // Subscribe to energy-related state changes
    const energyEntities = [
      'sensor.energy_production_today',
      'sensor.energy_consumption_today',
      'sensor.grid_power',
      'sensor.solar_power',
      'sensor.battery_power',
    ];

    energyEntities.forEach(entity => {
      // Subscribe to state changes for energy entities
      // This would use the existing SSE subscription system
    });
  }

  // Energy optimization suggestions
  async getOptimizationSuggestions(): Promise<any> {
    const dashboard = await this.getEnergyDashboard();
    const suggestions: string[] = [];

    if (dashboard.dashboard.grid.imported > dashboard.dashboard.solar.production) {
      suggestions.push('Consider increasing solar panel capacity');
    }

    if (dashboard.dashboard.battery && dashboard.dashboard.battery.charge_level < 20) {
      suggestions.push('Battery charge is low - consider charging during off-peak hours');
    }

    if (dashboard.dashboard.solar.efficiency < 0.8) {
      suggestions.push('Solar efficiency is below optimal - check for obstructions');
    }

    return {
      success: true,
      suggestions,
      dashboard: dashboard.dashboard,
    };
  }
}
