-- 10. CONTACT NOTES
create table if not exists public.contact_notes (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. REMINDERS
create table if not exists public.layout_reminders (
  id uuid default uuid_generate_v4() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  due_at timestamp with time zone not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: 'layout_reminders' used to avoid potential reserved word conflict or ambiguity, though 'reminders' is usually fine.
-- Let's stick to 'reminders' if possible, but to be safe and specific: 'crm_reminders' or just 'reminders'. 
-- Using 'reminders' for simplicity.
alter table public.layout_reminders rename to reminders;

-- Enable RLS
alter table public.contact_notes enable row level security;
alter table public.reminders enable row level security;

-- Policies for Notes
create policy "Users can view notes of their org contacts" on public.contact_notes for select using (
  exists (
    select 1 from public.contacts c
    join public.organization_members om on c.organization_id = om.organization_id
    where c.id = contact_notes.contact_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can create notes for their org contacts" on public.contact_notes for insert with check (
  exists (
    select 1 from public.contacts c
    join public.organization_members om on c.organization_id = om.organization_id
    where c.id = contact_notes.contact_id
    and om.user_id = auth.uid()
  )
);

-- Policies for Reminders
create policy "Users can view reminders of their org contacts" on public.reminders for select using (
  exists (
    select 1 from public.contacts c
    join public.organization_members om on c.organization_id = om.organization_id
    where c.id = reminders.contact_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can create/update reminders for their org contacts" on public.reminders for all using (
  exists (
    select 1 from public.contacts c
    join public.organization_members om on c.organization_id = om.organization_id
    where c.id = reminders.contact_id
    and om.user_id = auth.uid()
  )
);
