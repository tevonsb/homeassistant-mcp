import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Backup schemas
export const BackupMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  size: z.number(),
  compressed: z.boolean(),
  type: z.enum(['full', 'partial', 'configuration']),
  addons: z.array(z.string()),
  folders: z.array(z.string()),
  password_protected: z.boolean(),
  homeassistant_version: z.string(),
  supervisor_version: z.string(),
  checksum: z.string(),
});

export const BackupConfigSchema = z.object({
  name: z.string(),
  password: z.string().optional(),
  compressed: z.boolean().default(true),
  location: z.enum(['local', 'cloud']).default('local'),
  addons: z.array(z.string()).optional(),
  folders: z.array(z.string()).optional(),
});

export interface BackupParams {
  action: 'create' | 'list' | 'restore' | 'delete' | 'download' | 'upload' | 'schedule';
  backup_id?: string;
  config?: {
    name: string;
    password?: string;
    compressed?: boolean;
    location?: 'local' | 'cloud';
    addons?: string[];
    folders?: string[];
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
    retention_days?: number;
    auto_cleanup?: boolean;
  };
}

export class BackupManager {
  private hassHost: string;
  private hassToken: string;
  private backupDir: string;

  constructor(hassHost: string, hassToken: string, backupDir = './backups') {
    this.hassHost = hassHost;
    this.hassToken = hassToken;
    this.backupDir = backupDir;
  }

  async execute(params: BackupParams): Promise<any> {
    try {
      switch (params.action) {
        case 'create':
          if (!params.config) {
            throw new Error('Backup configuration is required');
          }
          return await this.createBackup(params.config);
        
        case 'list':
          return await this.listBackups();
        
        case 'restore':
          if (!params.backup_id) {
            throw new Error('Backup ID is required for restore');
          }
          return await this.restoreBackup(params.backup_id);
        
        case 'delete':
          if (!params.backup_id) {
            throw new Error('Backup ID is required for delete');
          }
          return await this.deleteBackup(params.backup_id);
        
        case 'download':
          if (!params.backup_id) {
            throw new Error('Backup ID is required for download');
          }
          return await this.downloadBackup(params.backup_id);
        
        case 'upload':
          return await this.uploadBackup();
        
        case 'schedule':
          if (!params.schedule) {
            throw new Error('Schedule configuration is required');
          }
          return await this.scheduleBackup(params.schedule);
        
        default:
          throw new Error(`Unsupported backup action: ${params.action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private async createBackup(config: BackupParams['config']): Promise<any> {
    if (!config) throw new Error('Configuration is required');

    // Validate configuration
    const validatedConfig = BackupConfigSchema.parse(config);

    // Prepare backup request
    const backupData: any = {
      name: validatedConfig.name,
      compressed: validatedConfig.compressed,
    };

    if (validatedConfig.password) {
      backupData.password = validatedConfig.password;
    }

    if (validatedConfig.addons && validatedConfig.addons.length > 0) {
      backupData.addons = validatedConfig.addons;
    }

    if (validatedConfig.folders && validatedConfig.folders.length > 0) {
      backupData.folders = validatedConfig.folders;
    }

    // Create backup via Home Assistant API
    const response = await fetch(`${this.hassHost}/api/hassio/backups/new/full`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backupData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create backup: ${response.statusText}`);
    }

    const result = await response.json() as any;
    
    // Monitor backup progress
    const backupId = result.data?.slug;
    const progress = await this.monitorBackupProgress(backupId);

    return {
      success: true,
      backup_id: backupId,
      message: 'Backup created successfully',
      progress,
    };
  }

  private async listBackups(): Promise<any> {
    const response = await fetch(`${this.hassHost}/api/hassio/backups`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list backups: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    const backups = data.data?.backups?.map((backup: any) => ({
      id: backup.slug,
      name: backup.name,
      date: backup.date,
      size: backup.size,
      compressed: backup.compressed,
      type: backup.type,
      addons: backup.content?.addons || [],
      folders: backup.content?.folders || [],
      password_protected: backup.protected,
      homeassistant_version: backup.homeassistant,
      supervisor_version: backup.supervisor,
    }));

    return {
      success: true,
      backups,
      total_count: backups.length,
      total_size: backups.reduce((sum: number, backup: any) => sum + backup.size, 0),
    };
  }

  private async restoreBackup(backupId: string): Promise<any> {
    // Get backup info first
    const infoResponse = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}/info`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!infoResponse.ok) {
      throw new Error(`Failed to get backup info: ${infoResponse.statusText}`);
    }

    const backupInfo = await infoResponse.json();

    // Start restore
    const restoreResponse = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}/restore/full`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!restoreResponse.ok) {
      throw new Error(`Failed to start restore: ${restoreResponse.statusText}`);
    }

    return {
      success: true,
      message: 'Backup restore started',
      backup_info: (backupInfo as any).data,
      warning: 'Home Assistant will restart during restore process',
    };
  }

  private async deleteBackup(backupId: string): Promise<any> {
    const response = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete backup: ${response.statusText}`);
    }

    return {
      success: true,
      message: `Backup ${backupId} deleted successfully`,
    };
  }

  private async downloadBackup(backupId: string): Promise<any> {
    // Get backup info
    const infoResponse = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}/info`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!infoResponse.ok) {
      throw new Error(`Failed to get backup info: ${infoResponse.statusText}`);
    }

    const backupInfo = await infoResponse.json();

    // Download backup
    const downloadResponse = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}/download`, {
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Failed to download backup: ${downloadResponse.statusText}`);
    }

    // Save to local backup directory
    await fs.mkdir(this.backupDir, { recursive: true });
    const filename = `${(backupInfo as any).data.name}_${backupId}.tar`;
    const filepath = path.join(this.backupDir, filename);

    const buffer = await downloadResponse.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));

    // Calculate checksum
    const checksum = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    return {
      success: true,
      message: 'Backup downloaded successfully',
      filepath,
      size: buffer.byteLength,
      checksum,
    };
  }

  private async uploadBackup(): Promise<any> {
    // This would handle uploading local backups to Home Assistant
    // Implementation depends on file handling in your environment
    
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.tar'));

      if (backupFiles.length === 0) {
        return {
          success: false,
          message: 'No backup files found in backup directory',
        };
      }

      return {
        success: true,
        message: 'Backup upload feature requires additional implementation',
        available_files: backupFiles,
        note: 'Use Home Assistant web interface to upload backup files',
      };
    } catch (error) {
      throw new Error(`Failed to check backup directory: ${error}`);
    }
  }

  private async scheduleBackup(schedule: BackupParams['schedule']): Promise<any> {
    if (!schedule) throw new Error('Schedule configuration is required');

    // This would integrate with Home Assistant's automation system
    const automationConfig = {
      alias: `Automated Backup - ${schedule.frequency}`,
      description: `Automated backup created every ${schedule.frequency}`,
      trigger: this.generateScheduleTrigger(schedule),
      action: [
        {
          service: 'hassio.backup_full',
          data: {
            name: `Auto Backup ${new Date().toISOString().split('T')[0]}`,
            compressed: true,
          } as any,
        },
      ],
    };

    if (schedule.auto_cleanup && schedule.retention_days) {
      automationConfig.action.push({
        service: 'shell_command.cleanup_old_backups',
        data: {
          retention_days: schedule.retention_days,
        },
      });
    }

    // Create automation via Home Assistant API
    const response = await fetch(`${this.hassHost}/api/config/automation/config`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.hassToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automationConfig),
    });

    if (!response.ok) {
      throw new Error(`Failed to create backup schedule: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'Backup schedule created successfully',
      automation_id: (result as any).automation_id,
      schedule: {
        frequency: schedule.frequency,
        time: schedule.time || 'default',
        retention_days: schedule.retention_days,
        auto_cleanup: schedule.auto_cleanup,
      },
    };
  }

  private generateScheduleTrigger(schedule: BackupParams['schedule']): any {
    const trigger: any = {
      platform: 'time',
    };

    switch (schedule?.frequency) {
      case 'daily':
        trigger.at = schedule.time || '02:00:00';
        break;
      case 'weekly':
        trigger.at = schedule.time || '02:00:00';
        trigger.weekday = 'sun';
        break;
      case 'monthly':
        trigger.at = schedule.time || '02:00:00';
        trigger.day = 1;
        break;
    }

    return trigger;
  }

  private async monitorBackupProgress(backupId: string): Promise<any> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.hassHost}/api/hassio/backups/${backupId}/info`, {
          headers: {
            Authorization: `Bearer ${this.hassToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return {
            status: 'completed',
            backup_info: (data as any).data,
          };
        }
      } catch {
        // Continue monitoring
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    return {
      status: 'timeout',
      message: 'Backup creation monitoring timed out',
    };
  }

  // Utility methods
  async getBackupStatistics(): Promise<any> {
    const backups = await this.listBackups();
    
    if (!backups.success) {
      return backups;
    }

    const stats = {
      total_backups: backups.backups.length,
      total_size_mb: Math.round(backups.total_size / (1024 * 1024)),
      oldest_backup: backups.backups.reduce((oldest: any, backup: any) => 
        !oldest || new Date(backup.date) < new Date(oldest.date) ? backup : oldest, null),
      newest_backup: backups.backups.reduce((newest: any, backup: any) => 
        !newest || new Date(backup.date) > new Date(newest.date) ? backup : newest, null),
      backup_types: backups.backups.reduce((types: any, backup: any) => {
        types[backup.type] = (types[backup.type] || 0) + 1;
        return types;
      }, {}),
    };

    return {
      success: true,
      statistics: stats,
    };
  }
}
