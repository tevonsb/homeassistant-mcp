import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Support both HASS_BASE_URL (library convention) and HASS_HOST (documented)
const baseUrl = process.env.HASS_BASE_URL || process.env.HASS_HOST || 'http://homeassistant.local:8123';

export const HASS_CONFIG = {
    BASE_URL: baseUrl,
    TOKEN: process.env.HASS_TOKEN || '',
    SOCKET_URL: process.env.HASS_SOCKET_URL || `${baseUrl.replace(/^http/, 'ws')}/api/websocket`,
    SOCKET_TOKEN: process.env.HASS_TOKEN || '',
}; 