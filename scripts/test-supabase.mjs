import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';
const root='.sites-runtime/supabase-tests';
for(const dir of ['_shared','design-dna'])fs.mkdirSync(`${root}/${dir}`,{recursive:true});fs.writeFileSync(`${root}/package.json`,'{"type":"module"}');
for(const file of ['_shared/model','_shared/scoring','design-dna/handler']){
 let source=fs.readFileSync(`supabase/functions/${file}.ts`,'utf8').replace(/\.ts(['"])/g,'.js$1');
 fs.writeFileSync(`${root}/${file}.js`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
fs.copyFileSync('lib/v2/frozen-content.json',`${root}/_shared/frozen-content.json`);
const {createHandler}=await import(pathToFileURL(path.resolve(`${root}/design-dna/handler.js`)));
const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;');await db.exec(fs.readFileSync('supabase/migrations/202610200001_design_dna.sql','utf8'));
const sha=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex');
const code='DNA-AAAAAAAAAAAAAAAA',codeHash=await sha(code);await db.query('insert into dna_private.access_codes(hash,created_at) values($1,$2)',[codeHash,Date.now()]);
const origin='https://avenchao.github.io',base='https://test.supabase.co/functions/v1/design-dna';
const handler=createHandler({origins:[origin],ipSalt:'test-only-salt',rpc:async(action,payload,ipHash)=>{const r=await db.query('select public.dna_api($1,$2::jsonb,$3) as response',[action,JSON.stringify(payload),ipHash]);return r.rows[0].response;}});
async function post(action,data,ip='test-user'){const r=await handler(new Request(`${base}/${action}`,{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':ip},body:JSON.stringify(data)}));return {status:r.status,body:await r.json()};}
const fixtures={T1:[0,0,0,0,0,0,0,0,0,0],T3:[1,1,1,0,1,0,0,0,1,0]};
const badOrigin=await handler(new Request(`${base}/verify`,{method:'OPTIONS',headers:{origin:'https://evil.example'}}));assert.equal(badOrigin.status,403);
const preflight=await handler(new Request(`${base}/verify`,{method:'OPTIONS',headers:{origin}}));assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
assert.equal((await post('verify',{code:'wrong'})).status,401);
assert.equal((await post('verify',Array(9000).fill('x'))).status,413);
const auth=[];for(let i=0;i<6;i++){const r=await post('verify',{code});assert.equal(r.status,200);assert.equal(r.body.remaining,3);auth.push(r.body.token);}
const token=auth[0];assert.equal((await post('submit',{token,answers:fixtures.T1})).status,409);
for(let i=0;i<8;i++){const r=await post('start',{token});assert.equal(r.status,200);assert.equal(r.body.remaining,2);}
const answers=[0,1,2,3,0,null,null,null,null,null];await post('progress',{token,answers,index:4,revision:2});await post('progress',{token,answers:Array(10).fill(null),index:0,revision:1});const saved=await post('status',{token});assert.deepEqual(saved.body.answers,answers);assert.equal(saved.body.index,4);
const raced=await Promise.all(auth.slice(1).map(token=>post('start',{token})));assert.equal(raced.filter(r=>r.status===200).length,2);assert.equal(raced.filter(r=>r.status===409).length,3);
assert.equal((await post('verify',{code})).status,409);const resumed=await post('verify',{code,resumeToken:token});assert.equal(resumed.status,200);assert.equal(resumed.body.token,token);assert.equal(resumed.body.remaining,0);
assert.equal((await post('submit',{token,answers:[0]})).status,400);
const submits=await Promise.all(Array.from({length:8},()=>post('submit',{token,answers:fixtures.T3,result:{primary:'T8',secondary:'T1'}})));submits.forEach(r=>{assert.equal(r.status,200);assert.equal(r.body.result.primary,'T3');assert.equal(r.body.result.id,submits[0].body.result.id);assert.equal(r.body.remaining,0);});
const id=submits[0].body.result.id;const get=await handler(new Request(`${base}/results/${id}`,{headers:{origin}}));assert.equal(get.status,200);const result=(await get.json()).result;assert.deepEqual(Object.keys(result).sort(),['id','version','primary','secondary','createdAt'].sort());assert.equal((await post('status',{token})).body.remaining,0);
assert.equal((await post('events',{resultId:id,name:'share_card_generated'})).status,200);
assert.equal((await post('events',{resultId:id,name:'password_success'})).status,400);
for(let i=0;i<61;i++){const r=await post('verify',{code:'wrong'},'rate-limit-user');assert.equal(r.status,i<60?401:429);}
const counts=await db.query("select name,count(*)::int as n from dna_private.events group by name");const events=Object.fromEntries(counts.rows.map(r=>[r.name,r.n]));assert.equal(events.test_started,3);assert.equal(events.test_completed,1);
await db.exec('set role anon');await assert.rejects(()=>db.query('select * from dna_private.access_codes'),/permission denied/);await assert.rejects(()=>db.query("select public.dna_api('result','{}',null)"),/permission denied/);await db.exec('reset role');
const schemas=await db.query("select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='dna_private' and c.relkind='r'");assert.ok(schemas.rows.every(r=>r.relrowsecurity));
fs.mkdirSync('outputs',{recursive:true});fs.writeFileSync('outputs/supabase-local-tests.json',JSON.stringify({postgresVersion:'PGlite PostgreSQL',passwordQuota:true,retryIdempotence:true,progressRevision:true,resume:true,serverScoring:true,publicResultPrivacy:true,cors:true,rateLimit:true,anonymousReadDenied:true,anonymousRpcDenied:true,rlsEnabled:true,events},null,2));await db.close();console.log('PASS: real PostgreSQL schema + Edge handler; quota, retries, progress, resume, server scoring, privacy, CORS, limits and denied anonymous DB/RPC access.');
