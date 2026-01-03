import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Note: This client should ONLY be used in server-side contexts (Server Actions / API Routes)
// NEVER expose this to the client-side.

export function createAdminClient(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
        console.warn('Supabase Admin Client not configured - missing environment variables')
        return null
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export const adminAuthClient = createAdminClient()

