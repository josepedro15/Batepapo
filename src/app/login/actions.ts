'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        let errorMessage = 'Credenciais inválidas. Verifique seu email e senha.'

        // Tratamento específico para diferentes erros do Supabase
        if (error.message?.includes('Invalid login credentials') ||
            error.message?.includes('invalid_credentials')) {
            errorMessage = 'Usuário não encontrado ou senha incorreta.'
        } else if (error.message?.includes('Email not confirmed')) {
            errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.'
        } else if (error.message?.includes('Too many requests')) {
            errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        } else if (error.code === 'user_not_found' ||
            error.message?.includes('User not found')) {
            errorMessage = 'Usuário não encontrado. Verifique seu email ou crie uma conta.'
        }

        redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
