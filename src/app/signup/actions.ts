'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string
    const fullName = formData.get('full_name') as string

    // Validate passwords match
    if (password !== confirmPassword) {
        redirect('/signup?error=As senhas não coincidem')
    }

    // Validate password length
    if (password.length < 6) {
        redirect('/signup?error=A senha deve ter no mínimo 6 caracteres')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        redirect('/signup?error=Email inválido')
    }

    // Validate full name
    if (!fullName || fullName.trim().length < 3) {
        redirect('/signup?error=Por favor, insira seu nome completo')
    }

    const data = {
        email,
        password,
        options: {
            data: {
                full_name: fullName.trim(),
            }
        }
    }

    const { data: signUpData, error } = await supabase.auth.signUp(data)

    if (error) {
        console.error('Signup error:', error)
        if (error.message.includes('already registered')) {
            redirect('/signup?error=Este email já está cadastrado')
        }
        redirect('/signup?error=Erro ao criar conta. Tente novamente.')
    }

    // Check if email confirmation is required
    // When email confirmation is enabled, user will exist but session will be null
    if (signUpData.user && !signUpData.session) {
        redirect('/signup?success=Conta criada! Verifique seu email para confirmar o cadastro.')
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

