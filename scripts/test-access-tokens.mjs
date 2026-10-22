import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';
const root='.sites-runtime/token-tests';for(const dir of ['_shared','design-dna'])fs.mkdirSync(`${root}/${dir}`,{recursive:true});fs.writeFileSync(`${root}/package.json`,'{"type":"module"}');
for(const file of ['_shared/model','_shared/scoring','design-dna/handler','design-dna/access']){
 const source=fs.readFileSync(`supabase/functions/${file}.ts`,'utf8').replace(/\.ts(['"])/g,'.js$1');
 fs.writeFileSync(`${root}/${file}.js`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
fs.copyFileSync('lib/v2/frozen-content.json',`${root}/_shared/frozen-content.json`);
const {createHandler}=await import(pathToFileURL(path.resolve(`${root}/design-dna/handler.js`)));
const db=new PGlite();await db.exec('create role anon;create role authenticated;create role service_role;');
for(const file of ['202610200001_design_dna.sql','202610220008_access_links.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
const sha=value=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)).then(b=>Buffer.from(b).toString('hex'));
const adminKey='SYNTHETIC-ADMIN-KEY-ONLY-FOR-TESTING';const origin='https://avenchao.github.io',base='https://test.supabase.co/functions/v1/design-dna';
const handler=createHandler({origins:[origin],ipSalt:'test-salt',adminKeyHash:await sha(adminKey),rpc:async(action,payload,ip)=>{
 const response=await db.query('select public.dna_api($1,$2::jsonb,$3) as reply',[action,JSON.stringify(payload),ip]);return response.rows[0].reply;
}});
const req=(action,body,key='')=>handler(new Request(`${base}/${action}`,{method:'POST',headers:{origin,'content-type':'application/json',...(key?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify(body)}));
async function post(action,body,key=''){const response=await req(action,body,key);return {status:response.status,body:await response.json()};}
const admin=(action,body={})=>post('admin/'+action,body,adminKey);
async function total(table){return (await db.query(`select count(*)::int n from dna_private.${table}`)).rows[0].n;}
try{
 assert.equal((await post('admin/list',{})).status,401);assert.equal((await post('admin/list',{},'wrong')).status,401);
 assert.equal((await admin('generate',{count:1,batchId:crypto.randomUUID()})).status,400);
 const batches=[];for(const count of [100,500,1000]){const batchId=crypto.randomUUID();const response=await admin('generate',{count,batchId});assert.equal(response.status,200);assert.equal(response.body.count,count);batches.push(batchId);}
 assert.equal(await total('access_codes'),1600);
 await admin('generate',{count:100,batchId:batches[0]});assert.equal(await total('access_codes'),1600,'batch retry does not duplicate inventory');
 const listing=await admin('list',{batchId:batches[0]});assert.equal(listing.body.total,100);assert.equal(listing.body.items.length,50);
 const tokens=(await db.query('select access_token from dna_private.access_codes')).rows.map(r=>r.access_token);assert.equal(new Set(tokens).size,1600);assert.ok(tokens.every(t=>/^[A-HJ-NP-Z2-9]{26}$/.test(t)));
 const entry=tokens[0],entry2=tokens[1],entry3=tokens[2];const grants=[];
 assert.equal((await post('access',{accessToken:'INVALID'})).status,401);
 for(let i=0;i<9;i++){const response=await post('access',{accessToken:entry});assert.equal(response.status,200);assert.equal(response.body.remaining,3);grants.push(response.body.token);}
 assert.equal(await total('sessions'),0,'landing never creates a test session');
 const token=grants[0];assert.equal((await post('status',{token})).body.remaining,3);
 const sameStart=await Promise.all(Array.from({length:8},()=>post('start',{token})));assert.ok(sameStart.every(r=>r.status===200&&r.body.remaining===2));assert.equal(await total('sessions'),1);
 const answers=[0,1,2,null,null,null,null,null,null,null];await post('progress',{token,answers,index:3,revision:2});await post('progress',{token,answers:Array(10).fill(null),index:0,revision:1});
 const resume=await post('access',{accessToken:entry,resumeToken:token});assert.equal(resume.body.token,token);assert.deepEqual(resume.body.answers,answers);
 const race=await Promise.all(grants.slice(1).map(token=>post('start',{token})));assert.equal(race.filter(r=>r.status===200).length,2);assert.equal(race.filter(r=>r.status===409).length,6);assert.ok(race.filter(r=>r.status===409).every(r=>r.body.error==='这个测试入口的体验次数已经用完。'));
 assert.equal(await total('sessions'),3);const after=await post('access',{accessToken:entry});assert.equal(after.status,200);assert.equal(after.body.remaining,0);assert.equal((await post('start',{token:after.body.token})).body.error,'这个测试入口的体验次数已经用完。');
 const fullResume=await post('access',{accessToken:entry,resumeToken:token});assert.equal(fullResume.body.token,token);assert.equal(fullResume.body.remaining,0);
 const other=await post('access',{accessToken:entry2,resumeToken:token});assert.notEqual(other.body.token,token);assert.deepEqual(other.body.answers,Array(10).fill(null));await post('start',{token:other.body.token});
 const third=await post('access',{accessToken:entry3});await post('start',{token:third.body.token});const third2=await post('access',{accessToken:entry3});await post('start',{token:third2.body.token});
 for(const [status,expected] of [['unused',1597],['used_1',1],['used_2',1],['exhausted',1]])assert.equal((await admin('list',{status})).body.total,expected);
 const disabled=await admin('set-status',{accessToken:entry2,disabled:true});assert.equal(disabled.body.item.status,'disabled');assert.equal((await post('access',{accessToken:entry2,resumeToken:other.body.token})).status,401);assert.equal((await post('start',{token:other.body.token})).status,401);
 assert.equal((await admin('list',{status:'disabled'})).body.total,1);await admin('set-status',{accessToken:entry2,disabled:false});const restored=await post('access',{accessToken:entry2,resumeToken:other.body.token});assert.equal(restored.body.token,other.body.token);assert.equal(restored.body.remaining,2);
 const submitted=await post('submit',{token,answers:[1,1,1,0,1,0,0,0,1,0]});assert.equal(submitted.status,200);const resultId=submitted.body.result.id;
 const shared=await handler(new Request(`${base}/results/${resultId}`,{headers:{origin}}));const result=(await shared.json()).result;assert.deepEqual(Object.keys(result).sort(),['id','version','primary','secondary','createdAt'].sort());assert.ok(!JSON.stringify(result).includes(entry));assert.equal((await post('access',{accessToken:resultId})).status,401);assert.equal((await post('start',{token:resultId})).status,401);
 assert.equal((await post('status',{token})).body.remaining,0);
 const csvResponse=await req('admin/export',{batchId:batches[0]},adminKey);assert.equal(csvResponse.status,200);assert.match(csvResponse.headers.get('content-type'),/text\/csv/);const csvBuffer=Buffer.from(await csvResponse.arrayBuffer());assert.equal(csvBuffer.subarray(0,3).toString('hex'),'efbbbf');const csv=csvBuffer.toString('utf8');assert.equal(csv.trim().split('\r\n').length,101);assert.ok(csv.includes('token,access_url,max_starts,used_starts,status,created_at'));assert.ok(csv.includes('https://avenchao.github.io/design-dna/play/'));assert.ok(!csv.includes(adminKey));
 assert.equal((await admin('list',{search:entry.slice(0,20)})).body.total,1);
 await db.exec('set role anon');for(const table of ['access_codes','access_grants','sessions'])await assert.rejects(()=>db.query(`select * from dna_private.${table}`),/permission denied/);await assert.rejects(()=>db.query("select public.dna_api('admin_list','{}',null)"),/permission denied/);await assert.rejects(()=>db.query("select public.dna_api_legacy('result','{}',null)"),/permission denied/);await db.exec('reset role');
 const audit={syntheticDataOnly:true,batchSizes:[100,500,1000],unpredictableBits:130,landingCreatesNoSession:true,quotaAtomic:true,retryIdempotent:true,batchRetryIdempotent:true,resumeAfterExhaustion:true,crossTokenIsolation:true,disabledAndRestored:true,fiveStatusFilters:true,csvUtf8Bom:true,publicResultsExcludeToken:true,anonymousDbDenied:true};
 fs.mkdirSync('outputs/token-migration',{recursive:true});fs.writeFileSync('outputs/token-migration/backend-tests.json',JSON.stringify(audit,null,2));console.log('PASS: Token batches 100/500/1000, 130-bit randomness, atomic 3-start quota, idempotent retries, resume, isolation, five states, disable/restore, UTF-8 CSV, result privacy and admin authentication.');
}finally{await db.close();}
