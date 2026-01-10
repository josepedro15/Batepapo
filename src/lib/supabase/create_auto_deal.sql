-- Function to automatically create a deal for a new contact
-- Checks for default pipeline and first stage, then inserts the deal
create or replace function create_auto_deal_v1(
  p_organization_id uuid,
  p_contact_id uuid,
  p_contact_name text
) returns json as $$
declare
  v_pipeline_id uuid;
  v_stage_id uuid;
  v_deal_id uuid;
begin
  -- 1. Get the first/default pipeline for the organization
  select id into v_pipeline_id
  from pipelines
  where organization_id = p_organization_id
  limit 1;

  if v_pipeline_id is null then
    return json_build_object('success', false, 'error', 'No pipeline found');
  end if;

  -- 2. Get the first stage of that pipeline (lowest position)
  select id into v_stage_id
  from stages
  where pipeline_id = v_pipeline_id
  order by position asc
  limit 1;

  if v_stage_id is null then
    return json_build_object('success', false, 'error', 'No stages found in pipeline');
  end if;

  -- 3. Insert the Deal
  insert into deals (
    organization_id,
    pipeline_id,
    stage_id,
    contact_id,
    title,
    value,
    position
  ) values (
    p_organization_id,
    v_pipeline_id,
    v_stage_id,
    p_contact_id,
    'Negociação - ' || p_contact_name,
    0,
    0
  ) returning id into v_deal_id;

  return json_build_object('success', true, 'deal_id', v_deal_id);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
