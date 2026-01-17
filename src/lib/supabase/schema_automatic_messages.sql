
-- Tabela para regras de mensagens automáticas
create table if not exists public.automatic_message_rules (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  message text not null,
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  days_of_week text[] default array['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.automatic_message_rules enable row level security;

create policy "Users can view automatic message rules for their organization"
  on public.automatic_message_rules for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can insert automatic message rules for their organization"
  on public.automatic_message_rules for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update automatic message rules for their organization"
  on public.automatic_message_rules for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

create policy "Users can delete automatic message rules for their organization"
  on public.automatic_message_rules for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );
