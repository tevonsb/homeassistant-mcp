import { EventEmitter } from 'events';

export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  priority: 'high' | 'medium' | 'low';
  automated: boolean;
}

export interface ErrorContext {
  error: Error;
  operation: string;
  timestamp: Date;
  userAction?: string;
  systemState?: Record<string, any>;
  attemptCount: number;
  lastAttempt?: Date;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  errorTypes: string[];
  actions: RecoveryAction[];
  maxAttempts: number;
  cooldownPeriod: number; // milliseconds
}

export class ErrorRecoveryManager extends EventEmitter {
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private errorHistory: Map<string, ErrorContext[]> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor() {
    super();
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {
    // Connection error recovery
    this.addStrategy({
      id: 'connection_error',
      name: 'Connection Error Recovery',
      errorTypes: ['ECONNREFUSED', 'ENOTFOUND', 'TIMEOUT', 'CONNECTION_ERROR'],
      maxAttempts: 3,
      cooldownPeriod: 5000,
      actions: [
        {
          id: 'retry_connection',
          name: 'Retry Connection',
          description: 'Attempt to reconnect to Home Assistant',
          priority: 'high',
          automated: true,
          execute: async () => {
            // Implementation would depend on your connection manager
            await this.delay(1000);
            return true;
          },
        },
        {
          id: 'check_network',
          name: 'Check Network Connectivity',
          description: 'Verify network connectivity and DNS resolution',
          priority: 'medium',
          automated: true,
          execute: async () => {
            try {
              const response = await fetch('https://8.8.8.8:53', { signal: AbortSignal.timeout(5000) });
              return response.ok;
            } catch {
              return false;
            }
          },
        },
        {
          id: 'switch_to_backup',
          name: 'Switch to Backup Connection',
          description: 'Use backup Home Assistant instance if available',
          priority: 'medium',
          automated: false,
          execute: async () => {
            // Implementation for backup connection
            return false;
          },
        },
      ],
    });

    // Authentication error recovery
    this.addStrategy({
      id: 'auth_error',
      name: 'Authentication Error Recovery',
      errorTypes: ['401', 'UNAUTHORIZED', 'AUTH_FAILED', 'TOKEN_EXPIRED'],
      maxAttempts: 2,
      cooldownPeriod: 10000,
      actions: [
        {
          id: 'refresh_token',
          name: 'Refresh Authentication Token',
          description: 'Attempt to refresh the authentication token',
          priority: 'high',
          automated: true,
          execute: async () => {
            // Implementation would depend on your auth manager
            return false;
          },
        },
        {
          id: 'clear_auth_cache',
          name: 'Clear Authentication Cache',
          description: 'Clear cached authentication data',
          priority: 'medium',
          automated: true,
          execute: async () => {
            // Clear any cached auth tokens
            return true;
          },
        },
        {
          id: 'prompt_reauth',
          name: 'Prompt for Re-authentication',
          description: 'Request user to re-enter credentials',
          priority: 'low',
          automated: false,
          execute: async () => {
            this.emit('reauth_required');
            return false;
          },
        },
      ],
    });

    // Rate limit recovery
    this.addStrategy({
      id: 'rate_limit',
      name: 'Rate Limit Recovery',
      errorTypes: ['429', 'RATE_LIMIT_EXCEEDED', 'TOO_MANY_REQUESTS'],
      maxAttempts: 5,
      cooldownPeriod: 60000,
      actions: [
        {
          id: 'exponential_backoff',
          name: 'Exponential Backoff',
          description: 'Wait with exponentially increasing delay',
          priority: 'high',
          automated: true,
          execute: async () => {
            const attempt = this.recoveryAttempts.get('rate_limit') || 0;
            const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
            await this.delay(delay);
            return true;
          },
        },
        {
          id: 'reduce_request_rate',
          name: 'Reduce Request Rate',
          description: 'Temporarily reduce the frequency of requests',
          priority: 'medium',
          automated: true,
          execute: async () => {
            this.emit('reduce_rate');
            return true;
          },
        },
      ],
    });

    // Service unavailable recovery
    this.addStrategy({
      id: 'service_unavailable',
      name: 'Service Unavailable Recovery',
      errorTypes: ['503', 'SERVICE_UNAVAILABLE', 'HASS_UNAVAILABLE'],
      maxAttempts: 10,
      cooldownPeriod: 30000,
      actions: [
        {
          id: 'wait_for_service',
          name: 'Wait for Service Recovery',
          description: 'Wait for Home Assistant to become available',
          priority: 'high',
          automated: true,
          execute: async () => {
            const attempt = this.recoveryAttempts.get('service_unavailable') || 0;
            const delay = Math.min(5000 + (attempt * 2000), 60000);
            await this.delay(delay);
            return true;
          },
        },
        {
          id: 'check_hass_status',
          name: 'Check Home Assistant Status',
          description: 'Verify Home Assistant instance status',
          priority: 'medium',
          automated: true,
          execute: async () => {
            try {
              const response = await fetch(`${process.env.HASS_HOST}/api/`, {
                headers: { Authorization: `Bearer ${process.env.HASS_TOKEN}` },
                signal: AbortSignal.timeout(5000),
              });
              return response.ok;
            } catch {
              return false;
            }
          },
        },
      ],
    });

    // Device error recovery
    this.addStrategy({
      id: 'device_error',
      name: 'Device Error Recovery',
      errorTypes: ['DEVICE_UNAVAILABLE', 'DEVICE_ERROR', 'ENTITY_NOT_FOUND'],
      maxAttempts: 3,
      cooldownPeriod: 15000,
      actions: [
        {
          id: 'refresh_device_list',
          name: 'Refresh Device List',
          description: 'Reload device registry from Home Assistant',
          priority: 'high',
          automated: true,
          execute: async () => {
            this.emit('refresh_devices');
            return true;
          },
        },
        {
          id: 'check_device_availability',
          name: 'Check Device Availability',
          description: 'Verify if device is responsive',
          priority: 'medium',
          automated: true,
          execute: async () => {
            // Implementation would check device status
            return false;
          },
        },
        {
          id: 'suggest_alternative',
          name: 'Suggest Alternative Device',
          description: 'Suggest similar device as alternative',
          priority: 'low',
          automated: false,
          execute: async () => {
            this.emit('suggest_alternative');
            return false;
          },
        },
      ],
    });
  }

  public addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  public async handleError(error: Error, context: Partial<ErrorContext> = {}): Promise<boolean> {
    const errorContext: ErrorContext = {
      error,
      operation: context.operation || 'unknown',
      timestamp: new Date(),
      userAction: context.userAction,
      systemState: context.systemState,
      attemptCount: 0,
      ...context,
    };

    // Find applicable strategies
    const applicableStrategies = this.findApplicableStrategies(error);
    
    if (applicableStrategies.length === 0) {
      this.logError(errorContext);
      this.emit('no_recovery_strategy', errorContext);
      return false;
    }

    // Store error in history
    this.addToErrorHistory(errorContext);

    // Attempt recovery for each applicable strategy
    for (const strategy of applicableStrategies) {
      const recovered = await this.attemptRecovery(strategy, errorContext);
      if (recovered) {
        this.emit('recovery_successful', { strategy, errorContext });
        return true;
      }
    }

    this.emit('recovery_failed', errorContext);
    return false;
  }

  private findApplicableStrategies(error: Error): RecoveryStrategy[] {
    const errorMessage = error.message.toUpperCase();
    const errorName = error.name.toUpperCase();
    const errorString = `${errorName} ${errorMessage}`;

    return Array.from(this.strategies.values()).filter(strategy =>
      strategy.errorTypes.some(type => 
        errorString.includes(type.toUpperCase()) ||
        errorMessage.includes(type.toUpperCase()) ||
        errorName.includes(type.toUpperCase())
      )
    );
  }

  private async attemptRecovery(strategy: RecoveryStrategy, context: ErrorContext): Promise<boolean> {
    const strategyKey = `${strategy.id}_${context.operation}`;
    
    // Check cooldown
    if (this.isInCooldown(strategyKey, strategy.cooldownPeriod)) {
      return false;
    }

    // Check max attempts
    const currentAttempts = this.recoveryAttempts.get(strategyKey) || 0;
    if (currentAttempts >= strategy.maxAttempts) {
      return false;
    }

    // Increment attempt counter
    this.recoveryAttempts.set(strategyKey, currentAttempts + 1);

    // Execute recovery actions
    for (const action of strategy.actions) {
      try {
        this.emit('recovery_action_start', { strategy, action, context });
        
        const success = await action.execute();
        
        this.emit('recovery_action_complete', { strategy, action, context, success });
        
        if (success) {
          // Reset attempt counter on successful recovery
          this.recoveryAttempts.delete(strategyKey);
          return true;
        }
      } catch (actionError) {
        this.emit('recovery_action_error', { strategy, action, context, error: actionError });
      }
    }

    // Set cooldown
    this.cooldowns.set(strategyKey, new Date());
    return false;
  }

  private isInCooldown(key: string, cooldownPeriod: number): boolean {
    const lastAttempt = this.cooldowns.get(key);
    if (!lastAttempt) return false;
    
    return Date.now() - lastAttempt.getTime() < cooldownPeriod;
  }

  private addToErrorHistory(context: ErrorContext): void {
    const key = `${context.operation}_${context.error.name}`;
    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, []);
    }
    
    const history = this.errorHistory.get(key)!;
    history.push(context);
    
    // Keep only last 10 errors for each type
    if (history.length > 10) {
      history.shift();
    }
  }

  private logError(context: ErrorContext): void {
    console.error('[ErrorRecovery]', {
      operation: context.operation,
      error: context.error.message,
      timestamp: context.timestamp,
      userAction: context.userAction,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring and management
  public getErrorHistory(operation?: string): ErrorContext[] {
    if (operation) {
      return Array.from(this.errorHistory.entries())
        .filter(([key]) => key.startsWith(operation))
        .flatMap(([, history]) => history);
    }
    
    return Array.from(this.errorHistory.values()).flat();
  }

  public getRecoveryStatistics(): Record<string, any> {
    const totalErrors = Array.from(this.errorHistory.values()).flat().length;
    const strategiesUsed = this.strategies.size;
    const activeAttempts = this.recoveryAttempts.size;
    const activeCooldowns = this.cooldowns.size;

    return {
      total_errors: totalErrors,
      strategies_available: strategiesUsed,
      active_recovery_attempts: activeAttempts,
      active_cooldowns: activeCooldowns,
      error_types: this.getErrorTypeDistribution(),
    };
  }

  private getErrorTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    Array.from(this.errorHistory.values()).flat().forEach(context => {
      const errorType = context.error.name;
      distribution[errorType] = (distribution[errorType] || 0) + 1;
    });

    return distribution;
  }

  public clearErrorHistory(operation?: string): void {
    if (operation) {
      Array.from(this.errorHistory.keys())
        .filter(key => key.startsWith(operation))
        .forEach(key => this.errorHistory.delete(key));
    } else {
      this.errorHistory.clear();
    }
  }

  public resetRecoveryAttempts(strategyId?: string): void {
    if (strategyId) {
      Array.from(this.recoveryAttempts.keys())
        .filter(key => key.startsWith(strategyId))
        .forEach(key => this.recoveryAttempts.delete(key));
    } else {
      this.recoveryAttempts.clear();
    }
  }
}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();
