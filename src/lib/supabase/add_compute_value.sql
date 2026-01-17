-- 1. Add compute_value column to stages
alter table public.stages 
add column if not exists compute_value boolean default false;

-- 2. Function to get stage stats (count and sum of values)
-- This avoids fetching all deals just to count/sum them
create or replace function get_kanban_stats(pipeline_uuid uuid)
returns table (
  stage_id uuid,
  total_count bigint,
  total_value numeric,
  compute_value boolean
) as $$
begin
  return query
  select 
    s.id as stage_id,
    count(d.id) as total_count,
    coalesce(sum(d.value), 0) as total_value,
    s.compute_value
  from stages s
  left join deals d on d.stage_id = s.id
  where s.pipeline_id = pipeline_uuid
  group by s.id;
end;
$$ language plpgsql;
