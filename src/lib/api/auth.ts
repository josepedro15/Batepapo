import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function authorizeApiKey(request: Request) {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
        return { error: 'Missing API Key', status: 401 }
    }

    // Hash the incoming key to compare with DB
    const hashed = crypto.createHash('sha256').update(apiKey).digest('hex')

    const supabase = await createClient()
    const { data: keyRecord } = await supabase
        .from('api_keys')
        .select('organization_id')
        .eq('key_hash', hashed)
        .single()

    if (!keyRecord) {
        return { error: 'Invalid API Key', status: 403 }
    }

    // Update usage stats (fire and forget)
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', hashed)

    return { organizationId: keyRecord.organization_id }
}
