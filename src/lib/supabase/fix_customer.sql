DO $$
DECLARE
  v_stripe_customer_id text := 'cus_To0pSBfMsLgrSi'; 
  
  v_email text := 'josepedro123nato88@gmail.com';
  v_user_id uuid;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com esse email';
  END IF;

  -- Inserir ou Atualizar Cliente
  INSERT INTO customers (id, stripe_customer_id)
  VALUES (v_user_id, v_stripe_customer_id)
  ON CONFLICT (id) DO UPDATE 
  SET stripe_customer_id = v_stripe_customer_id;
  
  RAISE NOTICE 'Cliente vinculado com sucesso!';
END $$;
