import {useCallback,useEffect,useRef,useState} from 'react';
import {homeHref} from '../lib/client-runtime';
type Status='all'|'unused'|'used_1'|'used_2'|'exhausted'|'disabled';
type Item={token:string;access_url:string;max_starts:number;used_starts:number;status:Exclude<Status,'all'>;created_at:string;batch_id:string};
type Inventory={items:Item[];total:number;summary:Record<Exclude<Status,'all'>,number>;baseUrl:string};
type AdminBody=Inventory&{error?:string;batchId:string;count:number};
const labels:Record<Status,string>={all:'全部',unused:'未使用',used_1:'已使用1次',used_2:'已使用2次',exhausted:'已用完',disabled:'已停用'};
const storage='design-dna-admin-key';
function savedKey(){try{return sessionStorage.getItem(storage)||'';}catch{return '';}}
// Management requests put the independent key only in Authorization, never URLs.
async function manage(key:string,action:string,data:unknown){
 const base=document.querySelector<HTMLMetaElement>('meta[name="dna-api"]')?.content.replace(/\/$/,'')||'/api';
 return fetch(`${base}/admin/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify(data),cache:'no-store',referrerPolicy:'no-referrer'});
}
export default function TokenAdmin(){
 const [auth,setAuth]=useState(savedKey),[input,setInput]=useState(''),[inventory,setInventory]=useState<Inventory|null>(null);
 const [status,setStatus]=useState<Status>('all'),[search,setSearch]=useState(''),[searchInput,setSearchInput]=useState(''),[batchId,setBatchId]=useState(''),[page,setPage]=useState(0),[count,setCount]=useState(100);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const requestId=useRef('');
 const logout=useCallback(()=>{setAuth('');setInventory(null);try{sessionStorage.removeItem(storage);}catch{}},[]);
 const load=useCallback(async()=>{
  if(!auth)return;setLoading(true);setError('');try{
   const response=await manage(auth,'list',{status,search,batchId,page});const body=await response.json() as AdminBody;
   if(!response.ok){if(response.status===401)logout();throw Error(body.error||'读取失败，请重试。');}setInventory(body);
  }catch(e){setError((e as Error).message);}finally{setLoading(false);}
 },[auth,status,search,batchId,page,logout]);
 useEffect(()=>{let stopped=false;queueMicrotask(()=>{if(!stopped)void load();});return()=>{stopped=true;};},[load]);
 async function login(e:React.FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setError('');try{
   const response=await manage(input.trim(),'list',{page:0});const body=await response.json() as AdminBody;if(!response.ok)throw Error(body.error||'登录失败。');
   setAuth(input.trim());setInventory(body);try{sessionStorage.setItem(storage,input.trim());}catch{}setInput('');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function generate(){
  if(busy)return;setBusy(true);setError('');setNotice('');try{
   requestId.current||=crypto.randomUUID();const response=await manage(auth,'generate',{count,batchId:requestId.current});const body=await response.json() as AdminBody;
   if(!response.ok)throw Error(body.error||'生成失败。');requestId.current='';setBatchId(body.batchId);setSearch('');setSearchInput('');setStatus('all');setPage(0);setNotice(`已生成 ${body.count} 个专属入口，请导出本批次 CSV。`);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function toggle(item:Item){
  if(busy)return;setBusy(true);setError('');try{
   const response=await manage(auth,'set-status',{accessToken:item.token,disabled:item.status!=='disabled'});const body=await response.json() as AdminBody;if(!response.ok)throw Error(body.error||'操作失败。');
   setNotice(item.status==='disabled'?'已恢复，原有使用次数保留。':'已停用此入口。');await load();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function exportCsv(){
  if(busy)return;setBusy(true);setError('');try{
   const response=await manage(auth,'export',{status,search,batchId});if(!response.ok){const body=await response.json() as AdminBody;throw Error(body.error||'导出失败。');}
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`DESIGN-DNA-唯一卡券-${batchId?batchId.slice(0,8):status}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('CSV 已下载，可将 access_url 列作为唯一卡券导入发货系统。');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function copy(item:Item){try{await navigator.clipboard.writeText(item.access_url);setNotice('完整入口链接已复制。');}catch{setNotice('请在表格中选中完整链接复制。');}}
 return <div className="token-admin"><header><a href={homeHref()}>DESIGN DNA</a><span>唯一卡券管理</span>{auth&&<button onClick={logout}>退出管理</button>}</header>
 {!auth?<main className="admin-login"><h1>卡券管理</h1><p>使用独立管理密钥登录。</p><form onSubmit={login}><label htmlFor="admin-key">管理密钥</label><input id="admin-key" type="password" autoComplete="current-password" value={input} onChange={e=>setInput(e.target.value)} required/><button className="admin-primary" disabled={busy||!input.trim()}>{busy?'正在登录…':'登录后台'}</button></form>{error&&<p role="alert" className="admin-error">{error}</p>}</main>:<main>
 <div className="admin-title"><div><h1>唯一访问链接</h1><p>每个入口最多开测 3 次。打开链接、继续同一场测试不扣次。</p></div><button disabled={loading||busy} onClick={()=>void load()}>刷新数据</button></div>
 <div className="admin-summary">{Object.entries(labels).filter(([key])=>key!=='all').map(([key,label])=><button className={status===key?'selected':''} key={key} onClick={()=>{setStatus(key as Status);setPage(0);}}><span>{label}</span><strong>{inventory?.summary[key as Exclude<Status,'all'>]??'—'}</strong></button>)}</div>
 <section className="admin-generate"><div><h2>批量生成唯一卡券</h2><p>随机生成不可预测的 Token，完整链接可直接用于自动发货。</p></div><label>生成数量<select aria-label="生成数量" value={count} disabled={busy} onChange={e=>{setCount(Number(e.target.value));requestId.current='';}}>{[100,500,1000].map(n=><option value={n} key={n}>{n} 个</option>)}</select></label><button className="admin-primary" disabled={busy} onClick={generate}>{busy?'处理中…':'生成 Token'}</button></section>
 <section className="admin-inventory"><div className="admin-filters"><form onSubmit={e=>{e.preventDefault();setSearch(searchInput.trim().toUpperCase());setPage(0);}}><input aria-label="搜索Token" placeholder="搜索 Token" value={searchInput} onChange={e=>setSearchInput(e.target.value)}/><button>搜索</button></form><select aria-label="筛选状态" value={status} onChange={e=>{setStatus(e.target.value as Status);setPage(0);}}>{Object.entries(labels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select><button disabled={busy||!inventory?.total} onClick={exportCsv}>导出当前筛选 CSV</button></div>
 {batchId&&<p className="admin-batch">当前批次：{batchId}<button onClick={()=>{setBatchId('');setPage(0);}}>查看所有批次</button></p>}
 {notice&&<p className="admin-notice" role="status">{notice}</p>}{error&&<p className="admin-error" role="alert">{error}</p>}
 <p className="admin-count">{loading?'正在读取…':`共 ${inventory?.total??0} 个入口`} · 入口地址：{inventory?.baseUrl||'—'}</p>
 <div className="admin-table-wrap"><table><thead><tr><th>Token / 完整入口链接</th><th>使用次数</th><th>状态</th><th>生成时间</th><th>操作</th></tr></thead><tbody>{inventory?.items.map(item=><tr key={item.token}><td><code>{item.token}</code><a href={item.access_url} target="_blank" rel="noreferrer">{item.access_url}</a></td><td>{item.used_starts} / {item.max_starts}</td><td><span className={`admin-status ${item.status}`}>{labels[item.status]}</span></td><td>{new Date(item.created_at).toLocaleString('zh-CN')}</td><td><div className="admin-row-actions"><button onClick={()=>void copy(item)}>复制链接</button><button disabled={busy} onClick={()=>void toggle(item)}>{item.status==='disabled'?'恢复':'停用'}</button></div></td></tr>)}</tbody></table></div>
 {!loading&&inventory?.total===0&&<p className="admin-empty">暂无符合条件的入口。</p>}
 <div className="admin-pagination"><button disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page+1} / {Math.max(1,Math.ceil((inventory?.total||0)/50))} 页</span><button disabled={loading||(page+1)*50>=(inventory?.total||0)} onClick={()=>setPage(p=>p+1)}>下一页</button></div></section>
 </main>}</div>;
}
