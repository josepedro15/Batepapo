-- Add unique constraint on organization_id and phone for contacts table
-- This allows upsert to work properly during import

-- First, remove any duplicates if they exist
DELETE FROM contacts a
USING contacts b
WHERE a.id > b.id
AND a.organization_id = b.organization_id
AND a.phone = b.phone;

-- Then add the unique constraint
ALTER TABLE contacts
ADD CONSTRAINT contacts_organization_phone_unique 
UNIQUE (organization_id, phone);
