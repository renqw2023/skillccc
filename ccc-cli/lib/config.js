/**
 * Configuration file for CCC CLI
 * Centralized API and environment settings
 */

export const config = {
    // API Base URL
    // Production
    apiBase: process.env.CCC_API_BASE || 'https://www.ccc.onl/api',

    // Development (uncomment to use local API)
    // apiBase: 'http://localhost:3001/api',

    // Installation directory
    defaultDir: '.skills',

    // Network settings
    timeout: 30000, // 30 seconds

    // Version
    version: '1.0.1'
};

/**
 * Environment detection
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
