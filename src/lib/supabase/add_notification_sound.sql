-- Migration: Add notification_sound column to organizations table
-- Run this in your Supabase SQL editor

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default';

-- Optional: Add a comment explaining the column
COMMENT ON COLUMN organizations.notification_sound IS 'Sound type for notifications: default, bell, chime, pop, ding, or none';
