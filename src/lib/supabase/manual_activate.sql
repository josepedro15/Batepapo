DO $$
DECLARE
  v_sub_id text := 'sub_1SqXy2E3jySaqEXC9RkZWH00'; 
  v_email text := 'josepedro123nato88@gmail.com';
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Buscar ID do usuário e organização
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  SELECT organization_id INTO v_org_id FROM organization_members WHERE user_id = v_user_id LIMIT 1;

  -- Inserir assinatura manualmente
  INSERT INTO subscriptions (id, user_id, organization_id, status, price_id, quantity, current_period_start, current_period_end)
  VALUES (
    v_sub_id, 
    v_user_id, 
    v_org_id, 
    'active', 
    'price_1SqOMzE3jySaqEXCqllhxGsz', 
    1,
    now(),
    now() + interval '1 month'
  )
  ON CONFLICT (id) DO UPDATE SET status = 'active';
END $$;
