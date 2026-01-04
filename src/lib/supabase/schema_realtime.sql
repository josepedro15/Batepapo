-- =============================================
-- REALTIME & DEDUPLICATION MIGRATION
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add whatsapp_id column for deduplication
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT;

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_id);

-- 3. Enable Realtime for messages and contacts tables
-- This allows the chat to update automatically without F5
DO $$
BEGIN
    -- Try to add messages to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'messages already in publication';
    END;
    
    -- Try to add contacts to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'contacts already in publication';
    END;
END $$;

-- 4. Verify Realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
