-- Purchase links are separate from private session credentials and public results.
alter table dna_private.access_codes add column if not exists access_token text unique;
alter table dna_private.access_codes add column if not exists batch_id uuid;
alter table dna_private.access_codes add column if not exists max_starts integer not null default 3 check (max_starts=3);
create index if not exists access_codes_batch_idx on dna_private.access_codes(batch_id);
create table dna_private.access_grants (
 hash text primary key check(hash ~ '^[a-f0-9]{64}$'),
 code_hash text not null references dna_private.access_codes(hash), expires_at bigint not null
);
alter table dna_private.access_grants enable row level security;
revoke all on dna_private.access_grants from public,anon,authenticated;
insert into dna_private.settings(key,value) values('access_base_url','"https://avenchao.github.io/design-dna/"') on conflict do nothing;

create function dna_private.access_view(c dna_private.access_codes)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('token',c.access_token,
  'access_url',(select value#>>'{}' from dna_private.settings where key='access_base_url')||'play/'||c.access_token,
  'max_starts',c.max_starts,'used_starts',c.used,
  'status',case when c.disabled then 'disabled' when c.used>=c.max_starts then 'exhausted' when c.used=0 then 'unused' when c.used=1 then 'used_1' else 'used_2' end,
  'created_at',to_char(to_timestamp(c.created_at/1000.0) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'batch_id',c.batch_id)
$$;
alter function public.dna_api(text,jsonb,text) rename to dna_api_legacy;
revoke all on function public.dna_api_legacy(text,jsonb,text) from public,anon,authenticated,service_role;
create function public.dna_api(p_action text,p_payload jsonb,p_ip_hash text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_now bigint:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 v_hour bigint:=floor(extract(epoch from clock_timestamp())/3600)::bigint;
 c dna_private.access_codes; s dna_private.sessions; g dna_private.access_grants;
 v_hash text:=p_payload->>'tokenHash'; v_code_hash text:=p_payload->>'codeHash';
 v_attempts integer; v_reply jsonb; v_items jsonb; v_summary jsonb; v_count integer; v_total bigint;
 v_page integer; v_status text; v_filter text; v_batch text; v_row jsonb;
begin
 if p_action like 'admin_%' then
  if p_action='admin_generate' then
   if jsonb_typeof(p_payload->'items')<>'array' or jsonb_array_length(p_payload->'items') not in (100,500,1000) then return dna_private.fail(400,'批量数量必须为100、500或1000。'); end if;
   perform pg_advisory_xact_lock(hashtextextended(p_payload->>'batchId',0));
   select count(*)::integer into v_count from dna_private.access_codes where batch_id=(p_payload->>'batchId')::uuid;
   if v_count>0 then return dna_private.reply(200,jsonb_build_object('count',v_count,'batchId',p_payload->>'batchId')); end if;
   -- The entire batch commits atomically, including collision checks.
   for v_row in select value from jsonb_array_elements(p_payload->'items') loop
    if coalesce(v_row->>'token','')!~'^[A-HJ-NP-Z2-9]{26}$' or coalesce(v_row->>'hash','')!~'^[a-f0-9]{64}$' then return dna_private.fail(400,'Token格式无效。'); end if;
   end loop;
   insert into dna_private.access_codes(hash,access_token,batch_id,created_at)
    select value->>'hash',value->>'token',(p_payload->>'batchId')::uuid,v_now from jsonb_array_elements(p_payload->'items');
   return dna_private.reply(200,jsonb_build_object('count',jsonb_array_length(p_payload->'items'),'batchId',p_payload->>'batchId'));
  end if;
  if p_action='admin_set_status' then
   update dna_private.access_codes set disabled=(p_payload->>'disabled')::boolean where access_token=p_payload->>'accessToken' returning * into c;
   if not found then return dna_private.fail(404,'找不到这个Token。'); end if;
   return dna_private.reply(200,jsonb_build_object('item',dna_private.access_view(c)));
  end if;
  if p_action='admin_list' or p_action='admin_export' then
   v_filter:=coalesce(p_payload->>'search',''); v_status:=coalesce(p_payload->>'status','all'); v_batch:=coalesce(p_payload->>'batchId','');
   v_page:=greatest(0,coalesce((p_payload->>'page')::integer,0));
   select count(*) into v_total from dna_private.access_codes a where a.access_token is not null
    and (v_filter='' or position(v_filter in a.access_token)>0) and (v_batch='' or a.batch_id::text=v_batch)
    and (v_status='all' or case when a.disabled then 'disabled' when a.used>=a.max_starts then 'exhausted' when a.used=0 then 'unused' when a.used=1 then 'used_1' else 'used_2' end=v_status);
   if p_action='admin_export' and v_total>10000 then return dna_private.fail(400,'一次最多导出10000条，请按批次或状态筛选后导出。'); end if;
   select coalesce(jsonb_agg(dna_private.access_view(rows)), '[]'::jsonb) into v_items from (
    select a.* from dna_private.access_codes a where a.access_token is not null
     and (v_filter='' or position(v_filter in a.access_token)>0) and (v_batch='' or a.batch_id::text=v_batch)
     and (v_status='all' or case when a.disabled then 'disabled' when a.used>=a.max_starts then 'exhausted' when a.used=0 then 'unused' when a.used=1 then 'used_1' else 'used_2' end=v_status)
    order by a.created_at desc,a.access_token limit case when p_action='admin_export' then 10000 else 50 end offset case when p_action='admin_export' then 0 else v_page*50 end
   ) rows;
   select jsonb_build_object('unused',count(*) filter(where not disabled and used=0),'used_1',count(*) filter(where not disabled and used=1),
    'used_2',count(*) filter(where not disabled and used=2),'exhausted',count(*) filter(where not disabled and used>=max_starts),'disabled',count(*) filter(where disabled))
    into v_summary from dna_private.access_codes where access_token is not null;
   return dna_private.reply(200,jsonb_build_object('items',v_items,'total',v_total,'summary',v_summary,'page',v_page,'baseUrl',(select value#>>'{}' from dna_private.settings where key='access_base_url')));
  end if;
  return dna_private.fail(404,'找不到此管理接口。');
 end if;
 if exists(select 1 from dna_private.settings where key='writes_enabled' and value='false'::jsonb) and p_action in ('access','start') then return dna_private.fail(503,'服务维护中，请稍后重试。'); end if;
 if p_action='access' then
  insert into dna_private.rate_limits(key,attempts,bucket) values('link:'||coalesce(p_ip_hash,'unknown')||':'||v_hour,1,v_hour)
   on conflict(key) do update set attempts=dna_private.rate_limits.attempts+1 returning attempts into v_attempts;
  if v_attempts>120 then return dna_private.fail(429,'访问次数较多，请稍后再试。'); end if;
  delete from dna_private.rate_limits where bucket<v_hour-48;
  select * into c from dna_private.access_codes where hash=v_code_hash and access_token is not null;
  if not found or c.disabled then return dna_private.fail(401,'这个测试入口无效或已停用。'); end if;
  if p_payload->>'resumeHash' is not null then
   select * into s from dna_private.sessions where hash=p_payload->>'resumeHash' and code_hash=c.hash and result_id is null and expires_at>v_now and model_version='design-dna-2.0';
   if found then return dna_private.reply(200,dna_private.session_view(s,c.used)||jsonb_build_object('resumed',true)); end if;
  end if;
  -- Landing creates only a short-lived authorization grant, never a test session.
  insert into dna_private.access_grants(hash,code_hash,expires_at) values(v_hash,c.hash,v_now+86400000);
  delete from dna_private.access_grants where expires_at<v_now;
  return dna_private.reply(200,jsonb_build_object('started',false,'remaining',greatest(0,c.max_starts-c.used),'expiresAt',v_now+86400000,
   'answers','[null,null,null,null,null,null,null,null,null,null]'::jsonb,'index',0,'revision',0));
 end if;
 if p_action in ('start','status') then
  select * into g from dna_private.access_grants where hash=v_hash;
  if found then
   -- Always lock purchase quota before its grant/session, serializing tabs/devices.
   select * into c from dna_private.access_codes where hash=g.code_hash for update;
   select * into s from dna_private.sessions where hash=v_hash;
   if not found then
    if c.disabled or g.expires_at<v_now then return dna_private.fail(401,'这个测试入口已停用或授权已过期，请重新打开原始入口链接。'); end if;
    if p_action='status' then return dna_private.reply(200,jsonb_build_object('started',false,'remaining',greatest(0,c.max_starts-c.used),'expiresAt',g.expires_at,
     'answers','[null,null,null,null,null,null,null,null,null,null]'::jsonb,'index',0,'revision',0)); end if;
    if c.used>=c.max_starts then return dna_private.fail(409,'这个测试入口的体验次数已经用完。'); end if;
    insert into dna_private.sessions(hash,code_hash,expires_at,model_version,started_at,start_nonce,answers_json)
     values(v_hash,c.hash,253402300799000,'design-dna-2.0',v_now,gen_random_uuid()::text,'[null,null,null,null,null,null,null,null,null,null]') returning * into s;
    update dna_private.access_codes set used=used+1 where hash=c.hash returning * into c;
    insert into dna_private.events(id,session_hash,name,created_at) values(gen_random_uuid()::text,s.hash,'test_started',v_now);
    return dna_private.reply(200,dna_private.session_view(s,c.used));
   end if;
  end if;
 end if;
 -- Existing password sessions/results survive the migration. No password UI remains.
 v_reply:=public.dna_api_legacy(p_action,p_payload,p_ip_hash);
 if (v_reply->>'status')::integer=409 and p_action='start' then return dna_private.fail(409,'这个测试入口的体验次数已经用完。'); end if;
 return v_reply;
end;
$$;
revoke all on all functions in schema dna_private from public,anon,authenticated;
revoke all on function public.dna_api(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.dna_api(text,jsonb,text) to service_role;
