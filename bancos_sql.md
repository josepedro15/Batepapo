-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  key_hash text NOT NULL,
  label text NOT NULL,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.campaign_queue (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  status text DEFAULT 'pending'::text,
  attempt_count integer DEFAULT 0,
  next_attempt_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT campaign_queue_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_queue_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_queue_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT campaign_queue_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  message_template text NOT NULL,
  status text DEFAULT 'draft'::text,
  total_contacts integer DEFAULT 0,
  processed_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.contact_notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contact_id uuid NOT NULL,
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT contact_notes_pkey PRIMARY KEY (id),
  CONSTRAINT contact_notes_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT contact_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  tags ARRAY,
  status text DEFAULT 'open'::text,
  owner_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  avatar_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT contacts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL,
  stripe_customer_id text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.deals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  pipeline_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  title text NOT NULL,
  value numeric DEFAULT 0,
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT deals_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id),
  CONSTRAINT deals_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(id),
  CONSTRAINT deals_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['user'::text, 'contact'::text, 'system'::text])),
  sender_id uuid,
  body text,
  media_url text,
  media_type text,
  status text DEFAULT 'sent'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  whatsapp_id text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT messages_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'attendant'::text])),
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  owner_id uuid,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pipelines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pipelines_pkey PRIMARY KEY (id),
  CONSTRAINT pipelines_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.plan_limits (
  price_id text NOT NULL,
  max_users integer NOT NULL DEFAULT 1,
  max_contacts integer NOT NULL DEFAULT 100,
  max_pipelines integer NOT NULL DEFAULT 1,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT plan_limits_pkey PRIMARY KEY (price_id),
  CONSTRAINT plan_limits_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.prices(id)
);
CREATE TABLE public.prices (
  id text NOT NULL,
  product_id text,
  active boolean DEFAULT true,
  currency text DEFAULT 'brl'::text,
  unit_amount integer NOT NULL,
  type text DEFAULT 'recurring'::text,
  interval text,
  interval_count integer DEFAULT 1,
  trial_period_days integer DEFAULT 7,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prices_pkey PRIMARY KEY (id),
  CONSTRAINT prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id text NOT NULL,
  active boolean DEFAULT true,
  name text NOT NULL,
  description text,
  image text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_super_admin boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contact_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL,
  due_at timestamp with time zone NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT layout_reminders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id),
  CONSTRAINT layout_reminders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.stages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pipeline_id uuid NOT NULL,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  color text,
  CONSTRAINT stages_pkey PRIMARY KEY (id),
  CONSTRAINT stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id)
);
CREATE TABLE public.subscriptions (
  id text NOT NULL,
  user_id uuid NOT NULL,
  organization_id uuid,
  price_id text,
  status text NOT NULL,
  quantity integer DEFAULT 1,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at timestamp with time zone,
  canceled_at timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT subscriptions_price_id_fkey FOREIGN KEY (price_id) REFERENCES public.prices(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'violet'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tags_pkey PRIMARY KEY (id),
  CONSTRAINT tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.whatsapp_instances (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid UNIQUE,
  instance_name text NOT NULL,
  instance_token text NOT NULL,
  status text DEFAULT 'disconnected'::text CHECK (status = ANY (ARRAY['disconnected'::text, 'connecting'::text, 'connected'::text])),
  phone_number text,
  webhook_configured boolean DEFAULT false,
  last_connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_instances_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_instances_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);