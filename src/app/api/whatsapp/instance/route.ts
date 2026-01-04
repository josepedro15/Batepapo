import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

// Helper to get base URL for webhook
// IMPORTANT: Must use production URL, not preview URLs!
function getWebhookUrl(): string {
  // 1. Use explicit app URL if set (should be production domain)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    // Clean up URL and ensure production format
    const cleanUrl = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `https://${cleanUrl}/api/whatsapp/webhook`
  }

  // 2. Hardcoded production fallback (VERCEL_URL gives preview URLs!)
  // Update this if your production domain changes
  return 'https://crm-batepapo.vercel.app/api/whatsapp/webhook'
}

// GET: Fetch current WhatsApp instance for org
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Get WhatsApp instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, status, phone_number, webhook_configured, created_at')
      .eq('organization_id', membership.organization_id)
      .single()

    if (!instance) {
      return NextResponse.json({ configured: false })
    }

    return NextResponse.json({
      configured: true,
      instance
    })
  } catch (error) {
    console.error('Error fetching WhatsApp instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new WhatsApp instance and start connection
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and verify role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (!['owner', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners/managers can manage WhatsApp' }, { status: 403 })
    }

    // Check if instance already exists
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_token')
      .eq('organization_id', membership.organization_id)
      .single()

    if (existingInstance) {
      return NextResponse.json({
        error: 'Instance already exists. Use connect endpoint instead.',
        instance_id: existingInstance.id
      }, { status: 400 })
    }

    // Generate unique instance name
    const instanceName = `org_${membership.organization_id.split('-')[0]}`

    try {
      // 1. Create instance in UAZAPI
      console.log('Creating UAZAPI instance:', instanceName)
      const { token: instanceToken } = await uazapi.createInstance(instanceName)

      // 2. Configure webhook
      console.log('Configuring webhook...')
      const webhookUrl = getWebhookUrl()
      await uazapi.configureWebhook(instanceToken, webhookUrl)

      // 3. Start connection (generate QR)
      console.log('Starting connection...')
      const connectResult = await uazapi.connect(instanceToken)

      // 4. Save to database
      const { data: instance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          organization_id: membership.organization_id,
          instance_name: instanceName,
          instance_token: instanceToken,
          status: 'connecting',
          webhook_configured: true
        })
        .select('id, instance_name, status')
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to cleanup UAZAPI instance
        try { await uazapi.deleteInstance(instanceToken) } catch { }
        return NextResponse.json({ error: 'Failed to save instance' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        instance,
        qrcode: connectResult.qrcode,
        pairingCode: connectResult.pairingCode
      })

    } catch (uazapiError) {
      console.error('UAZAPI error:', uazapiError)
      return NextResponse.json({
        error: `UAZAPI error: ${uazapiError instanceof Error ? uazapiError.message : 'Unknown error'}`
      }, { status: 502 })
    }

  } catch (error) {
    console.error('Error in POST /api/whatsapp/instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove WhatsApp instance
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization and verify role
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (!['owner', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Only owners/managers can manage WhatsApp' }, { status: 403 })
    }

    // Get instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_token')
      .eq('organization_id', membership.organization_id)
      .single()

    if (!instance) {
      return NextResponse.json({ error: 'No instance found' }, { status: 404 })
    }

    // Delete from UAZAPI
    try {
      await uazapi.deleteInstance(instance.instance_token)
    } catch (e) {
      console.warn('Failed to delete from UAZAPI (may already be deleted):', e)
    }

    // Delete from database
    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instance.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete instance' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Instance deleted' })
  } catch (error) {
    console.error('Error in DELETE /api/whatsapp/instance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
