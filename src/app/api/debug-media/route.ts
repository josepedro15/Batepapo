
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
    const supabase = createAdminClient()

    if (!supabase) return NextResponse.json({ error: 'No Supabase' })

    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .neq('media_url', null)
        .order('created_at', { ascending: false })
        .limit(5)

    return NextResponse.json({ messages })
}
