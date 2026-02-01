import { EventEmitter } from 'events';
import { HassEntity, HassEvent, StateChangedEvent } from '../types/hass.js';

interface RateLimit {
    count: number;
    lastReset: number;
}

export interface SSEClient {
    id: string;
    send: (data: string) => void;
    subscriptions: {
        entities: Set<string>;
        events: Set<string>;
        domains: Set<string>;
    };
    authenticated: boolean;
    rateLimit: RateLimit;
    lastPing: number;
    connectionTime: number;
}

export class SSEManager extends EventEmitter {
    private clients: Map<string, SSEClient> = new Map();
    private static instance: SSEManager | null = null;
    private entityStates: Map<string, HassEntity> = new Map();

    // Configuration
    private readonly MAX_CLIENTS = 100;
    private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
    private readonly RATE_LIMIT_MAX_REQUESTS = 1000;
    private readonly CLIENT_TIMEOUT = 300000; // 5 minutes
    private readonly PING_INTERVAL = 30000; // 30 seconds

    private constructor() {
        super();
        console.log('Initializing SSE Manager...');
        this.startMaintenanceInterval();
    }

    private startMaintenanceInterval() {
        setInterval(() => {
            this.performMaintenance();
        }, 60000); // Run every minute
    }

    private performMaintenance() {
        const now = Date.now();

        // Check each client for timeouts and rate limits
        for (const [clientId, client] of this.clients.entries()) {
            // Remove inactive clients
            if (now - client.lastPing > this.CLIENT_TIMEOUT) {
                console.log(`Removing inactive client: ${clientId}`);
                this.removeClient(clientId);
                continue;
            }

            // Reset rate limits if window has passed
            if (now - client.rateLimit.lastReset > this.RATE_LIMIT_WINDOW) {
                client.rateLimit.count = 0;
                client.rateLimit.lastReset = now;
            }
        }

        // Log statistics
        console.log(`Maintenance complete - Active clients: ${this.clients.size}`);
    }

    static getInstance(): SSEManager {
        if (!SSEManager.instance) {
            SSEManager.instance = new SSEManager();
        }
        return SSEManager.instance;
    }

    addClient(client: { id: string; send: (data: string) => void }, token?: string): SSEClient | null {
        // Check maximum client limit
        if (this.clients.size >= this.MAX_CLIENTS) {
            console.warn('Maximum client limit reached, rejecting new connection');
            return null;
        }

        const now = Date.now();
        const sseClient: SSEClient = {
            id: client.id,
            send: client.send,
            subscriptions: {
                entities: new Set<string>(),
                events: new Set<string>(),
                domains: new Set<string>()
            },
            authenticated: this.validateToken(token),
            rateLimit: {
                count: 0,
                lastReset: now
            },
            lastPing: now,
            connectionTime: now
        };

        this.clients.set(client.id, sseClient);
        console.log(`SSE client connected: ${client.id} (authenticated: ${sseClient.authenticated})`);

        // Start ping interval for this client
        this.startClientPing(client.id);

        // Send initial connection success message
        this.sendToClient(sseClient, {
            type: 'connection',
            status: 'connected',
            id: client.id,
            authenticated: sseClient.authenticated,
            timestamp: new Date().toISOString()
        });

        return sseClient;
    }

    private startClientPing(clientId: string) {
        const interval = setInterval(() => {
            const client = this.clients.get(clientId);
            if (!client) {
                clearInterval(interval);
                return;
            }

            this.sendToClient(client, {
                type: 'ping',
                timestamp: new Date().toISOString()
            });
        }, this.PING_INTERVAL);
    }

    removeClient(clientId: string) {
        if (this.clients.has(clientId)) {
            this.clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}`);
        }
    }

    subscribeToEntity(clientId: string, entityId: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.entities.add(entityId);
            console.log(`Client ${clientId} subscribed to entity: ${entityId}`);

            // Send current state if available
            const currentState = this.entityStates.get(entityId);
            if (currentState) {
                this.sendToClient(client, {
                    type: 'state_changed',
                    data: {
                        entity_id: currentState.entity_id,
                        state: currentState.state,
                        attributes: currentState.attributes,
                        last_changed: currentState.last_changed,
                        last_updated: currentState.last_updated
                    }
                });
            }
        }
    }

    subscribeToDomain(clientId: string, domain: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.domains.add(domain);
            console.log(`Client ${clientId} subscribed to domain: ${domain}`);
        }
    }

    subscribeToEvent(clientId: string, eventType: string) {
        const client = this.clients.get(clientId);
        if (client?.authenticated) {
            client.subscriptions.events.add(eventType);
            console.log(`Client ${clientId} subscribed to event: ${eventType}`);
        }
    }

    broadcastStateChange(entity: HassEntity) {
        // Update stored state
        this.entityStates.set(entity.entity_id, entity);

        const domain = entity.entity_id.split('.')[0];
        const message = {
            type: 'state_changed',
            data: {
                entity_id: entity.entity_id,
                state: entity.state,
                attributes: entity.attributes,
                last_changed: entity.last_changed,
                last_updated: entity.last_updated
            },
            timestamp: new Date().toISOString()
        };

        console.log(`Broadcasting state change for ${entity.entity_id}`);

        // Send to relevant subscribers only
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (
                client.subscriptions.entities.has(entity.entity_id) ||
                client.subscriptions.domains.has(domain) ||
                client.subscriptions.events.has('state_changed')
            ) {
                this.sendToClient(client, message);
            }
        }
    }

    broadcastEvent(event: HassEvent) {
        const message = {
            type: event.event_type,
            data: event.data,
            origin: event.origin,
            time_fired: event.time_fired,
            context: event.context,
            timestamp: new Date().toISOString()
        };

        console.log(`Broadcasting event: ${event.event_type}`);

        // Send to relevant subscribers only
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (client.subscriptions.events.has(event.event_type)) {
                this.sendToClient(client, message);
            }
        }
    }

    private sendToClient(client: SSEClient, data: any) {
        try {
            // Check rate limit
            const now = Date.now();
            if (now - client.rateLimit.lastReset > this.RATE_LIMIT_WINDOW) {
                client.rateLimit.count = 0;
                client.rateLimit.lastReset = now;
            }

            if (client.rateLimit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
                console.warn(`Rate limit exceeded for client ${client.id}`);
                this.sendToClient(client, {
                    type: 'error',
                    error: 'rate_limit_exceeded',
                    message: 'Too many requests, please try again later',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            client.rateLimit.count++;
            client.lastPing = now;
            client.send(JSON.stringify(data));
        } catch (error) {
            console.error(`Error sending message to client ${client.id}:`, error);
            this.removeClient(client.id);
        }
    }

    private validateToken(token?: string): boolean {
        if (!token) return false;
        // Compare with MCP_API_KEY from environment (NOT HASS_TOKEN - that's internal only)
        return token === process.env.MCP_API_KEY;
    }

    // Utility methods
    getConnectedClients(): number {
        return this.clients.size;
    }

    getClientSubscriptions(clientId: string) {
        return this.clients.get(clientId)?.subscriptions;
    }

    getEntityState(entityId: string): HassEntity | undefined {
        return this.entityStates.get(entityId);
    }

    // Add new event types
    broadcastServiceCall(domain: string, service: string, data: any) {
        const message = {
            type: 'service_called',
            data: {
                domain,
                service,
                service_data: data
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('service_called', message);
    }

    broadcastAutomationTriggered(automationId: string, trigger: any) {
        const message = {
            type: 'automation_triggered',
            data: {
                automation_id: automationId,
                trigger
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('automation_triggered', message);
    }

    broadcastScriptExecuted(scriptId: string, data: any) {
        const message = {
            type: 'script_executed',
            data: {
                script_id: scriptId,
                execution_data: data
            },
            timestamp: new Date().toISOString()
        };

        this.broadcastToSubscribers('script_executed', message);
    }

    private broadcastToSubscribers(eventType: string, message: any) {
        for (const client of this.clients.values()) {
            if (!client.authenticated) continue;

            if (client.subscriptions.events.has(eventType)) {
                this.sendToClient(client, message);
            }
        }
    }

    // Add statistics methods
    getStatistics() {
        const now = Date.now();
        const stats = {
            total_clients: this.clients.size,
            authenticated_clients: 0,
            total_subscriptions: 0,
            clients_by_connection_time: {
                less_than_1m: 0,
                less_than_5m: 0,
                less_than_1h: 0,
                more_than_1h: 0
            },
            total_entities_tracked: this.entityStates.size
        };

        for (const client of this.clients.values()) {
            if (client.authenticated) stats.authenticated_clients++;

            stats.total_subscriptions +=
                client.subscriptions.entities.size +
                client.subscriptions.events.size +
                client.subscriptions.domains.size;

            const connectionDuration = now - client.connectionTime;
            if (connectionDuration < 60000) stats.clients_by_connection_time.less_than_1m++;
            else if (connectionDuration < 300000) stats.clients_by_connection_time.less_than_5m++;
            else if (connectionDuration < 3600000) stats.clients_by_connection_time.less_than_1h++;
            else stats.clients_by_connection_time.more_than_1h++;
        }

        return stats;
    }
}

export const sseManager = SSEManager.getInstance(); 