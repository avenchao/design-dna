-- All data is private. Only the Edge Function's service role may call dna_api.
create schema if not exists dna_private;
revoke all on schema dna_private from public, anon, authenticated;
create table if not exists dna_private.settings (key text primary key,value jsonb not null);
insert into dna_private.settings(key,value) values('writes_enabled','true') on conflict do nothing;
create table if not exists dna_private.access_codes (
 hash text primary key check (hash ~ '^[a-f0-9]{64}$'),
 used integer not null default 0 check (used between 0 and 3),
 disabled boolean not null default false, created_at bigint not null
);
create table if not exists dna_private.sessions (
 hash text primary key check (hash ~ '^[a-f0-9]{64}$'),
 code_hash text not null references dna_private.access_codes(hash),
 expires_at bigint not null, result_id text,
 model_version text not null default 'design-dna-2.0', started_at bigint,
 start_nonce text, answers_json jsonb not null default '[]',
 question_index integer not null default 0, progress_revision bigint not null default 0
);
create index if not exists sessions_code_hash_idx on dna_private.sessions(code_hash);
create table if not exists dna_private.results (
 id text primary key, data jsonb not null, created_at bigint not null
);
create table if not exists dna_private.events (
 id text primary key, session_hash text, result_id text, name text not null,
 question integer, answer integer, main_type text, hidden_type text, created_at bigint not null
);
create index if not exists events_name_time_idx on dna_private.events(name,created_at);
create table if not exists dna_private.rate_limits (
 key text primary key, attempts integer not null default 0, bucket bigint not null
);
alter table dna_private.settings enable row level security;
alter table dna_private.access_codes enable row level security;
alter table dna_private.sessions enable row level security;
alter table dna_private.results enable row level security;
alter table dna_private.events enable row level security;
alter table dna_private.rate_limits enable row level security;
revoke all on all tables in schema dna_private from public, anon, authenticated;

create or replace function dna_private.reply(p_status integer,p_body jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('status',p_status,'body',p_body)
$$;
create or replace function dna_private.fail(p_status integer,p_error text)
returns jsonb language sql immutable set search_path='' as $$
 select dna_private.reply(p_status,jsonb_build_object('error',p_error))
$$;
create or replace function dna_private.session_view(s dna_private.sessions,p_used integer)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('started',s.started_at is not null,'remaining',greatest(0,3-p_used),
  'expiresAt',s.expires_at,'answers',s.answers_json,'index',s.question_index,'revision',s.progress_revision)
$$;
create or replace function public.dna_api(p_action text,p_payload jsonb,p_ip_hash text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_now bigint := floor(extract(epoch from clock_timestamp())*1000)::bigint;
 v_hour bigint := floor(extract(epoch from clock_timestamp())/3600)::bigint;
 c dna_private.access_codes; s dna_private.sessions;
 v_data jsonb; v_view jsonb; v_attempts integer; v_result_id text; v_name text;
 v_hash text := p_payload->>'tokenHash'; v_code_hash text := p_payload->>'codeHash';
begin
 if p_action='result' then
  select data into v_data from dna_private.results where id=p_payload->>'id';
  if not found then return dna_private.fail(404,'结果链接不存在，请确认链接完整。'); end if;
  return dna_private.reply(200,jsonb_build_object('result',v_data));
 end if;
 if p_action<>'events' and exists(select 1 from dna_private.settings where key='writes_enabled' and value='false'::jsonb) then return dna_private.fail(503,'数据迁移中，请稍后重试。进度已保留。'); end if;
 if p_action='verify' then
  insert into dna_private.rate_limits(key,attempts,bucket) values (coalesce(p_ip_hash,'unknown')||':'||v_hour,1,v_hour)
   on conflict(key) do update set attempts=dna_private.rate_limits.attempts+1 returning attempts into v_attempts;
  if v_attempts>60 then return dna_private.fail(429,'尝试次数较多，请稍后再试。'); end if;
  -- Old hourly buckets are irrelevant; keep anonymous rate-limit data bounded.
  delete from dna_private.rate_limits where bucket<v_hour-48;
  select * into c from dna_private.access_codes where hash=v_code_hash;
  if not found or c.disabled then return dna_private.fail(401,'密码不正确或已停用。'); end if;
  if p_payload->>'resumeHash' is not null then
   select * into s from dna_private.sessions where hash=p_payload->>'resumeHash' and code_hash=c.hash
    and model_version='design-dna-2.0' and expires_at>v_now and result_id is null;
   if found then return dna_private.reply(200,dna_private.session_view(s,c.used)||jsonb_build_object('resumed',true)); end if;
  end if;
  if c.used>=3 then return dna_private.fail(409,'这个密码已开始过3次测试，次数已用完。请使用新密码；同一场未完成测试可在原设备继续。'); end if;
  if coalesce(v_hash,'')!~'^[a-f0-9]{64}$' then return dna_private.fail(400,'授权请求无效。'); end if;
  insert into dna_private.sessions(hash,code_hash,expires_at,model_version,answers_json)
   values(v_hash,c.hash,v_now+86400000,'design-dna-2.0','[null,null,null,null,null,null,null,null,null,null]') returning * into s;
  insert into dna_private.events(id,session_hash,name,created_at) values(gen_random_uuid()::text,s.hash,'password_success',v_now);
  return dna_private.reply(200,dna_private.session_view(s,c.used));
 end if;
 if p_action='events' and p_payload->>'resultId' is not null and v_hash is null then
  v_result_id:=p_payload->>'resultId';
  if not exists(select 1 from dna_private.results where id=v_result_id) then return dna_private.fail(404,'结果不存在。'); end if;
 else
  select * into s from dna_private.sessions where hash=v_hash;
  if not found then return dna_private.fail(401,'请先验证测评密码。'); end if;
  -- Lock the code before its session during starts. All retries observe the
  -- committed start marker and multiple sessions serialize on the same quota.
  if p_action='start' then
   select * into c from dna_private.access_codes where hash=s.code_hash for update;
   select * into s from dna_private.sessions where hash=v_hash for update;
  else
   select * into s from dna_private.sessions where hash=v_hash for update;
   select * into c from dna_private.access_codes where hash=s.code_hash;
  end if;
  if c.disabled or s.expires_at<v_now then return dna_private.fail(401,'本次授权已过期，请重新验证密码。'); end if;
  v_view:=dna_private.session_view(s,c.used);
  if s.result_id is not null and p_action<>'events' then
   select data into v_data from dna_private.results where id=s.result_id;
   return dna_private.reply(200,v_view||jsonb_build_object('result',v_data));
  end if;
  if s.model_version<>'design-dna-2.0' then return dna_private.fail(409,'题库已升级，请重新验证密码进入新版。'); end if;
 end if;
 if p_action='status' then return dna_private.reply(200,v_view); end if;
 if p_action='start' then
  if s.started_at is not null then return dna_private.reply(200,v_view); end if;
  if c.used>=3 then return dna_private.fail(409,'这个密码的3次测试机会已用完。'); end if;
  update dna_private.access_codes set used=used+1 where hash=c.hash returning * into c;
  update dna_private.sessions set started_at=v_now,start_nonce=gen_random_uuid()::text,expires_at=v_now+604800000 where hash=s.hash returning * into s;
  insert into dna_private.events(id,session_hash,name,created_at) values(gen_random_uuid()::text,s.hash,'test_started',v_now);
  return dna_private.reply(200,dna_private.session_view(s,c.used));
 end if;
 if p_action='events' then
  v_name:=p_payload->>'name';
  if not (v_name=any(array['question_answered','question_back','share_card_generated','image_saved','share_link_created','retest_clicked'])) then return dna_private.fail(400,'事件无效。'); end if;
  insert into dna_private.events(id,session_hash,result_id,name,question,answer,created_at)
   values(gen_random_uuid()::text,s.hash,coalesce(v_result_id,s.result_id),v_name,(p_payload->>'question')::integer,(p_payload->>'answer')::integer,v_now);
  return dna_private.reply(200,'{"ok":true}');
 end if;
 if s.started_at is null then return dna_private.fail(409,'请先点击开始测试。'); end if;
 if p_action='progress' then
  if jsonb_typeof(p_payload->'answers')<>'array' or jsonb_array_length(p_payload->'answers')<>10
   or exists(select 1 from jsonb_array_elements(p_payload->'answers') a where a not in ('null'::jsonb,'0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb))
   or (p_payload->>'index')::integer not between 0 and 9 or (p_payload->>'revision')::bigint<0 then return dna_private.fail(400,'答题进度无效。'); end if;
  update dna_private.sessions set answers_json=p_payload->'answers',question_index=(p_payload->>'index')::integer,progress_revision=(p_payload->>'revision')::bigint
   where hash=s.hash and progress_revision<(p_payload->>'revision')::bigint;
  return dna_private.reply(200,'{"ok":true}');
 end if;
 if p_action='submit' then
  if jsonb_typeof(p_payload->'answers')<>'array' or jsonb_array_length(p_payload->'answers')<>10
   or exists(select 1 from jsonb_array_elements(p_payload->'answers') a where a not in ('0'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb)) then return dna_private.fail(400,'请完成全部10道题。'); end if;
  v_data:=p_payload->'result';
  if v_data->>'version'<>'design-dna-2.0' or coalesce(v_data->>'primary','')!~'^T[1-8]$' or coalesce(v_data->>'secondary','')!~'^T[1-8]$' or v_data->>'primary'=v_data->>'secondary' then return dna_private.fail(400,'结果无效。'); end if;
  v_result_id:=v_data->>'id';
  insert into dna_private.results(id,data,created_at) values(v_result_id,v_data,v_now);
  update dna_private.sessions set result_id=v_result_id,answers_json=p_payload->'answers',question_index=9 where hash=s.hash;
  insert into dna_private.events(id,session_hash,result_id,name,main_type,hidden_type,created_at)
   select gen_random_uuid()::text,s.hash,v_result_id,event_name,v_data->>'primary',v_data->>'secondary',v_now
   from unnest(array['test_completed','result_main_type','result_hidden_type']) event_name;
  return dna_private.reply(200,jsonb_build_object('result',v_data,'remaining',greatest(0,3-c.used)));
 end if;
 return dna_private.fail(404,'找不到此接口。');
end;
$$;
revoke all on all functions in schema dna_private from public, anon, authenticated;
revoke all on function public.dna_api(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.dna_api(text,jsonb,text) to service_role;
