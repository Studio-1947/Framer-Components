/**
 * Secure Framer Authentication System
 * Complete authentication component with all interfaces, types, and utilities
 * Copy this entire file into Framer for full functionality
 */

import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================



/**
 * Storage types for token management
 */
export type StorageType = 'sessionStorage' | 'localStorage' | 'memory'

/**
 * Hash algorithms supported for password hashing
 */
export type HashAlgorithm = 'SHA-256' | 'PBKDF2'

/**
 * Error types in the authentication system
 */
export type ErrorType = 'network' | 'authentication' | 'configuration' | 'security'

/**
 * Security error severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Timestamp in milliseconds since epoch
 */
export type Timestamp = number

/**
 * Duration in minutes
 */
export type Duration = number

/**
 * Cryptographic nonce for request uniqueness
 */
export type Nonce = string

/**
 * Unique identifier for authentication gates
 */
export type GateId = string

/**
 * JWT or similar authentication token
 */
export type AuthToken = string

/**
 * Cryptographically hashed password
 */
export type HashedPassword = string

// ============================================================================
// FRAMER COMPONENT INTERFACES
// ============================================================================

/**
 * Props interface for the main SecureAuthComponent
 * Defines all configurable properties available in Framer's property panel
 */
export interface SecureAuthProps {
    // Configuration
    authEndpoint: string           // External validation service URL
    gateId: string                // Unique identifier for this auth gate
    redirectUrl?: string          // Success redirect destination

    // UI Customization
    title?: string
    placeholder?: string
    errorMessage?: string
    loadingMessage?: string

    // Security Settings
    maxAttempts?: number          // Rate limiting
    lockoutDuration?: number      // Temporary lockout time (minutes)
    sessionDuration?: number      // Token validity period (minutes)

    // Styling
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
}

/**
 * Authentication state managed by the component
 */
export interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    attemptsRemaining: number
    lockedUntil: number | null
    token: string | null
    expiresAt: number | null
}

// ============================================================================
// CRYPTOGRAPHIC INTERFACES
// ============================================================================

/**
 * Interface for client-side password hashing utilities
 */
export interface CryptographicHasher {
    generateHash(password: string, gateId: string): Promise<string>
    validateHashFormat(hash: string): boolean
}

/**
 * Interface for secure token management
 */
export interface SecureTokenManager {
    storeToken(gateId: string, token: string, expiresAt: number): void
    getToken(gateId: string): string | null
    isTokenValid(gateId: string): boolean
    clearToken(gateId: string): void
    clearAllTokens(): void
}

// ============================================================================
// EXTERNAL SERVICE INTERFACES
// ============================================================================

/**
 * Interface for authentication validation service
 */
export interface AuthValidationService {
    validateCredentials(hashedPassword: string, gateId: string): Promise<AuthResult>
    refreshToken(token: string): Promise<TokenResult>
    revokeAccess(gateId: string): Promise<void>
}

/**
 * Result of authentication validation
 */
export interface AuthResult {
    success: boolean
    token?: string
    expiresAt?: number
    error?: string
    remainingAttempts?: number
}

/**
 * Result of token operations
 */
export interface TokenResult {
    success: boolean
    token?: string
    expiresAt?: number
    error?: string
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Request payload for password validation API
 */
export interface ValidationRequest {
    hashedPassword: string
    gateId: string
    timestamp: number
    nonce: string
}

/**
 * Response from password validation API
 */
export interface ValidationResponse {
    success: boolean
    token?: string
    expiresAt?: number
    error?: string
    remainingAttempts?: number
}

/**
 * Request payload for token refresh API
 */
export interface TokenRefreshRequest {
    token: string
    gateId: string
    timestamp: number
}

/**
 * Response from token refresh API
 */
export interface TokenRefreshResponse {
    success: boolean
    token?: string
    expiresAt?: number
    error?: string
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Security configuration options
 */
export interface SecurityConfig {
    hashAlgorithm: HashAlgorithm
    saltRounds: number
    tokenEncryption: boolean
    storageType: StorageType
    csrfProtection: boolean
}

/**
 * Gate-specific configuration
 */
export interface GateConfig {
    gateId: string
    authEndpoint: string
    maxAttempts: number
    lockoutDuration: number
    sessionDuration: number
    allowedOrigins: string[]
}

/**
 * Configuration for external authentication service deployment
 */
export interface ExternalServiceConfig {
    platform: 'vercel' | 'netlify' | 'aws' | 'custom'
    endpoint: string
    apiKey?: string
    region?: string
    environment: 'development' | 'staging' | 'production'
}

/**
 * Database configuration for password storage
 */
export interface DatabaseConfig {
    type: 'sqlite' | 'postgresql' | 'mysql' | 'mongodb'
    connectionString?: string
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

/**
 * Base error interface for authentication system
 */
export interface AuthError {
    type: ErrorType
    message: string
    code?: string
    details?: any
}

/**
 * Network-specific error
 */
export interface NetworkError extends AuthError {
    type: 'network'
    statusCode?: number
    retryable: boolean
}

/**
 * Authentication-specific error
 */
export interface AuthenticationError extends AuthError {
    type: 'authentication'
    remainingAttempts?: number
    lockedUntil?: number
}

/**
 * Configuration-specific error
 */
export interface ConfigurationError extends AuthError {
    type: 'configuration'
    field?: string
}

/**
 * Security-specific error
 */
export interface SecurityError extends AuthError {
    type: 'security'
    severity: SecuritySeverity
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
    handleNetworkError(error: NetworkError): Promise<void>
    handleAuthError(error: AuthenticationError): Promise<void>
    handleConfigError(error: ConfigurationError): Promise<void>
    handleSecurityError(error: SecurityError): Promise<void>
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

/**
 * Authentication attempt analytics
 */
export interface AuthAttempt {
    gateId: GateId
    timestamp: Timestamp
    success: boolean
    ipAddress?: string
    userAgent?: string
    errorType?: ErrorType
}

/**
 * Aggregated authentication statistics
 */
export interface AuthStats {
    gateId: GateId
    totalAttempts: number
    successfulAttempts: number
    failedAttempts: number
    uniqueIPs: number
    lastAttempt: Timestamp
    averageAttemptsPerDay: number
}

// ============================================================================
// UTILITY INTERFACES
// ============================================================================

/**
 * Password strength validation result
 */
export interface PasswordStrength {
    score: number // 0-100
    feedback: string[]
    isStrong: boolean
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number // Time window in milliseconds
    maxAttempts: number // Max attempts per window
    blockDuration: number // Block duration in milliseconds
}

/**
 * CSRF protection configuration
 */
export interface CSRFConfig {
    enabled: boolean
    tokenHeader: string
    cookieName: string
    sameSite: 'strict' | 'lax' | 'none'
}

// ============================================================================
// CRYPTOGRAPHIC UTILITIES
// ============================================================================

/**
 * Hash result structure
 */
interface HashResult {
    hash: string;
    salt: string;
    iterations: number;
    algorithm: string;
}

/**
 * Token data structure
 */
interface TokenData {
    token: string;
    expiresAt: number;
    createdAt: number;
    gateId: string;
}

/**
 * Encrypted token data structure
 */
interface EncryptedTokenData {
    data: string;
    iv: string;
    timestamp: number;
}

/**
 * Cryptographic hasher implementation
 */
class SecureCryptographicHasher implements CryptographicHasher {
    private readonly ITERATIONS = 100000;
    private readonly HASH_LENGTH = 32;
    private readonly ALGORITHM = 'PBKDF2';

    async generateHash(password: string, gateId: string): Promise<string> {
        if (!password || typeof password !== 'string') {
            throw new Error('Password must be a non-empty string');
        }
        if (!gateId || typeof gateId !== 'string') {
            throw new Error('GateId must be a non-empty string');
        }

        const salt = await this.generateDynamicSalt(gateId);
        const passwordBuffer = new TextEncoder().encode(password);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            this.HASH_LENGTH * 8
        );

        const result: HashResult = {
            hash: this.arrayBufferToBase64(hashBuffer),
            salt: this.arrayBufferToBase64(salt),
            iterations: this.ITERATIONS,
            algorithm: this.ALGORITHM
        };

        return this.formatHashResult(result);
    }

    validateHashFormat(hash: string): boolean {
        if (!hash || typeof hash !== 'string') return false;
        const parts = hash.split('$');
        if (parts.length !== 4) return false;
        const [algorithm, iterations, salt, hashValue] = parts;
        return algorithm === this.ALGORITHM && 
               !isNaN(parseInt(iterations, 10)) && 
               this.isValidBase64(salt) && 
               this.isValidBase64(hashValue);
    }

    private async generateDynamicSalt(gateId: string): Promise<ArrayBuffer> {
        const gateIdBuffer = new TextEncoder().encode(gateId);
        const saltHash = await crypto.subtle.digest('SHA-256', gateIdBuffer);
        return saltHash.slice(0, 16);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private formatHashResult(result: HashResult): string {
        return `${result.algorithm}$${result.iterations}$${result.salt}$${result.hash}`;
    }

    private isValidBase64(str: string): boolean {
        try {
            return btoa(atob(str)) === str;
        } catch {
            return false;
        }
    }
}

/**
 * Secure token manager implementation
 */
class SecureTokenManagerImpl implements SecureTokenManager {
    private readonly STORAGE_PREFIX = 'secure_auth_';
    private readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
    private readonly IV_LENGTH = 12;
    private readonly KEY_LENGTH = 256;
    
    private memoryStorage: Map<string, EncryptedTokenData> = new Map();
    private encryptionKey: CryptoKey | null = null;
    private storageType: StorageType;

    constructor(storageType: StorageType = 'sessionStorage') {
        this.storageType = storageType;
        this.initializeEncryptionKey();
    }

    storeToken(gateId: string, token: string, expiresAt: number): void {
        if (!gateId || !token) throw new Error('GateId and token are required');
        if (expiresAt <= Date.now()) throw new Error('Token expiration must be in the future');

        const tokenData: TokenData = {
            token,
            expiresAt,
            createdAt: Date.now(),
            gateId
        };

        this.encryptAndStore(gateId, tokenData);
    }

    getToken(gateId: string): string | null {
        if (!gateId) return null;

        const encryptedData = this.getEncryptedData(gateId);
        if (!encryptedData) return null;

        const tokenData = this.decryptTokenData(encryptedData);
        if (!tokenData) {
            this.clearToken(gateId);
            return null;
        }

        if (tokenData.expiresAt <= Date.now()) {
            this.clearToken(gateId);
            return null;
        }

        return tokenData.token;
    }

    isTokenValid(gateId: string): boolean {
        return this.getToken(gateId) !== null;
    }

    clearToken(gateId: string): void {
        const storageKey = this.getStorageKey(gateId);
        
        switch (this.storageType) {
            case 'sessionStorage':
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.removeItem(storageKey);
                }
                break;
            case 'localStorage':
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(storageKey);
                }
                break;
            case 'memory':
                this.memoryStorage.delete(storageKey);
                break;
        }
    }

    clearAllTokens(): void {
        switch (this.storageType) {
            case 'sessionStorage':
                if (typeof sessionStorage !== 'undefined') {
                    this.clearStorageByPrefix(sessionStorage);
                }
                break;
            case 'localStorage':
                if (typeof localStorage !== 'undefined') {
                    this.clearStorageByPrefix(localStorage);
                }
                break;
            case 'memory':
                this.memoryStorage.clear();
                break;
        }
    }

    private async initializeEncryptionKey(): Promise<void> {
        try {
            this.encryptionKey = await crypto.subtle.generateKey(
                { name: this.ENCRYPTION_ALGORITHM, length: this.KEY_LENGTH },
                false,
                ['encrypt', 'decrypt']
            );
        } catch {
            this.encryptionKey = null;
        }
    }

    private async encryptAndStore(gateId: string, tokenData: TokenData): Promise<void> {
        const storageKey = this.getStorageKey(gateId);
        
        if (!this.encryptionKey) {
            const fallbackData: EncryptedTokenData = {
                data: JSON.stringify(tokenData),
                iv: '',
                timestamp: Date.now()
            };
            this.storeEncryptedData(storageKey, fallbackData);
            return;
        }

        const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        const dataToEncrypt = new TextEncoder().encode(JSON.stringify(tokenData));
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: this.ENCRYPTION_ALGORITHM, iv: iv },
            this.encryptionKey,
            dataToEncrypt
        );

        const encryptedData: EncryptedTokenData = {
            data: this.arrayBufferToBase64(encryptedBuffer),
            iv: this.arrayBufferToBase64(iv),
            timestamp: Date.now()
        };

        this.storeEncryptedData(storageKey, encryptedData);
    }

    private getEncryptedData(gateId: string): EncryptedTokenData | null {
        const storageKey = this.getStorageKey(gateId);
        let dataString: string | null = null;

        switch (this.storageType) {
            case 'sessionStorage':
                if (typeof sessionStorage !== 'undefined') {
                    dataString = sessionStorage.getItem(storageKey);
                }
                break;
            case 'localStorage':
                if (typeof localStorage !== 'undefined') {
                    dataString = localStorage.getItem(storageKey);
                }
                break;
            case 'memory':
                return this.memoryStorage.get(storageKey) || null;
        }

        if (!dataString) return null;
        try {
            return JSON.parse(dataString) as EncryptedTokenData;
        } catch {
            return null;
        }
    }

    private storeEncryptedData(storageKey: string, encryptedData: EncryptedTokenData): void {
        const dataString = JSON.stringify(encryptedData);

        switch (this.storageType) {
            case 'sessionStorage':
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(storageKey, dataString);
                }
                break;
            case 'localStorage':
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(storageKey, dataString);
                }
                break;
            case 'memory':
                this.memoryStorage.set(storageKey, encryptedData);
                break;
        }
    }

    private async decryptTokenData(encryptedData: EncryptedTokenData): Promise<TokenData | null> {
        if (!this.encryptionKey) {
            try {
                return JSON.parse(encryptedData.data) as TokenData;
            } catch {
                return null;
            }
        }

        try {
            const iv = this.base64ToArrayBuffer(encryptedData.iv);
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: this.ENCRYPTION_ALGORITHM, iv: iv },
                this.encryptionKey,
                encryptedBuffer
            );

            const decryptedString = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decryptedString) as TokenData;
        } catch {
            return null;
        }
    }

    private getStorageKey(gateId: string): string {
        return `${this.STORAGE_PREFIX}${gateId}`;
    }

    private clearStorageByPrefix(storage: Storage): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(this.STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => storage.removeItem(key));
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Secure Authentication Component for Framer
 * Complete authentication system with integrated cryptographic utilities
 */
export default function SecureAuth(props: SecureAuthProps) {
    const {
        authEndpoint,
        gateId,
        redirectUrl,
        title = "Enter Password",
        placeholder = "Password",
        errorMessage = "Authentication failed",
        loadingMessage = "Authenticating...",
        maxAttempts = 3,
        lockoutDuration = 5,
        sessionDuration = 60,
        primaryColor = "#0066FF",
        backgroundColor = "#FFFFFF",
        textColor = "#000000"
    } = props

    // State management
    const [password, setPassword] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [attempts, setAttempts] = useState(0)
    const [lockedUntil, setLockedUntil] = useState<number | null>(null)

    // Initialize utilities
    const hasher = new SecureCryptographicHasher()
    const tokenManager = new SecureTokenManagerImpl('sessionStorage')

    // Check authentication status on mount
    useEffect(() => {
        const isValid = tokenManager.isTokenValid(gateId)
        setIsAuthenticated(isValid)
    }, [gateId])

    // Check if component is locked out
    const isLockedOut = lockedUntil && Date.now() < lockedUntil

    // Handle password submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (isLockedOut || !password.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            // Hash password before sending
            const hashedPassword = await hasher.generateHash(password, gateId)
            
            // Send to authentication API
            const response = await fetch(authEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    gateId, 
                    hashedPassword,
                    timestamp: Date.now()
                })
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success && result.token) {
                    // Store token and authenticate
                    const expiresAt = Date.now() + (sessionDuration * 60 * 1000)
                    tokenManager.storeToken(gateId, result.token, expiresAt)
                    setIsAuthenticated(true)
                    setPassword('')
                    setAttempts(0)
                    
                    // Redirect if specified
                    if (redirectUrl) {
                        window.location.href = redirectUrl
                    }
                } else {
                    throw new Error(result.error || errorMessage)
                }
            } else {
                throw new Error('Authentication failed')
            }
        } catch (err) {
            const newAttempts = attempts + 1
            setAttempts(newAttempts)
            setError(err instanceof Error ? err.message : errorMessage)
            
            // Lock out after max attempts
            if (newAttempts >= maxAttempts) {
                const lockoutEnd = Date.now() + (lockoutDuration * 60 * 1000)
                setLockedUntil(lockoutEnd)
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Handle logout
    const handleLogout = () => {
        tokenManager.clearToken(gateId)
        setIsAuthenticated(false)
        setPassword('')
        setError(null)
        setAttempts(0)
        setLockedUntil(null)
    }

    // Always use project fonts for seamless integration
    const resolvedFontFamily = "inherit"

    // If authenticated, show success state
    if (isAuthenticated) {
        return (
            <div
                style={{
                    fontFamily: resolvedFontFamily,
                    backgroundColor,
                    color: textColor,
                    padding: "20px",
                    borderRadius: "8px",
                    textAlign: "center",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                }}
            >
                <div style={{ 
                    color: "#22C55E", 
                    fontSize: "48px", 
                    marginBottom: "16px" 
                }}>
                    ✓
                </div>
                <h2 style={{ margin: "0 0 16px 0", color: textColor }}>
                    Access Granted
                </h2>
                <p style={{ margin: "0 0 20px 0", opacity: 0.7 }}>
                    You are successfully authenticated
                </p>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${textColor}`,
                        color: textColor,
                        padding: "8px 16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontFamily: resolvedFontFamily
                    }}
                >
                    Logout
                </button>
            </div>
        )
    }

    // Show login form
    return (
        <div
            style={{
                fontFamily: resolvedFontFamily,
                backgroundColor,
                color: textColor,
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }}
        >
            <h2 style={{ margin: "0 0 20px 0", color: textColor }}>
                {title}
            </h2>
            
            {isLockedOut && (
                <div style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "4px",
                    marginBottom: "16px",
                    fontSize: "14px"
                }}>
                    Too many failed attempts. Try again in {Math.ceil((lockedUntil! - Date.now()) / 60000)} minutes.
                </div>
            )}

            <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "300px" }}>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={placeholder}
                    disabled={isLoading || isLockedOut}
                    style={{
                        width: "100%",
                        padding: "12px",
                        border: `1px solid ${textColor}40`,
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontFamily: resolvedFontFamily,
                        marginBottom: "16px",
                        backgroundColor: isLockedOut ? "#F3F4F6" : backgroundColor
                    }}
                />
                
                <button
                    type="submit"
                    disabled={isLoading || isLockedOut || !password.trim()}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: primaryColor,
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontFamily: resolvedFontFamily,
                        cursor: isLoading || isLockedOut ? "not-allowed" : "pointer",
                        opacity: isLoading || isLockedOut ? 0.6 : 1
                    }}
                >
                    {isLoading ? loadingMessage : "Authenticate"}
                </button>
            </form>

            {error && (
                <div style={{
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    padding: "12px",
                    borderRadius: "4px",
                    marginTop: "16px",
                    fontSize: "14px"
                }}>
                    {error}
                    {attempts > 0 && attempts < maxAttempts && (
                        <div style={{ marginTop: "4px", fontSize: "12px" }}>
                            {maxAttempts - attempts} attempts remaining
                        </div>
                    )}
                </div>
            )}

            <div style={{
                marginTop: "20px",
                padding: "8px",
                backgroundColor: primaryColor + "10",
                borderRadius: "4px",
                fontSize: "11px",
                opacity: 0.7
            }}>
                Gate: {gateId} • Session: {sessionDuration}min
            </div>
        </div>
    )
}

// ============================================================================
// FRAMER PROPERTY CONTROLS
// ============================================================================

addPropertyControls(SecureAuth, {
    authEndpoint: {
        type: ControlType.String,
        title: "Auth Endpoint",
        description: "URL of the external authentication service",
        defaultValue: "https://your-auth-service.vercel.app/api/auth"
    },
    gateId: {
        type: ControlType.String,
        title: "Gate ID",
        description: "Unique identifier for this authentication gate",
        defaultValue: "main-gate"
    },
    redirectUrl: {
        type: ControlType.String,
        title: "Redirect URL",
        description: "URL to redirect to after successful authentication",
        defaultValue: ""
    },
    title: {
        type: ControlType.String,
        title: "Title",
        description: "Title displayed above the password input",
        defaultValue: "Enter Password"
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        description: "Placeholder text for password input",
        defaultValue: "Password"
    },
    maxAttempts: {
        type: ControlType.Number,
        title: "Max Attempts",
        description: "Maximum failed attempts before lockout",
        min: 1,
        max: 10,
        defaultValue: 3
    },
    lockoutDuration: {
        type: ControlType.Number,
        title: "Lockout Duration (minutes)",
        description: "How long to lock out after max attempts",
        min: 1,
        max: 60,
        defaultValue: 5
    },
    sessionDuration: {
        type: ControlType.Number,
        title: "Session Duration (minutes)",
        description: "How long authentication lasts",
        min: 5,
        max: 1440,
        defaultValue: 60
    },


    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        description: "Primary color for buttons and accents",
        defaultValue: "#0066FF"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        description: "Background color for the component",
        defaultValue: "#FFFFFF"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color for text elements",
        defaultValue: "#000000"
    }
})