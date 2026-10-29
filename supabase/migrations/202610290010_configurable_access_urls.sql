-- Prepare path-style delivery URLs without switching the live domain yet.
-- This migration changes only display URLs, never Tokens, quota or sessions.
create or replace function dna_private.access_view(c dna_private.access_codes)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('token',c.access_token,
  'access_url',(select value#>>'{}' from dna_private.settings where key='access_base_url')||
    case when (select value#>>'{}' from dna_private.settings where key='access_link_style')='path'
    then 'play/' else 'play/?token=' end||c.access_token,
  'max_starts',c.max_starts,'used_starts',c.used,
  'status',case when c.disabled then 'disabled' when c.used>=c.max_starts then 'exhausted' when c.used=0 then 'unused' when c.used=1 then 'used_1' else 'used_2' end,
  'created_at',to_char(to_timestamp(c.created_at/1000.0) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'batch_id',c.batch_id)
$$;
revoke all on function dna_private.access_view(dna_private.access_codes) from public,anon,authenticated;
