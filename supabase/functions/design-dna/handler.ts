import {calculateV2} from '../_shared/scoring.ts';
import {VERSION} from '../_shared/model.ts';

type Payload=Record<string,unknown>;
export type ApiReply={status:number;body:Record<string,unknown>};
export type Rpc=(action:string,payload:Payload,ipHash:string|null)=>Promise<ApiReply>;
const actions=new Set(['verify','start','status','progress','submit','events']);
const eventNames=new Set(['question_answered','question_back','share_card_generated','image_saved','share_link_created','retest_clicked']);
const tokenFormat=/^[a-f0-9]{64}$/;
const idFormat=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
const validAnswers=(a:unknown,partial=false)=>Array.isArray(a)&&a.length===10&&a.every(v=>(partial&&v===null)||(Number.isInteger(v)&&v>=0&&v<=3));

export function createHandler({rpc,origins,ipSalt}:{rpc:Rpc;origins:string[];ipSalt:string}) {
 return async(req:Request)=>{
  const origin=req.headers.get('origin');
  const cors:Record<string,string>={'Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'content-type, authorization, apikey, x-client-info','Access-Control-Max-Age':'600'};
  if(origin&&origins.includes(origin))cors['Access-Control-Allow-Origin']=origin;
  const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{...cors,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
  if(origin&&!origins.includes(origin))return json({error:'请求来源无效。'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  try{
   const url=new URL(req.url),segments=url.pathname.split('/').filter(Boolean);
   const actionIndex=segments.indexOf('design-dna')+1;
   const route=segments.slice(actionIndex).join('/');
   if(req.method==='GET'){
    const match=route.match(/^results\/([^/]+)$/);
    if(!match||!idFormat.test(match[1]))return json({error:'结果链接无效。'},404);
    const response=await rpc('result',{id:match[1]},null);return json(response.body,response.status);
   }
   if(req.method!=='POST')return json({error:'请求方式无效。'},405);
   if(!actions.has(route))return json({error:'找不到此接口。'},404);
   if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'请求格式无效。'},415);
   if(Number(req.headers.get('content-length')||0)>8192)return json({error:'请求过大。'},413);
   const reader=req.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
   if(reader){for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return json({error:'请求过大。'},413);}chunks.push(value);}}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   let raw:unknown;try{raw=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'请求格式无效。'},400);}
   if(!raw||typeof raw!=='object'||Array.isArray(raw))return json({error:'请求格式无效。'},400);
   const body=raw as Payload,payload:Payload={};let responseToken:string|undefined;
   if(route==='verify'){
    const code=typeof body.code==='string'?body.code.trim().toUpperCase():'';
    payload.codeHash=await hash(code);
    responseToken=randomToken();payload.tokenHash=await hash(responseToken);
    if(typeof body.resumeToken==='string'&&tokenFormat.test(body.resumeToken))payload.resumeHash=await hash(body.resumeToken);
   } else if(route==='events'&&body.resultId&&!body.token){
    if(typeof body.resultId!=='string'||!idFormat.test(body.resultId))return json({error:'事件无效。'},400);
    payload.resultId=body.resultId;
   } else {
    if(typeof body.token!=='string'||!tokenFormat.test(body.token))return json({error:'请先验证测评密码。'},401);
    payload.tokenHash=await hash(body.token);
   }
   if(route==='progress'||route==='submit'){
    if(!validAnswers(body.answers,route==='progress'))return json({error:'请完成全部10道题。'},400);
    payload.answers=body.answers;
   }
   if(route==='progress'){
    if(!Number.isInteger(body.index)||Number(body.index)<0||Number(body.index)>9||!Number.isSafeInteger(body.revision)||Number(body.revision)<0)return json({error:'答题进度无效。'},400);
    payload.index=body.index;payload.revision=body.revision;
   }
   if(route==='submit'){
    const result=calculateV2(body.answers as number[]);
    payload.result={id:crypto.randomUUID(),version:VERSION,primary:result.primary,secondary:result.secondary,createdAt:Date.now()};
   }
   if(route==='events'){
    if(typeof body.name!=='string'||!eventNames.has(body.name))return json({error:'事件无效。'},400);
    payload.name=body.name;
    if(Number.isInteger(body.question)&&Number(body.question)>=0&&Number(body.question)<10)payload.question=body.question;
    if(Number.isInteger(body.answer)&&Number(body.answer)>=0&&Number(body.answer)<4)payload.answer=body.answer;
   }
   const ip=route==='verify'?await hash(`${ipSalt}:${req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'}`):null;
   const response=await rpc(route,payload,ip);
   if(route==='verify'&&response.status===200){
    response.body.token=response.body.resumed?body.resumeToken:responseToken;delete response.body.resumed;
   }
   return json(response.body,response.status);
  } catch {return json({error:'服务暂时繁忙，请稍后再试。已选答案会保留。'},503);}
 };
}
