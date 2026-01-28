import { z } from 'zod';

// Network monitoring schemas
export const NetworkDeviceSchema = z.object({
  entity_id: z.string(),
  name: z.string(),
  mac_address: z.string(),
  ip_address: z.string(),
  is_connected: z.boolean(),
  last_seen: z.string(),
  connection_type: z.enum(['wifi', 'ethernet', 'bluetooth']),
  signal_strength: z.number().optional(),
  download_speed: z.number().optional(),
  upload_speed: z.number().optional(),
  data_usage: z.object({
    download: z.number(),
    upload: z.number(),
    total: z.number(),
  }).optional(),
});

export const NetworkInfoSchema = z.object({
  ssid: z.string(),
  bssid: z.string(),
  frequency: z.number(),
  signal_strength: z.number(),
  link_speed: z.number(),
  security: z.string(),
  ip_address: z.string(),
  subnet_mask: z.string(),
  gateway: z.string(),
  dns_servers: z.array(z.string()),
});

export const SpeedTestSchema = z.object({
  timestamp: z.string(),
  download_speed: z.number(),
  upload_speed: z.number(),
  ping: z.number(),
  server: z.string(),
  isp: z.string(),
});

export interface NetworkParams {
  action: 'list_devices' | 'device_info' | 'speed_test' | 'network_health' | 'data_usage' | 'security_scan';
  device_mac?: string;
  entity_id?: string;
  period?: 'hour' | 'day' | 'week' | 'month';
  include_offline?: boolean;
}

export class NetworkManager {
  private hassHost: string;
  private hassToken: string;

  constructor(hassHost: string, hassToken: string) {
    this.hassHost = hassHost;
    this.hassToken = hassToken;
  }

  async execute(params: NetworkParams): Promise<any> {
    try {
      switch (params.action) {
        case 'list_devices':
          return await this.listNetworkDevices(params.include_offline);
        
        case 'device_info':
          if (!params.entity_id && !params.device_mac) {
            throw new Error('Entity ID or device MAC is required');
          }
          return await this.getDeviceInfo(params.entity_id, params.device_mac);
        
        case 'speed_test':
          return await this.runSpeedTest();
        
        case 'network_health':
          return await this.getNetworkHealth();
        
        case 'data_usage':
          return await this.getDataUsage(params.period, params.entity_id);
        
        case 'security_scan':
          return await this.runSecurityScan();
        
        default:
          throw new Error(`Unsupported network action: ${params.action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async listNetworkDevices(includeOffline = false): Promise<any> {
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch network devices: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    
    // Filter for device tracker entities and network-related sensors
    const networkEntities = states.filter((state: any) => 
      state.entity_id.startsWith('device_tracker.') ||
      state.entity_id.startsWith('sensor.') && (
        state.entity_id.includes('network') ||
        state.entity_id.includes('wifi') ||
        state.entity_id.includes('ping') ||
        state.entity_id.includes('connection')
      )
    );

    const devices = networkEntities
      .filter((entity: any) => includeOffline || entity.state !== 'not_home')
      .map((entity: any) => ({
        entity_id: entity.entity_id,
        name: entity.attributes.friendly_name || entity.entity_id,
        mac_address: entity.attributes.mac,
        ip_address: entity.attributes.ip,
        is_connected: entity.state === 'home' || entity.state === 'on',
        last_seen: entity.last_updated,
        connection_type: this.getConnectionType(entity),
        signal_strength: entity.attributes.signal_strength,
        attributes: entity.attributes,
      }));

    return {
      success: true,
      devices,
      total_devices: devices.length,
      connected_devices: devices.filter((d: any) => d.is_connected).length,
    };
  }

  private async getDeviceInfo(entityId?: string, deviceMac?: string): Promise<any> {
    let targetEntity;

    if (entityId) {
      const response = await fetch(`${this.hassHost}/api/states/${entityId}`, {
        headers: {
          Authorization: `Bearer ${this.hassToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch device info: ${response.statusText}`);
      }

      targetEntity = await response.json();
    } else if (deviceMac) {
      const devices = await this.listNetworkDevices(true);
      targetEntity = devices.devices.find((d: any) => d.mac_address === deviceMac);
      
      if (!targetEntity) {
        throw new Error(`Device with MAC ${deviceMac} not found`);
      }
    }

    return {
      success: true,
      device: {
        entity_id: targetEntity.entity_id,
        name: targetEntity.attributes?.friendly_name || targetEntity.entity_id,
        mac_address: targetEntity.attributes?.mac,
        ip_address: targetEntity.attributes?.ip,
        manufacturer: targetEntity.attributes?.manufacturer,
        model: targetEntity.attributes?.model,
        is_connected: targetEntity.state === 'home' || targetEntity.state === 'on',
        last_seen: targetEntity.last_updated,
        connection_type: this.getConnectionType(targetEntity),
        signal_strength: targetEntity.attributes?.signal_strength,
        battery_level: targetEntity.attributes?.battery_level,
        all_attributes: targetEntity.attributes,
      },
    };
  }

  private async runSpeedTest(): Promise<any> {
    // Check if there's a speed test integration available
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to access speed test: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    const speedTestEntities = states.filter((state: any) => 
      state.entity_id.includes('speedtest') || 
      state.entity_id.includes('internet_speed')
    );

    if (speedTestEntities.length === 0) {
      return {
        success: false,
        message: 'No speed test integration found. Please install the Speedtest.net integration.',
        setup_instructions: [
          'Go to Settings > Integrations',
          'Click "Add Integration"',
          'Search for "Speedtest.net"',
          'Follow the setup instructions',
        ],
      };
    }

    // Trigger speed test if there's an automation or service
    try {
      const triggerResponse = await fetch(`${this.hassHost}/api/services/speedtestdotnet/speedtest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.hassToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const speedTestData = speedTestEntities.reduce((acc: any, entity: any) => {
        if (entity.entity_id.includes('download')) {
          acc.download_speed = parseFloat(entity.state);
        } else if (entity.entity_id.includes('upload')) {
          acc.upload_speed = parseFloat(entity.state);
        } else if (entity.entity_id.includes('ping')) {
          acc.ping = parseFloat(entity.state);
        }
        return acc;
      }, {});

      return {
        success: true,
        speed_test: {
          timestamp: new Date().toISOString(),
          download_speed: speedTestData.download_speed || 0,
          upload_speed: speedTestData.upload_speed || 0,
          ping: speedTestData.ping || 0,
          server: 'Speedtest.net',
          units: {
            speed: 'Mbps',
            ping: 'ms',
          },
        },
      };
    } catch (error) {
      return {
        success: true,
        speed_test: {
          timestamp: new Date().toISOString(),
          download_speed: speedTestEntities.find((e: any) => e.entity_id.includes('download'))?.state || 0,
          upload_speed: speedTestEntities.find((e: any) => e.entity_id.includes('upload'))?.state || 0,
          ping: speedTestEntities.find((e: any) => e.entity_id.includes('ping'))?.state || 0,
          note: 'Retrieved last known values',
        },
      };
    }
  }

  private async getNetworkHealth(): Promise<any> {
    const devices = await this.listNetworkDevices(true);
    const speedTest = await this.runSpeedTest();

    const connectedDevices = devices.devices.filter((d: any) => d.is_connected);
    const totalDevices = devices.devices.length;
    
    // Calculate health score
    const deviceScore = totalDevices > 0 ? (connectedDevices.length / totalDevices) * 100 : 100;
    const speedScore = speedTest.speed_test ? 
      Math.min((speedTest.speed_test.download_speed / 100) * 100, 100) : 50;
    const pingScore = speedTest.speed_test?.ping ? 
      Math.max(100 - speedTest.speed_test.ping, 0) : 50;

    const overallHealth = Math.round((deviceScore + speedScore + pingScore) / 3);

    return {
      success: true,
      network_health: {
        overall_score: overallHealth,
        status: overallHealth > 80 ? 'excellent' : 
                overallHealth > 60 ? 'good' : 
                overallHealth > 40 ? 'fair' : 'poor',
        metrics: {
          device_connectivity: {
            score: Math.round(deviceScore),
            connected: connectedDevices.length,
            total: totalDevices,
          },
          internet_speed: {
            score: Math.round(speedScore),
            download: speedTest.speed_test?.download_speed || 0,
            upload: speedTest.speed_test?.upload_speed || 0,
          },
          latency: {
            score: Math.round(pingScore),
            ping: speedTest.speed_test?.ping || 0,
          },
        },
        recommendations: this.generateNetworkRecommendations(overallHealth, deviceScore, speedScore, pingScore),
      },
    };
  }

  private async getDataUsage(period = 'day', entityId?: string): Promise<any> {
    // This would require integration with router that supports data usage monitoring
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data usage: ${response.statusText}`);
    }

    const states = await response.json() as any[];
    const dataUsageEntities = states.filter((state: any) => 
      state.entity_id.includes('data_usage') ||
      state.entity_id.includes('bandwidth') ||
      state.entity_id.includes('traffic')
    );

    if (dataUsageEntities.length === 0) {
      return {
        success: false,
        message: 'No data usage monitoring found. This requires router integration or network monitoring setup.',
        setup_suggestions: [
          'Install SNMP integration for supported routers',
          'Use UniFi integration for Ubiquiti equipment',
          'Set up network monitoring with pfSense integration',
        ],
      };
    }

    return {
      success: true,
      data_usage: dataUsageEntities.map((entity: any) => ({
        entity_id: entity.entity_id,
        device: entity.attributes?.device_name || entity.attributes?.friendly_name,
        usage: parseFloat(entity.state) || 0,
        unit: entity.attributes?.unit_of_measurement || 'MB',
        period,
        last_updated: entity.last_updated,
      })),
    };
  }

  private async runSecurityScan(): Promise<any> {
    const devices = await this.listNetworkDevices(true);
    const securityIssues: string[] = [];
    const recommendations: string[] = [];

    // Check for devices with weak security
    const unknownDevices = devices.devices.filter((d: any) => 
      !d.name || d.name.includes('unknown') || d.name.includes('new_device')
    );

    if (unknownDevices.length > 0) {
      securityIssues.push(`${unknownDevices.length} unidentified devices detected`);
      recommendations.push('Review and identify all connected devices');
    }

    // Check for guest network
    const response = await fetch(`${this.hassHost}/api/states`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    const states = await response.json() as any[];
    const wifiEntities = states.filter((state: any) => 
      state.entity_id.includes('wifi') || state.entity_id.includes('ssid')
    );

    const hasGuestNetwork = wifiEntities.some((entity: any) => 
      entity.attributes?.ssid?.toLowerCase().includes('guest')
    );

    if (!hasGuestNetwork) {
      recommendations.push('Consider setting up a guest network for visitors');
    }

    return {
      success: true,
      security_scan: {
        scan_time: new Date().toISOString(),
        security_score: securityIssues.length === 0 ? 95 : Math.max(50, 95 - (securityIssues.length * 15)),
        issues: securityIssues,
        recommendations,
        device_summary: {
          total_devices: devices.devices.length,
          connected_devices: devices.devices.filter((d: any) => d.is_connected).length,
          unknown_devices: unknownDevices.length,
        },
      },
    };
  }

  private getConnectionType(entity: any): string {
    if (entity.entity_id.includes('wifi') || entity.attributes?.connection_type === 'wifi') {
      return 'wifi';
    } else if (entity.entity_id.includes('ethernet') || entity.attributes?.connection_type === 'ethernet') {
      return 'ethernet';
    } else if (entity.entity_id.includes('bluetooth') || entity.attributes?.connection_type === 'bluetooth') {
      return 'bluetooth';
    }
    return 'unknown';
  }

  private generateNetworkRecommendations(overall: number, device: number, speed: number, ping: number): string[] {
    const recommendations: string[] = [];

    if (device < 80) {
      recommendations.push('Check device connectivity - some devices may be offline');
    }

    if (speed < 50) {
      recommendations.push('Internet speed is below optimal - contact ISP or check network equipment');
    }

    if (ping > 50) {
      recommendations.push('High latency detected - check for network congestion or faulty equipment');
    }

    if (overall < 60) {
      recommendations.push('Consider upgrading network equipment or internet plan');
      recommendations.push('Run cable diagnostics and check for interference');
    }

    return recommendations;
  }
}
