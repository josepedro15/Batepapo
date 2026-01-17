'use server'

import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAutomaticMessageRules(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('automatic_message_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createAutomaticMessageRule(data: {
    organization_id: string
    name: string
    message: string
    start_time: string
    end_time: string
    is_active: boolean
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .insert(data)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function updateAutomaticMessageRule(id: string, data: {
    name?: string
    message?: string
    start_time?: string
    end_time?: string
    is_active?: boolean
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .update(data)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function deleteAutomaticMessageRule(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function toggleAutomaticMessageRule(id: string, is_active: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .update({ is_active })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function generateAIResponse(params: {
    startTime: string,
    endTime: string,
    tips: string
}) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API Key not configured')
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const systemPrompt = `Você é um assistente especializado em criar mensagens automáticas para WhatsApp.
        
Contexto da Regra (Horário): ${params.startTime} às ${params.endTime}
Instruções/Dicas do Usuário: ${params.tips}

Diretrizes:
- Crie uma mensagem curta e cordial.
- Se a loja estiver fechada ou em pausa, sugira verificar as redes sociais.
- Se for horário comercial, convide para o atendimento.
- Use emojis apropriados.
- Retorne apenas o texto da mensagem.`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Gere a mensagem.' } // Trigger generic user message to start generation
            ],
            temperature: 0.7,
            max_tokens: 300,
        })

        return response.choices[0].message.content
    } catch (error) {
        console.error('Error generating AI response:', error)
        throw new Error('Falha ao gerar mensagem com IA')
    }
}
