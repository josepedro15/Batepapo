-- 1. VERIFICAR SE VOCÊ É ADMIN
-- Selecione e rode esta linha para ver o status atual
SELECT id, email, name, is_super_admin 
FROM profiles 
WHERE email = 'jopedromkt@gmail.com';

-- 2. CORRIGIR (FORÇAR ADMIN)
-- Se o de cima der 'false' ou 'null', rode este aqui:
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'jopedromkt@gmail.com';

-- 3. VERIFICAR SE O PERFIL EXISTE
-- Se o passo 1 não retornou NADA, rode este para ver se seu usuário está na tabela profiles
SELECT * FROM auth.users WHERE email = 'jopedromkt@gmail.com';
-- (Se existir em auth.users mas não em profiles, há um problema de sincronia)

-- 4. INSERIR PERFIL NA MARRA (CASO NÃO EXISTA)
-- Só rode se o passo 1 não retornou nada
INSERT INTO public.profiles (id, email, name, is_super_admin)
SELECT id, email, raw_user_meta_data->>'full_name', true
FROM auth.users
WHERE email = 'jopedromkt@gmail.com'
ON CONFLICT (id) DO UPDATE
SET is_super_admin = true;
