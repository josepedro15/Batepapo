-- Function to get recent messages for a list of contacts efficiently
-- avoiding the global limit issue by using window functions to limit PER CONTACT
CREATE OR REPLACE FUNCTION get_recent_messages_for_contacts(
  contact_ids uuid[],
  limit_per_contact int
)
RETURNS TABLE (
  contact_id uuid,
  id uuid,
  body text,
  sender_type text,
  media_type text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH ranked_messages AS (
    SELECT
      m.contact_id,
      m.id,
      m.body,
      m.sender_type,
      m.media_type,
      m.created_at,
      ROW_NUMBER() OVER (PARTITION BY m.contact_id ORDER BY m.created_at DESC) as rn
    FROM messages m
    WHERE m.contact_id = ANY(contact_ids)
  )
  SELECT
    contact_id,
    id,
    body,
    sender_type,
    media_type,
    created_at
  FROM ranked_messages
  WHERE rn <= limit_per_contact;
$$;
