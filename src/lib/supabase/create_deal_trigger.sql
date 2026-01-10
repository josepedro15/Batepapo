-- Trigger Function to auto-create deal on contact insertion
create or replace function public.handle_new_contact_deal()
returns trigger
language plpgsql
security definer
as $$
declare
  v_pipeline_id uuid;
  v_stage_id uuid;
begin
  -- 1. Get default Organization Pipeline (limit 1)
  select id into v_pipeline_id
  from public.pipelines
  where organization_id = NEW.organization_id
  limit 1;

  -- If no pipeline, exit gracefully (do not block contact creation)
  if v_pipeline_id is null then
    return NEW;
  end if;

  -- 2. Get first Stage of that pipeline
  select id into v_stage_id
  from public.stages
  where pipeline_id = v_pipeline_id
  order by position asc
  limit 1;

  -- If no stage, exit gracefully
  if v_stage_id is null then
    return NEW;
  end if;

  -- 3. Insert Deal
  insert into public.deals (
    organization_id,
    pipeline_id,
    stage_id,
    contact_id,
    title,
    value,
    position
  ) values (
    NEW.organization_id,
    v_pipeline_id,
    v_stage_id,
    NEW.id,
    'Negociação - ' || NEW.name,
    0,
    0
  );

  return NEW;
exception when others then
  -- Log error but do not fail the transaction
  raise warning 'Failed to auto-create deal for contact %: %', NEW.id, SQLERRM;
  return NEW;
end;
$$;

-- Drop trigger if exists to allow safe re-run
drop trigger if exists on_contact_created_create_deal on public.contacts;

-- Create Trigger
create trigger on_contact_created_create_deal
  after insert on public.contacts
  for each row
  execute procedure public.handle_new_contact_deal();
