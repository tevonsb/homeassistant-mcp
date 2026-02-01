import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { HelmetOptions } from 'helmet';

// Security configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests per window
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting middleware
export const rateLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later'
});

// Security configuration
const helmetConfig: HelmetOptions = {
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'https:']
        }
    },
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: {
        policy: ['no-referrer', 'strict-origin-when-cross-origin']
    }
};

// Security headers middleware
export const securityHeaders = helmet(helmetConfig);

// Token validation and encryption
export class TokenManager {
    private static readonly algorithm = 'aes-256-gcm';
    private static readonly keyLength = 32;
    private static readonly ivLength = 16;
    private static readonly saltLength = 64;
    private static readonly tagLength = 16;
    private static readonly iterations = 100000;
    private static readonly digest = 'sha512';

    private static deriveKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(
            password,
            salt,
            this.iterations,
            this.keyLength,
            this.digest
        );
    }

    public static encryptToken(token: string, encryptionKey: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const salt = crypto.randomBytes(this.saltLength);
        const key = this.deriveKey(encryptionKey, salt);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
            authTagLength: this.tagLength
        });

        const encrypted = Buffer.concat([
            cipher.update(token, 'utf8'),
            cipher.final()
        ]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }

    public static decryptToken(encryptedToken: string, encryptionKey: string): string {
        const buffer = Buffer.from(encryptedToken, 'base64');
        const salt = buffer.subarray(0, this.saltLength);
        const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
        const tag = buffer.subarray(
            this.saltLength + this.ivLength,
            this.saltLength + this.ivLength + this.tagLength
        );
        const encrypted = buffer.subarray(this.saltLength + this.ivLength + this.tagLength);
        const key = this.deriveKey(encryptionKey, salt);

        const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
            authTagLength: this.tagLength
        });
        decipher.setAuthTag(tag);

        return decipher.update(encrypted) + decipher.final('utf8');
    }

    public static validateToken(token: string): boolean {
        if (!token) return false;

        try {
            // Check token format
            if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
                return false;
            }

            // Decode token parts
            const [headerEncoded, payloadEncoded] = token.split('.');
            const header = JSON.parse(Buffer.from(headerEncoded, 'base64').toString());
            const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());

            // Check token expiry
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                return false;
            }

            // Additional checks can be added here
            return true;
        } catch {
            return false;
        }
    }
}

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
    // Skip validation for health and MCP endpoints (they handle their own validation)
    if (req.path === '/health' || req.path === '/mcp') {
        return next();
    }

    // Validate content type
    if (req.method !== 'GET' && !req.is('application/json')) {
        return res.status(415).json({
            error: 'Unsupported Media Type - Content-Type must be application/json'
        });
    }

    // Validate token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !TokenManager.validateToken(token)) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

    // Validate request body
    if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object')) {
        return res.status(400).json({
            error: 'Invalid request body'
        });
    }

    next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
        const sanitized = JSON.parse(
            JSON.stringify(req.body).replace(/[<>]/g, '')
        );
        req.body = sanitized;
    }
    next();
}

// Error handling middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}

// Export security middleware chain
export const securityMiddleware = [
    helmet(helmetConfig),
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100
    }),
    validateRequest,
    sanitizeInput,
    errorHandler
]; 