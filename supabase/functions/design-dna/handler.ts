import {calculateV2} from '../_shared/scoring.ts';
import {VERSION} from '../_shared/model.ts';
import {accessTokenFormat,accessStatuses,newAccessToken,accessCsv} from './access.ts';

type Payload=Record<string,unknown>;
export type ApiReply={status:number;body:Record<string,unknown>};
export type Rpc=(action:string,payload:Payload,ipHash:string|null)=>Promise<ApiReply>;
const actions=new Set(['verify','access','start','status','progress','submit','events']);
const eventNames=new Set(['question_answered','question_back','share_card_generated','image_saved','share_link_created','retest_clicked']);
const tokenFormat=/^[a-f0-9]{64}$/;
const idFormat=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
const validAnswers=(a:unknown,partial=false)=>Array.isArray(a)&&a.length===10&&a.every(v=>(partial&&v===null)||(Number.isInteger(v)&&v>=0&&v<=3));

export function createHandler({rpc,origins,ipSalt,adminKeyHash=''}:{rpc:Rpc;origins:string[];ipSalt:string;adminKeyHash?:string}) {
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
   const admin=route.startsWith('admin/');
   if(!actions.has(route)&&!admin)return json({error:'找不到此接口。'},404);
   if(admin){
    const credential=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
    if(!adminKeyHash||credential.length>256||await hash(credential)!==adminKeyHash)return json({error:'管理密钥无效。'},401);
   }
   if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'请求格式无效。'},415);
   if(Number(req.headers.get('content-length')||0)>8192)return json({error:'请求过大。'},413);
   const reader=req.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
   if(reader){for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return json({error:'请求过大。'},413);}chunks.push(value);}}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   let raw:unknown;try{raw=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'请求格式无效。'},400);}
   if(!raw||typeof raw!=='object'||Array.isArray(raw))return json({error:'请求格式无效。'},400);
   const body=raw as Payload,payload:Payload={};let responseToken:string|undefined;
   if(admin){
    if(route==='admin/generate'){
     if(![100,500,1000].includes(Number(body.count))||typeof body.count!=='number'||typeof body.batchId!=='string'||!idFormat.test(body.batchId))return json({error:'请选择100、500或1000个，并提供有效批次ID。'},400);
     const tokens=new Set<string>();while(tokens.size<body.count)tokens.add(newAccessToken());
     payload.items=await Promise.all([...tokens].map(async token=>({token,hash:await hash(token)})));payload.batchId=body.batchId;
    }else if(route==='admin/set-status'){
     if(typeof body.accessToken!=='string'||!accessTokenFormat.test(body.accessToken)||typeof body.disabled!=='boolean')return json({error:'Token或状态无效。'},400);
     payload.accessToken=body.accessToken;payload.disabled=body.disabled;
    }else if(route==='admin/list'||route==='admin/export'){
     if(body.status!==undefined&&!accessStatuses.includes(String(body.status)))return json({error:'筛选状态无效。'},400);
     if(body.page!==undefined&&(!Number.isInteger(body.page)||Number(body.page)<0||Number(body.page)>100000))return json({error:'页码无效。'},400);
     if(body.batchId&& (typeof body.batchId!=='string'||!idFormat.test(body.batchId)))return json({error:'批次无效。'},400);
     payload.status=body.status||'all';payload.page=body.page||0;payload.search=typeof body.search==='string'?body.search.trim().toUpperCase().slice(0,26):'';payload.batchId=body.batchId||'';
    }else return json({error:'找不到此管理接口。'},404);
    const response=await rpc(route.replace(/[/-]/g,'_'),payload,null);
    if(route==='admin/export'&&response.status===200)return new Response(accessCsv(response.body.items as Record<string,unknown>[]),{headers:{...cors,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="design-dna-access-links.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    return json(response.body,response.status);
   }
   if(route==='access'){
    const entry=typeof body.accessToken==='string'?body.accessToken.trim().toUpperCase():'';
    if(!accessTokenFormat.test(entry))return json({error:'这个测试入口无效或已停用。'},401);
    payload.codeHash=await hash(entry);responseToken=randomToken();payload.tokenHash=await hash(responseToken);
    if(typeof body.resumeToken==='string'&&tokenFormat.test(body.resumeToken))payload.resumeHash=await hash(body.resumeToken);
   }else if(route==='verify'){
    const code=typeof body.code==='string'?body.code.trim().toUpperCase():'';
    payload.codeHash=await hash(code);
    responseToken=randomToken();payload.tokenHash=await hash(responseToken);
    if(typeof body.resumeToken==='string'&&tokenFormat.test(body.resumeToken))payload.resumeHash=await hash(body.resumeToken);
   } else if(route==='events'&&body.resultId&&!body.token){
    if(typeof body.resultId!=='string'||!idFormat.test(body.resultId))return json({error:'事件无效。'},400);
    payload.resultId=body.resultId;
   } else {
    if(typeof body.token!=='string'||!tokenFormat.test(body.token))return json({error:'请从有效的专属测试链接进入。'},401);
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
   const ip=route==='verify'||route==='access'?await hash(`${ipSalt}:${req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown'}`):null;
   const response=await rpc(route,payload,ip);
   if((route==='verify'||route==='access')&&response.status===200){
    response.body.token=response.body.resumed?body.resumeToken:responseToken;delete response.body.resumed;
   }
   return json(response.body,response.status);
  } catch {return json({error:'服务暂时繁忙，请稍后再试。已选答案会保留。'},503);}
 };
}
