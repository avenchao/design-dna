import {createHandler,type ApiReply} from './handler.ts';

const supabaseUrl=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=(Deno.env.get('ALLOWED_ORIGINS')||'').split(',').map(s=>s.trim()).filter(Boolean);
const ipSalt=Deno.env.get('IP_HASH_SALT')!;
if(!supabaseUrl||!serviceKey||!ipSalt||!origins.length)throw new Error('Required backend configuration is missing.');
Deno.serve(createHandler({origins,ipSalt,rpc:async(action,payload,ipHash)=>{
 const response=await fetch(`${supabaseUrl}/rest/v1/rpc/dna_api`,{
  method:'POST',headers:{'Content-Type':'application/json',apikey:serviceKey,Authorization:`Bearer ${serviceKey}`},
  body:JSON.stringify({p_action:action,p_payload:payload,p_ip_hash:ipHash}),
 });
 if(!response.ok)throw new Error('Database request failed.');
 return await response.json() as ApiReply;
}}));
