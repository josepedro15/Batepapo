-- 12. TAGS (Organization wide standard tags)
create table if not exists public.tags (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  color text default 'violet', -- violet, red, amber, cyan, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, name)
);

-- Enable RLS
alter table public.tags enable row level security;

-- Policies
create policy "Users can view tags of their org" on public.tags for select using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = tags.organization_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can manage tags of their org" on public.tags for all using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = tags.organization_id
    and om.user_id = auth.uid()
    and om.role in ('owner', 'manager') 
  )
);

-- Allow attendants to INSERT tags (e.g. creating a new one on the fly in Chat)
create policy "Attendants can insert tags" on public.tags for insert with check (
   exists (
    select 1 from public.organization_members om
    where om.organization_id = tags.organization_id
    and om.user_id = auth.uid()
  )
);
