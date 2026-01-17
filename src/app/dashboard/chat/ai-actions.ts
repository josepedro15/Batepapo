'use server'

import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { Message } from '@/types/database'

// const openai = new OpenAI(...) // Removed from top-level

export async function generateAIResponse(messages: Message[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    // 1. Get Organization ID & Context
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, organizations!inner(name, website, description, instagram, facebook, linkedin, address)')
        .eq('user_id', user.id)
        .single()

    if (!member?.organization_id) {
        return { error: 'Organização não encontrada.' }
    }

    const orgId = member.organization_id
    const org = (member as any).organizations
    const companyContext = `
DADOS DA EMPRESA (Contexto Global):
Nome: ${org.name}
Descrição: ${org.description || 'N/A'}
Site: ${org.website || 'N/A'}
Instagram: ${org.instagram || 'N/A'}
`

    // 2. Check Daily Limit (40 requests / day)
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', startOfDay.toISOString())

    if (countError) {
        console.error('Error checking AI usage limit:', countError)
        return { error: 'Erro ao verificar limite de uso.' }
    }

    if (count !== null && count >= 40) {
        return { error: 'Limite diário de 40 solicitações de IA atingido.' }
    }

    // 3. Fetch Organization Settings
    const { data: settings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single()

    const model = 'gpt-4o-mini'
    const temperature = 0.7
    const customPrompt = settings?.system_prompt

    // 4. Prepare Messages for OpenAI
    // Take last 30 messages
    const recentMessages = messages.slice(-30)

    // ... (rest of logging logic omitted for brevity, logic remains same)

    if (recentMessages.length === 0) {
        return { error: 'Não há histórico suficiente para gerar uma resposta.' }
    }

    const formattedMessages = recentMessages
        .filter(msg => msg.sender_type !== 'system')
        .map(msg => ({
            role: msg.sender_type === 'user' ? 'assistant' as const : 'user' as const,
            content: msg.body || (msg.media_type ? `[Mídia: ${msg.media_type}]` : '')
        }))
        .filter(m => m.content)

    // Add system prompt
    const defaultPrompt = `Você é um assistente de vendas experiente e prestativo. Seu objetivo é ajudar o atendente a responder o cliente da melhor forma possível.
    
${companyContext}

    Analise o histórico e sugira uma resposta adequada.
    Mantenha um tom profissional, porém amigável.
    Responda em português do Brasil.`

    const systemPrompt = {
        role: 'system',
        content: customPrompt ? `${customPrompt}\n\n${companyContext}` : defaultPrompt
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                systemPrompt,
                ...formattedMessages
            ] as any,
            temperature: temperature,
            max_tokens: 500
        })

        const suggestion = response.choices[0]?.message?.content

        if (!suggestion) {
            return { error: 'A IA não retornou nenhuma sugestão.' }
        }

        await supabase.from('ai_usage_logs').insert({
            organization_id: orgId,
            user_id: user.id,
            feature: 'chat_suggestion'
        })

        return { success: true, suggestion }

    } catch (error: any) {
        console.error('OpenAI API Error:', error)
        return { error: `Erro na API da IA: ${error.message}` }
    }
}

export async function generateCampaignCopy(targetAudience: string, messageInfo: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado.' }
    }

    // 1. Get Organization ID & Context
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, organizations!inner(name, website, description, instagram, facebook, linkedin, address)')
        .eq('user_id', user.id)
        .single()

    if (!member?.organization_id) {
        return { error: 'Organização não encontrada.' }
    }

    const orgId = member.organization_id
    const org = (member as any).organizations
    const companyContext = `
DADOS DA EMPRESA (Contexto Global):
Nome: ${org.name}
Descrição: ${org.description || 'N/A'}
Site: ${org.website || 'N/A'}
Instagram: ${org.instagram || 'N/A'}
`

    // 2. Check Daily Limit (5 requests / day) for Campaigns
    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('feature', 'campaign_copy')
        .gte('created_at', startOfDay.toISOString())

    if (countError) {
        console.error('Error checking AI usage limit:', countError)
        return { error: 'Erro ao verificar limite de uso.' }
    }

    if (count !== null && count >= 5) {
        return { error: 'Limite diário de 5 gerações de campanha atingido.' }
    }

    // 3. Prepare Prompt
    const systemPrompt = `Você é um especialista em Copywriting para Marketing e Vendas (CRM).
    Seu objetivo é criar uma mensagem de campanha persuasiva para envio em massa.
    
${companyContext}
    
    Público Alvo: ${targetAudience}
    Informações da Mensagem: ${messageInfo}
    
    Diretrizes:
    - Crie uma mensagem curta, direta e engajadora.
    - Foque na conversão ou na ação desejada.
    - Use emojis com moderação.
    - Se for WhatsApp, evite textos muito longos.
    - Responda apenas com o texto da mensagem sugerida.`

    // Lazy init OpenAI
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt }
            ] as any,
            temperature: 0.8,
            max_tokens: 500
        })

        const suggestion = response.choices[0]?.message?.content

        if (!suggestion) {
            return { error: 'A IA não retornou nenhuma sugestão.' }
        }

        await supabase.from('ai_usage_logs').insert({
            organization_id: orgId,
            user_id: user.id,
            feature: 'campaign_copy'
        })

        return { success: true, suggestion }

    } catch (error: any) {
        console.error('OpenAI API Error:', error)
        return { error: `Erro na API da IA: ${error.message}` }
    }
}

export async function getRemainingAIRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!member) return 0

    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { count } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .eq('feature', 'chat_suggestion') // Only count chat suggestions
        .gte('created_at', startOfDay.toISOString())

    const usage = count || 0
    return Math.max(0, 40 - usage)
}

export async function getRemainingCampaignRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!member) return 0

    const startOfDay = new Date()
    startOfDay.setUTCHours(0, 0, 0, 0)

    const { count } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .eq('feature', 'campaign_copy')
        .gte('created_at', startOfDay.toISOString())

    const usage = count || 0
    return Math.max(0, 5 - usage)
}
