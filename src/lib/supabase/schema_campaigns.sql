-- 10. CAMPAIGNS (Mass Messaging Parent)
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  message_template text not null,
  status text default 'draft', -- draft, processing, completed
  total_contacts integer default 0,
  processed_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. CAMPAIGN QUEUE (The Worker Queue)
create table public.campaign_queue (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  status text default 'pending', -- pending, sent, failed
  attempt_count integer default 0,
  next_attempt_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.campaigns enable row level security;
alter table public.campaign_queue enable row level security;

create policy "Read own campaigns" on campaigns for select using (
  exists (select 1 from organization_members where organization_id = campaigns.organization_id and user_id = auth.uid())
);

create policy "Read own queue" on campaign_queue for select using (
  exists (select 1 from organization_members where organization_id = campaign_queue.organization_id and user_id = auth.uid())
);
