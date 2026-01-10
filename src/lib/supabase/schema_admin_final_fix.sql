-- =============================================
-- FINAL FIX: ADD MISSING COLUMN & FORCE ADMIN
-- Execute este script completo no Supabase SQL Editor
-- =============================================

-- 1. ADICIONAR COLUNA (Se não existir)
-- O erro anterior aconteceu porque esta coluna não foi criada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_super_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. FORÇAR USUÁRIO COMO ADMIN
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'jopedromkt@gmail.com';

-- 3. GARANTIR QUE ELE ESTÁ NA TABELA (Caso update não tenha afetado nada)
INSERT INTO public.profiles (id, email, name, is_super_admin)
SELECT id, email, raw_user_meta_data->>'full_name', true
FROM auth.users
WHERE email = 'jopedromkt@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_super_admin = true;

-- 4. VALIDAÇÃO (Deve retornar verdadeiro agora)
SELECT email, is_super_admin FROM profiles WHERE email = 'jopedromkt@gmail.com';
