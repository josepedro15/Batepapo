-- Create quick_responses table
create table if not exists public.quick_responses (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  title text not null, -- The shortcut trigger (e.g., "price")
  content text not null, -- The full message
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Enforce unique triggers per organization
  unique(organization_id, title)
);

-- Enable RLS
alter table public.quick_responses enable row level security;

-- Policies
-- 1. Members can view their org's quick responses
create policy "Members can view org quick responses"
  on public.quick_responses
  for select
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = quick_responses.organization_id
      and user_id = auth.uid()
    )
  );

-- 2. Members (Attendants/Managers/Owners) can create quick responses
-- (Assuming all roles can create for now, or restriction to manager/owner if desired)
create policy "Members can create quick responses"
  on public.quick_responses
  for insert
  with check (
    exists (
      select 1 from public.organization_members
      where organization_id = quick_responses.organization_id
      and user_id = auth.uid()
    )
  );

-- 3. Members can update their org's quick responses
create policy "Members can update quick responses"
  on public.quick_responses
  for update
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = quick_responses.organization_id
      and user_id = auth.uid()
    )
  );

-- 4. Members can delete their org's quick responses
create policy "Members can delete quick responses"
  on public.quick_responses
  for delete
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = quick_responses.organization_id
      and user_id = auth.uid()
    )
  );
