-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (User Identity)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ORGANIZATIONS (Multi-tenant Root)
create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  owner_id uuid references public.profiles(id)
);

-- 3. ORGANIZATION MEMBERS (The Link / Junction Table)
create table public.organization_members (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'manager', 'attendant')) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(organization_id, user_id)
);

-- 4. CONTACTS (CRM Base)
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  tags text[], -- Array of strings for simple tagging
  status text default 'open', -- open, closed, archived
  owner_id uuid references public.profiles(id), -- If NULL, it is "Awaiting"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MESSAGES (Chat History)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  sender_type text check (sender_type in ('user', 'contact', 'system')) not null,
  sender_id uuid, -- ID of the user if sender_type is user
  body text,
  media_url text,
  media_type text, -- image, audio, document
  status text default 'sent', -- sent, delivered, read
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PIPELINES & STAGES (Kanban Config)
create table public.pipelines (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.stages (
  id uuid default uuid_generate_v4() primary key,
  pipeline_id uuid references public.pipelines(id) on delete cascade not null,
  name text not null,
  position integer not null default 0,
  color text
);

-- 7. DEALS (Kanban Cards)
create table public.deals (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  pipeline_id uuid references public.pipelines(id) on delete cascade not null,
  stage_id uuid references public.stages(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  title text not null,
  value numeric(10, 2) default 0,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. API KEYS (Integration)
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  key_hash text not null, -- Store only the HASH of the key
  label text not null,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. TRIGGERS & FUNCTIONS

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY (RLS) - Basic Setup
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.messages enable row level security;
alter table public.deals enable row level security;

-- POLICIES (Dev Mode - Updated)
-- Allow users to read their own profile
create policy "Read own profile" on profiles for select using (auth.uid() = id);

-- Allow users to read organizations they are members of
create policy "Read own orgs" on organizations for select using (
  exists (
    select 1 from organization_members
    where organization_id = organizations.id
    and user_id = auth.uid()
  )
);
