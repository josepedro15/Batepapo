/**
 * Environment variable validation
 * Validates required environment variables at build/runtime
 */

function getEnvVar(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}. ` +
            `Please check your .env.local file.`
        )
    }
    return value
}

// Supabase Configuration
export const env = {
    supabase: {
        url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },
} as const

// Type-safe environment access
export type Env = typeof env
