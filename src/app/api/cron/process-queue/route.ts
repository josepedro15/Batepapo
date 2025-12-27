import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// CRITICAL: This route should be protected by a Secret Key in production
// Vercel Cron automatically sends a header 'Authorization: Bearer <CRON_SECRET>'
export async function GET(request: Request) {
    const supabase = await createClient()

    // 1. Fetch N pending items (Batch Size = 5 to be safe on serverless)
    const { data: queueItems } = await supabase
        .from('campaign_queue')
        .select('*, campaigns(message_template)')
        .eq('status', 'pending')
        .limit(5)

    if (!queueItems || queueItems.length === 0) {
        return NextResponse.json({ message: 'Queue empty' })
    }

    const results = []

    // 2. Process Batch
    for (const item of queueItems) {
        // A. Simulate "sending to WhatsApp"
        // In real app, we would make a fetch() to the Node.js Baileys instance here
        // await fetch('https://my-wa-instance.com/send', { ... })

        // For MVP, we Insert into Messages table to show in Chat UI
        const { error: msgError } = await supabase.from('messages').insert({
            organization_id: item.organization_id,
            contact_id: item.contact_id,
            sender_type: 'user', // Sent by user (bot)
            sender_id: null, // System message essentially
            body: item.campaigns.message_template,
            status: 'sent'
        })

        if (msgError) {
            console.error('Failed to log message', msgError)
            await supabase.from('campaign_queue').update({ status: 'failed', attempt_count: item.attempt_count + 1 }).eq('id', item.id)
            results.push({ id: item.id, status: 'failed' })
            continue
        }

        // B. Mark Queue Item as Sent
        await supabase.from('campaign_queue').update({ status: 'sent', next_attempt_at: null }).eq('id', item.id)

        // C. Update Campaign Stats (Increment processed_count)
        // Note: Concurrency might be an issue here, ideally use a Postgres function "increment()"
        // But for MVP:
        // We skip atomic increment for simplicity or use rpc if needed.

        results.push({ id: item.id, status: 'sent' })

        // D. THROTTLING (Wait 1s between sends inside this batch)
        await new Promise(r => setTimeout(r, 1000))
    }

    return NextResponse.json({ processed: results.length, details: results })
}
