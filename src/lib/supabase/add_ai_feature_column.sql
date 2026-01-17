-- Add feature column to ai_usage_logs for granular rate limiting
ALTER TABLE public.ai_usage_logs 
ADD COLUMN IF NOT EXISTS feature text NOT NULL DEFAULT 'chat_suggestion';

-- Create index for faster querying by feature
CREATE INDEX IF NOT EXISTS ai_usage_logs_feature_idx ON public.ai_usage_logs (feature);
