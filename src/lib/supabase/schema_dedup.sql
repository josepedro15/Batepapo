-- Add whatsapp_id to messages table for deduplication
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS whatsapp_id TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_id);

-- Enable Realtime for messages table (Fixes WebSocket listening)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
