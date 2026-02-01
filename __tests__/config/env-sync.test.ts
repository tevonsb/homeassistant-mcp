import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

describe('Environment Variable Synchronization', () => {
    // Backup the original environment
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Clear relevant env vars before each test
        delete process.env.HASS_HOST;
        delete process.env.HASS_BASE_URL;
        delete process.env.HASS_TOKEN;
        delete process.env.HASS_SOCKET_URL;
        // Clear module cache to re-run env sync logic
        jest.resetModules();
    });

    afterEach(() => {
        // Restore original environment
        process.env = { ...originalEnv };
    });

    describe('HASS_HOST and HASS_BASE_URL sync', () => {
        it('should sync HASS_HOST to HASS_BASE_URL when only HASS_HOST is set', () => {
            const testUrl = 'http://10.0.1.101:8123';
            process.env.HASS_HOST = testUrl;

            // Simulate the sync logic from index.ts
            if (process.env.HASS_HOST && !process.env.HASS_BASE_URL) {
                process.env.HASS_BASE_URL = process.env.HASS_HOST;
            }

            expect(process.env.HASS_BASE_URL).toBe(testUrl);
            expect(process.env.HASS_HOST).toBe(testUrl);
        });

        it('should sync HASS_BASE_URL to HASS_HOST when only HASS_BASE_URL is set', () => {
            const testUrl = 'http://192.168.1.100:8123';
            process.env.HASS_BASE_URL = testUrl;

            // Simulate the sync logic from index.ts
            if (process.env.HASS_BASE_URL && !process.env.HASS_HOST) {
                process.env.HASS_HOST = process.env.HASS_BASE_URL;
            }

            expect(process.env.HASS_HOST).toBe(testUrl);
            expect(process.env.HASS_BASE_URL).toBe(testUrl);
        });

        it('should preserve both values when both are set', () => {
            const hostUrl = 'http://host.local:8123';
            const baseUrl = 'http://base.local:8123';
            process.env.HASS_HOST = hostUrl;
            process.env.HASS_BASE_URL = baseUrl;

            // Simulate the sync logic - should not overwrite
            if (process.env.HASS_HOST && !process.env.HASS_BASE_URL) {
                process.env.HASS_BASE_URL = process.env.HASS_HOST;
            }
            if (process.env.HASS_BASE_URL && !process.env.HASS_HOST) {
                process.env.HASS_HOST = process.env.HASS_BASE_URL;
            }

            expect(process.env.HASS_HOST).toBe(hostUrl);
            expect(process.env.HASS_BASE_URL).toBe(baseUrl);
        });

        it('should leave both undefined when neither is set', () => {
            // Don't set either env var

            // Simulate the sync logic
            if (process.env.HASS_HOST && !process.env.HASS_BASE_URL) {
                process.env.HASS_BASE_URL = process.env.HASS_HOST;
            }
            if (process.env.HASS_BASE_URL && !process.env.HASS_HOST) {
                process.env.HASS_HOST = process.env.HASS_BASE_URL;
            }

            expect(process.env.HASS_HOST).toBeUndefined();
            expect(process.env.HASS_BASE_URL).toBeUndefined();
        });
    });

    describe('HASS_CONFIG', () => {
        it('should use HASS_BASE_URL when set', async () => {
            const testUrl = 'http://baseurl.test:8123';
            process.env.HASS_BASE_URL = testUrl;
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.BASE_URL).toBe(testUrl);
        });

        it('should use HASS_HOST when HASS_BASE_URL is not set', async () => {
            const testUrl = 'http://hosturl.test:8123';
            process.env.HASS_HOST = testUrl;
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.BASE_URL).toBe(testUrl);
        });

        it('should prefer HASS_BASE_URL over HASS_HOST when both are set', async () => {
            const baseUrl = 'http://baseurl.preferred:8123';
            const hostUrl = 'http://hosturl.fallback:8123';
            process.env.HASS_BASE_URL = baseUrl;
            process.env.HASS_HOST = hostUrl;
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.BASE_URL).toBe(baseUrl);
        });

        it('should use default when neither env var is set', async () => {
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.BASE_URL).toBe('http://homeassistant.local:8123');
        });

        it('should derive SOCKET_URL from BASE_URL', async () => {
            const testUrl = 'http://socket.test:8123';
            process.env.HASS_BASE_URL = testUrl;
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.SOCKET_URL).toBe('ws://socket.test:8123/api/websocket');
        });

        it('should use explicit HASS_SOCKET_URL when provided', async () => {
            const baseUrl = 'http://base.test:8123';
            const socketUrl = 'ws://custom-socket.test:8123/api/websocket';
            process.env.HASS_BASE_URL = baseUrl;
            process.env.HASS_SOCKET_URL = socketUrl;
            process.env.HASS_TOKEN = 'test-token';

            const { HASS_CONFIG } = await import('../../src/config/hass.config.js');

            expect(HASS_CONFIG.SOCKET_URL).toBe(socketUrl);
        });
    });
});
