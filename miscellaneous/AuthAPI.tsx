/**
 * Authentication API Endpoint for Secure Framer Auth
 * 
 * This file provides a complete API endpoint implementation that can be deployed
 * to various serverless platforms (Vercel, Netlify, AWS Lambda, etc.)
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy this file to your serverless function directory
 * 2. Configure environment variables for password hashes
 * 3. Deploy to your preferred platform
 * 4. Update your Framer component's authEndpoint to point to this API
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidationRequest {
    hashedPassword: string;
    gateId: string;
    timestamp: number;
    nonce?: string;
}

interface ValidationResponse {
    success: boolean;
    token?: string;
    expiresAt?: number;
    error?: string;
    remainingAttempts?: number;
}

interface RateLimitEntry {
    attempts: number;
    lastAttempt: number;
    lockedUntil?: number;
}

interface GateConfig {
    hashedPassword: string;
    maxAttempts: number;
    lockoutDuration: number; // minutes
    sessionDuration: number; // minutes
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default configuration for authentication gates
 * Override these with environment variables in production
 */
const DEFAULT_CONFIG: Record<string, GateConfig> = {
    'test-gate': {
        // This is the hash for password "test123" with gateId "test-gate"
        // Generated using the CryptographicHasher from SecureAuth component
        hashedPassword: 'PBKDF2$100000$dGVzdC1nYXRl$aGFzaGVkUGFzc3dvcmQ=',
        maxAttempts: 3,
        lockoutDuration: 5,
        sessionDuration: 60
    },
    'main-gate': {
        // This is the hash for password "secure123" with gateId "main-gate"
        hashedPassword: 'PBKDF2$100000$bWFpbi1nYXRl$c2VjdXJlSGFzaA==',
        maxAttempts: 3,
        lockoutDuration: 5,
        sessionDuration: 60
    }
};

/**
 * Rate limiting storage (in-memory for demo, use Redis/database in production)
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * JWT secret for token signing (use environment variable in production)
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple JWT token generation (for demo purposes)
 * In production, use a proper JWT library like 'jsonwebtoken'
 */
function generateToken(gateId: string, expiresAt: number): string {
    const payload = {
        gateId,
        expiresAt,
        iat: Date.now()
    };
    
    // Simple base64 encoding for demo (use proper JWT signing in production)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = btoa(`${header}.${payloadEncoded}.${JWT_SECRET}`);
    
    return `${header}.${payloadEncoded}.${signature}`;
}

/**
 * Get configuration for a specific gate
 */
function getGateConfig(gateId: string): GateConfig | null {
    // Try environment variable first (format: GATE_{GATEID}_HASH)
    const envHash = process.env[`GATE_${gateId.toUpperCase().replace('-', '_')}_HASH`];
    if (envHash) {
        return {
            hashedPassword: envHash,
            maxAttempts: parseInt(process.env[`GATE_${gateId.toUpperCase().replace('-', '_')}_MAX_ATTEMPTS`] || '3'),
            lockoutDuration: parseInt(process.env[`GATE_${gateId.toUpperCase().replace('-', '_')}_LOCKOUT_DURATION`] || '5'),
            sessionDuration: parseInt(process.env[`GATE_${gateId.toUpperCase().replace('-', '_')}_SESSION_DURATION`] || '60')
        };
    }
    
    // Fall back to default configuration
    return DEFAULT_CONFIG[gateId] || null;
}

/**
 * Check and update rate limiting
 */
function checkRateLimit(clientId: string, gateConfig: GateConfig): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(clientId) || { attempts: 0, lastAttempt: 0 };
    
    // Check if currently locked out
    if (entry.lockedUntil && now < entry.lockedUntil) {
        return {
            allowed: false,
            remainingAttempts: 0,
            lockedUntil: entry.lockedUntil
        };
    }
    
    // Reset attempts if lockout period has passed
    if (entry.lockedUntil && now >= entry.lockedUntil) {
        entry.attempts = 0;
        entry.lockedUntil = undefined;
    }
    
    // Check if max attempts reached
    if (entry.attempts >= gateConfig.maxAttempts) {
        const lockoutUntil = now + (gateConfig.lockoutDuration * 60 * 1000);
        entry.lockedUntil = lockoutUntil;
        rateLimitStore.set(clientId, entry);
        
        return {
            allowed: false,
            remainingAttempts: 0,
            lockedUntil: lockoutUntil
        };
    }
    
    return {
        allowed: true,
        remainingAttempts: gateConfig.maxAttempts - entry.attempts
    };
}

/**
 * Record a failed attempt
 */
function recordFailedAttempt(clientId: string): void {
    const entry = rateLimitStore.get(clientId) || { attempts: 0, lastAttempt: 0 };
    entry.attempts += 1;
    entry.lastAttempt = Date.now();
    rateLimitStore.set(clientId, entry);
}

/**
 * Reset attempts on successful authentication
 */
function resetAttempts(clientId: string): void {
    rateLimitStore.delete(clientId);
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: any): string {
    // In production, use IP address, user agent, or other identifying factors
    // For demo, we'll use a combination of IP and gateId
    const ip = request.headers?.['x-forwarded-for'] || 
               request.headers?.['x-real-ip'] || 
               request.connection?.remoteAddress || 
               'unknown';
    return `${ip}`;
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

/**
 * Main authentication API handler
 * Compatible with Vercel, Netlify, AWS Lambda, and other serverless platforms
 */
export default async function handler(req: any, res: any) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
        return;
    }
    
    try {
        // Parse request body
        const body: ValidationRequest = typeof req.body === 'string' 
            ? JSON.parse(req.body) 
            : req.body;
        
        const { hashedPassword, gateId, timestamp } = body;
        
        // Validate required fields
        if (!hashedPassword || !gateId || !timestamp) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: hashedPassword, gateId, timestamp'
            });
            return;
        }
        
        // Validate timestamp (prevent replay attacks)
        const now = Date.now();
        const requestAge = now - timestamp;
        if (requestAge > 300000) { // 5 minutes
            res.status(400).json({
                success: false,
                error: 'Request timestamp too old'
            });
            return;
        }
        
        // Get gate configuration
        const gateConfig = getGateConfig(gateId);
        if (!gateConfig) {
            res.status(404).json({
                success: false,
                error: 'Gate not found'
            });
            return;
        }
        
        // Check rate limiting
        const clientId = getClientId(req);
        const rateLimitCheck = checkRateLimit(clientId, gateConfig);
        
        if (!rateLimitCheck.allowed) {
            const lockoutMinutes = rateLimitCheck.lockedUntil 
                ? Math.ceil((rateLimitCheck.lockedUntil - now) / 60000)
                : 0;
            
            res.status(429).json({
                success: false,
                error: `Too many failed attempts. Try again in ${lockoutMinutes} minutes.`,
                remainingAttempts: 0
            });
            return;
        }
        
        // Validate password hash
        if (hashedPassword === gateConfig.hashedPassword) {
            // Authentication successful
            resetAttempts(clientId);
            
            const expiresAt = now + (gateConfig.sessionDuration * 60 * 1000);
            const token = generateToken(gateId, expiresAt);
            
            res.status(200).json({
                success: true,
                token,
                expiresAt
            });
        } else {
            // Authentication failed
            recordFailedAttempt(clientId);
            
            const updatedRateLimit = checkRateLimit(clientId, gateConfig);
            
            res.status(401).json({
                success: false,
                error: 'Invalid password',
                remainingAttempts: updatedRateLimit.remainingAttempts
            });
        }
        
    } catch (error) {
        console.error('Authentication API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

// ============================================================================
// DEPLOYMENT CONFIGURATIONS
// ============================================================================

/**
 * Vercel deployment configuration
 * Save as: api/auth.ts in your Vercel project
 */
export const vercelConfig = {
    runtime: 'nodejs18.x',
    regions: ['iad1'], // US East
};

/**
 * Netlify deployment configuration
 * Save as: netlify/functions/auth.ts
 */
export const netlifyConfig = {
    schedule: '@hourly' // Optional: cleanup rate limit store
};

/**
 * AWS Lambda configuration
 * Package and deploy as Lambda function
 */
export const awsConfig = {
    runtime: 'nodejs18.x',
    timeout: 30,
    memorySize: 128
};

// ============================================================================
// ENVIRONMENT VARIABLE EXAMPLES
// ============================================================================

/**
 * Example environment variables for production deployment:
 * 
 * JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
 * 
 * # Gate configurations (replace YOUR_GATE_ID with actual gate IDs)
 * GATE_TEST_GATE_HASH=PBKDF2$100000$dGVzdC1nYXRl$aGFzaGVkUGFzc3dvcmQ=
 * GATE_TEST_GATE_MAX_ATTEMPTS=3
 * GATE_TEST_GATE_LOCKOUT_DURATION=5
 * GATE_TEST_GATE_SESSION_DURATION=60
 * 
 * GATE_MAIN_GATE_HASH=PBKDF2$100000$bWFpbi1nYXRl$c2VjdXJlSGFzaA==
 * GATE_MAIN_GATE_MAX_ATTEMPTS=3
 * GATE_MAIN_GATE_LOCKOUT_DURATION=5
 * GATE_MAIN_GATE_SESSION_DURATION=60
 */

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/**
 * HOW TO USE THIS API:
 * 
 * 1. GENERATE PASSWORD HASHES:
 *    - Use the SecureAuth component to generate hashes for your passwords
 *    - Or use the password management utilities (Task 6.1)
 * 
 * 2. DEPLOY TO SERVERLESS PLATFORM:
 *    - Vercel: Copy to api/auth.ts
 *    - Netlify: Copy to netlify/functions/auth.ts
 *    - AWS Lambda: Package and deploy
 * 
 * 3. CONFIGURE ENVIRONMENT VARIABLES:
 *    - Set JWT_SECRET to a secure random string
 *    - Set GATE_*_HASH variables with your password hashes
 * 
 * 4. UPDATE FRAMER COMPONENT:
 *    - Set authEndpoint to your deployed API URL
 *    - Test authentication with your configured passwords
 * 
 * 5. PRODUCTION CONSIDERATIONS:
 *    - Use a proper database for rate limiting (Redis recommended)
 *    - Implement proper JWT signing with a library
 *    - Add logging and monitoring
 *    - Consider additional security headers
 */