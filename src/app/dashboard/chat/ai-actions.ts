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

    // 1. Get Organization ID
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member?.organization_id) {
        return { error: 'Organização não encontrada.' }
    }

    const orgId = member.organization_id

    // 2. Check Daily Limit (40 requests / day)
    // We check logs for the current day (UTC) or last 24h. Let's use last 24h as a rolling window for simplicity, or "today" based on server time.
    // The user requirement said "40 ajudas por dia". Let's assume start of day UTC.
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
    const recentMessages = messages.slice(0, 30).reverse() // Assuming input 'messages' is sorted desc (newest first). We reverse to chronological order.

    // If input messages are empty
    if (recentMessages.length === 0) {
        return { error: 'Não há histórico suficiente para gerar uma resposta.' }
    }

    const formattedMessages = recentMessages.map(msg => ({
        role: msg.sender_type === 'user' ? 'assistant' : 'user', // 'user' in DB is the agent (us). 'contact' is the customer (user from OpenAI perspective?). 
        // Wait.
        // In CRM: 'user' = The sales agent (me/us). 'contact' = The customer.
        // OpenAI Prompting: We want the AI to act as the Sales Agent.
        // So 'contact' messages are 'user' role (inputs to AI).
        // 'user' messages (previous agent replies) are 'assistant' role (history of AI/Agent).
        // Correct mapping:
        // sender_type 'contact' -> role 'user'
        // sender_type 'user' -> role 'assistant'
        // sender_type 'system' -> role 'system' (or ignore)
        content: msg.body || (msg.media_type ? `[${msg.media_type}]` : '')
    })).filter(m => m.content)

    // Add system prompt
    const defaultPrompt = `Você é um assistente de vendas experiente e prestativo. Seu objetivo é ajudar o atendente a responder o cliente da melhor forma possível, visando fechar vendas ou resolver dúvidas com clareza e empatia.
    Analise o histórico da conversa e sugira uma resposta adequada para a última mensagem do cliente.
    Mantenha um tom profissional, porém amigável.
    Responda em português do Brasil.`

    const systemPrompt = {
        role: 'system',
        content: customPrompt || defaultPrompt
    }

    // Lazy init OpenAI to prevent top-level crashes if env is missing
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    try {
        const response = await openai.chat.completions.create({
            model: model, // Or gpt-3.5-turbo if cost is a concern, but user asked for "trained AI", 4o is better.
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

        // 4. Log Usage
        await supabase.from('ai_usage_logs').insert({
            organization_id: orgId,
            user_id: user.id
        })

        return { success: true, suggestion }

    } catch (error: any) {
        console.error('OpenAI API Error:', error)
        return { error: `Erro na API da IA: ${error.message}` }
    }
}
