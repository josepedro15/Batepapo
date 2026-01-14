-- Add show_attendant_name column to organizations table
-- This controls whether the attendant's name is prepended to outgoing messages

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS show_attendant_name boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.show_attendant_name IS 'When true, the attendant name is prepended to outgoing messages in the format: AttendantName:\n\nMessage';
