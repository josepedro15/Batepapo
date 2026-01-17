-- Add Company Info columns to organizations table

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS address text;

-- Add comments for clarity
COMMENT ON COLUMN public.organizations.website IS 'Company website URL';
COMMENT ON COLUMN public.organizations.description IS 'Business description/context for AI agents';
COMMENT ON COLUMN public.organizations.instagram IS 'Instagram profile URL or handle';
COMMENT ON COLUMN public.organizations.facebook IS 'Facebook page URL';
COMMENT ON COLUMN public.organizations.linkedin IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.organizations.address IS 'Physical address of the business';
