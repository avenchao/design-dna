'use client';
import {requestApi,homeHref,resultHref,resultUrl as publicResultUrl,sharedResultId} from '../lib/client-runtime';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight,ArrowLeft,Check,LockKeyhole,Download,Link2,X,LoaderCircle,RotateCcw,ChevronDown,Copy} from 'lucide-react';
import Artwork from './artwork';
import {questions,groups,dimensions,type Result} from '../lib/assessment';
import {archetypes} from '../lib/archetypes';
import {exportReport} from '../lib/export-report';
const KEY='design-dna-draft-v1';
type Draft={token:string;answers:(number|null)[];index:number;remaining:number;expiresAt:number};
async function api(path:string,data?:unknown){
  const response=await requestApi(path,data);
  const body=await response.json() as {error?:string;result:Result;token:string;remaining:number;expiresAt:number};if(!response.ok)throw new Error(body.error||'连接失败，请稍后重试。');return body;
}
function storageGet(){try{return localStorage.getItem(KEY)}catch{return null;}}
function storageRemove(){try{localStorage.removeItem(KEY)}catch{}}
export default function Experience({shared=false}:{shared?:boolean}){
  const [screen,setScreen]=useState<'home'|'quiz'|'result'>(shared?'result':'home');
  const [code,setCode]=useState(''),[draft,setDraft]=useState<Draft|null>(null);
  const [result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(shared);
  const [error,setError]=useState(''),[toast,setToast]=useState(''),[showAbout,setShowAbout]=useState(false);
  const [exporting,setExporting]=useState(false),[image,setImage]=useState<{url:string;blob:Blob;filename:string}|null>(null);
  const [manualLink,setManualLink]=useState('');
  const svgRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null),codeRef=useRef<HTMLInputElement>(null),lock=useRef(false);
  useEffect(()=>{
    let cancelled=false;
    if(shared){const id=sharedResultId();
      api(`/api/results/${id}`).then(b=>{if(!cancelled)setResult(b.result)}).catch(e=>{if(!cancelled)setError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
    }else{
      const saved=storageGet();if(saved){try{const d=JSON.parse(saved) as Draft;
        if(typeof d.token==='string'&&Array.isArray(d.answers)&&d.answers.length===24){
          setLoading(true);api('/api/status',{token:d.token}).then(b=>{if(cancelled)return;if(b.result){setResult(b.result);setScreen('result');window.history.replaceState({},'',resultHref(b.result.id,true));storageRemove();}else{setDraft({...d,index:Math.max(0,Math.min(23,d.index)),remaining:b.remaining});}}).catch(()=>{storageRemove();}).finally(()=>{if(!cancelled)setLoading(false)});
        }
      }catch{storageRemove();}}
    }
    return ()=>{cancelled=true};
  },[shared]);
  useEffect(()=>{if(draft&&screen==='quiz')try{localStorage.setItem(KEY,JSON.stringify(draft));}catch{}},[draft,screen]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)}},[toast]);
  useEffect(()=>{if(image)return()=>URL.revokeObjectURL(image.url)},[image]);
  useEffect(()=>{if(result)document.title=`我的设计灵魂：${archetypes.find(p=>p.id===result.primary)?.name} · DESIGN DNA`;},[result]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'){setShowAbout(false);setImage(null);setManualLink('');}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[]);
  const move=(index:number)=>{setError('');setDraft(d=>d?{...d,index}:null);headingRef.current?.focus();window.scrollTo({top:0,behavior:'smooth'});};
  async function start(e:React.FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{const b=await api('/api/verify',{code});setDraft({token:b.token,answers:draft?.answers||Array(24).fill(null),index:draft?.index||0,remaining:b.remaining,expiresAt:b.expiresAt});setCode('');setScreen('quiz');window.scrollTo(0,0);}catch(e){setError((e as Error).message)}finally{setBusy(false);lock.current=false;}
  }
  async function submit(){if(!draft||lock.current)return;const empty=draft.answers.findIndex(v=>v===null);if(empty>=0){move(empty);setError('这道题还没有选择哦。');return;}
    lock.current=true;setBusy(true);setError('');try{const b=await api('/api/submit',{token:draft.token,answers:draft.answers});setResult(b.result);setScreen('result');setDraft(null);storageRemove();window.history.pushState({},'',resultHref(b.result.id,true));window.scrollTo(0,0);}catch(e){setError((e as Error).message)}finally{setBusy(false);lock.current=false;}
  }
  const shareUrl=()=>publicResultUrl(result!.id,true);
  async function copyLink(){const url=shareUrl();try{await navigator.clipboard.writeText(url);setToast('结果链接已复制，发给朋友一起看看。')}catch{setManualLink(url)}}
  async function saveImage(){if(!result||exporting)return;setExporting(true);setError('');try{
    const svg=svgRef.current?.querySelector('svg')?.outerHTML;if(!svg)throw new Error('图片尚未准备好，请重试。');
    const output=await exportReport(result,svg,shareUrl());const url=URL.createObjectURL(output.blob);setImage({...output,url});
    if(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){const a=document.createElement('a');a.href=url;a.download=output.filename;a.click();}
  }catch(e){setError((e as Error).message)}finally{setExporting(false)}}
  async function shareImage(){if(!image)return;const file=new File([image.blob],image.filename,{type:'image/png'});
    try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'我的 DESIGN DNA'});}else{const a=document.createElement('a');a.href=image.url;a.download=image.filename;a.click();setToast('已请求下载。也可以长按图片，选择保存图片。');}}catch(e){if((e as Error).name!=='AbortError')setToast('可以长按预览图片保存，或点击下载 PNG。');}
  }
  const primary=result?archetypes.find(p=>p.id===result.primary):null,secondary=result?archetypes.find(p=>p.id===result.secondary):null;
  const q=draft?questions[draft.index]:null;
  return <div className="site-shell">
    <header className="site-header"><a href={homeHref()} className="brand" aria-label="DESIGN DNA 首页"><span className="brand-symbol">d<span>✳</span></span>DESIGN DNA<span className="brand-dot">®</span></a><nav><span className="edition">A LITTLE TEST. A LOT OF YOU.</span><button className="text-button" onClick={()=>setShowAbout(true)}>关于测评 <ArrowUpRight size={15}/></button></nav></header>
    {screen==='home'&&<main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="red-dot"/> 发现藏在你身体里的设计大师</div><h1>你的设计灵魂，<br/>究竟是<span className="title-mark">哪一派<span className="question-mark">？</span></span></h1><p className="hero-description">24 道脑洞题，解锁你的设计流派和灵魂大师。<br className="desktop-break"/>有人天生热爱对齐，有人偏要打破规则。你呢？</p>
          <div className="test-facts"><span><b>24</b> 道趣味题</span><span><b>6</b> 个偏好维度</span><span><b>12</b> 种设计灵魂</span></div>
          <div className="access-box">
            {loading?<p className="inline-loading"><LoaderCircle className="spin" size={18}/> 正在找回你的测评进度…</p>:draft?.token?<><div className="resume-note"><span className="red-dot"/> 你上次答到了第 {draft.index+1} 题，灵感还在等你。</div><button className="primary-button" onClick={()=>{setScreen('quiz');setError('');window.scrollTo(0,0)}}>继续上次的测试 <ArrowRight size={20}/></button><button className="text-button change-code" onClick={()=>{storageRemove();setDraft(null)}}>使用其他密码，重新开始</button></>:<form onSubmit={start}><label htmlFor="access-code"><LockKeyhole size={14}/> 输入你的专属测评密码</label><div className="access-input-wrap"><input ref={codeRef} id="access-code" type="password" value={code} onChange={e=>{setCode(e.target.value);setError('')}} placeholder="请输入测评密码" autoComplete="off" spellCheck={false} required maxLength={32} aria-describedby="password-hint"/><button type="submit" className="primary-button" disabled={busy||!code.trim()}>{busy?<LoaderCircle size={18} className="spin"/>:<>开启灵魂探索 <ArrowUpRight size={20}/></>}</button></div><p id="password-hint" className="input-hint">每个密码可完成 3 次测评 · 约 4–6 分钟 · 无需注册</p></form>}
            {error&&<p className="error" role="alert">{error}</p>}
          </div><a className="discover-link" href="#schools">先逛逛 12 种设计灵魂 <ChevronDown size={15}/></a>
        </div>
        <div className="hero-art" aria-label="设计风格预览"><div className="art-topline"><span>THE DESIGN SOUL COLLECTION</span><span>VOL. 01 — 12</span></div><div className="poster-grid">{[{id:'mondrian',word:'秩序',en:'ORDER',no:'01'},{id:'memphis',word:'叛逆',en:'REBEL',no:'08'},{id:'dali',word:'梦境',en:'DREAM',no:'03'},{id:'hara',word:'留白',en:'LESS',no:'12'}].map(p=><div className={`mini-poster poster-${p.id}`} key={p.id}><Artwork kind={p.id}/><div className="poster-caption"><b>{p.word}</b><span>{p.en}<small>NO. {p.no}</small></span></div></div>)}</div><div className="art-bottomline"><span>不必定义自己，先发现自己。</span><span>↓ EXPLORE YOUR DNA</span></div><div className="art-sticker">100%<br/><small>你的独特</small></div></div>
      </section>
      <div className="manifesto-strip"><span>MAKE ROOM FOR YOUR OWN KIND OF DESIGN.</span><span>审美没有标准答案，<em>你有自己的那一派。</em> <span aria-hidden="true">✳</span></span></div>
      <section id="schools" className="schools-section"><div className="section-heading"><div><p className="eyebrow">12 WAYS TO SEE THE WORLD</p><h2>你会加入哪一派<span>？</span></h2></div><p>从严谨的网格，到自由的梦境。<br/>总有一种设计语言，替你说出心里那句话。</p></div><div className="school-grid">{archetypes.map((p,i)=><article className="school-card" key={p.id}><div className="school-art"><Artwork kind={p.id}/><span className="school-number">{String(i+1).padStart(2,'0')}</span></div><div className="school-meta"><h3>{p.name}</h3><ArrowUpRight size={17} aria-hidden="true"/></div><p>{p.school} <span> / {p.master}</span></p></article>)}</div><a className="bottom-cta" href="#access-code" onClick={()=>setTimeout(()=>codeRef.current?.focus(),50)}>找到属于你的设计灵魂 <ArrowUpRight size={21}/></a></section>
    </main>}
    {screen==='quiz'&&draft&&q&&<main className="quiz-main"><div className="quiz-top"><button className="text-button" onClick={()=>{setScreen('home');setError('')}}><ArrowLeft size={16}/> 暂停一下</button><span>剩余 {draft.remaining} 次 · 提交后扣次</span></div><div className="progress-meta"><span>CHAPTER 0{Math.floor(draft.index/4)+1} / {groups[Math.floor(draft.index/4)]}</span><b>{String(draft.index+1).padStart(2,'0')} <i>/ 24</i></b></div><div className="progress-track" role="progressbar" aria-valuenow={draft.index+1} aria-valuemin={0} aria-valuemax={24} aria-label="答题进度"><span style={{width:`${(draft.index+1)/24*100}%`}}/></div><div className="question-layout"><div className="question-decoration" aria-hidden="true"><span>Q<span>{String(draft.index+1).padStart(2,'0')}</span></span><Artwork kind={['mondrian','dali','warhol','memphis','swiss','hara'][Math.floor(draft.index/4)]}/><p>FOLLOW YOUR<br/>FIRST INSTINCT.</p></div><div className="question-content"><p className="eyebrow">别想太久，跟着第一直觉走。</p><h1 ref={headingRef} tabIndex={-1}>{q.title}</h1>{q.context&&<p className="question-context">{q.context}</p>}<fieldset className="options"><legend className="sr-only">请选择最符合你的一个选项</legend>{q.options.map((option,i)=><label className={`option ${draft.answers[draft.index]===i?'selected':''}`} key={`${draft.index}-${i}`}><input type="radio" name={`question-${draft.index}`} value={i} checked={draft.answers[draft.index]===i} onChange={()=>{setDraft(d=>{if(!d)return d;const answers=[...d.answers];answers[d.index]=i;return{...d,answers}});setError('')}}/><span className="option-letter">{'ABCD'[i]}</span><span>{option}</span><span className="option-check">{draft.answers[draft.index]===i&&<Check size={17}/>}</span></label>)}</fieldset>{error&&<p className="error" role="alert">{error}</p>}<div className="quiz-actions"><button className="secondary-button" onClick={()=>move(draft.index-1)} disabled={draft.index===0||busy}><ArrowLeft size={17}/> 上一题</button><button className="primary-button" disabled={draft.answers[draft.index]===null||busy} onClick={()=>draft.index===23?submit():move(draft.index+1)}>{busy?<><LoaderCircle className="spin" size={18}/> 正在生成档案…</>:<>{draft.index===23?'揭晓我的设计灵魂':'下一题'} <ArrowRight size={18}/></>}</button></div><p className="quiz-note">没有标准答案。每一个选择，都是你独特的创作线索。</p>{error&&<button className="text-button" onClick={()=>{setScreen('home');setDraft(d=>d?{...d,token:''}:null);storageRemove()}}>返回输入新密码（保留当前答案）</button>}</div></div></main>}
    {screen==='result'&&<main className="result-main">{loading?<div className="empty-state"><LoaderCircle size={28} className="spin"/><h1>正在打开你的设计灵魂档案…</h1></div>:primary&&secondary&&result?<>
      <div className="result-page-top"><span className="eyebrow">YOUR DESIGN SOUL, REVEALED.</span><a className="text-button" href={homeHref()}>我也来测测 <ArrowUpRight size={16}/></a></div>
      <article className="report" style={{'--result-accent':primary.color} as React.CSSProperties}><div className="report-intro"><div className="report-heading"><p className="eyebrow">你的主导设计灵魂</p><h1>{primary.name}</h1><p className="report-school">{primary.school} <span>×</span> {primary.master}</p><div className="report-tags">{primary.tags.map(t=><span key={t}>{t}</span>)}</div><p className="report-quote">「{primary.quote}」</p><span className="report-english">{primary.english}</span></div><div className="report-art" ref={svgRef}><Artwork kind={primary.id}/><span className="report-art-label">DESIGN DNA<br/>SOUL ARCHIVE / {String(archetypes.indexOf(primary)+1).padStart(2,'0')}</span></div></div>
      <div className="report-body"><section className="report-section"><div className="report-section-label">01 / SOUL PROFILE</div><h2>嗯，这很像你。</h2><span className="identity-tag">{primary.title}</span><p className="story">{primary.story}</p><div className="strength-grid"><div><span className="small-label">你的门派绝技 ↗</span><p>{primary.power}</p></div><div><span className="small-label">偶尔也要注意 ↘</span><p>{primary.weakness}</p></div></div></section>
      <section className="report-section"><div className="report-section-label">02 / CREATIVE PREFERENCES</div><h2>你的创作，有迹可循。</h2><p className="section-caption">六个方向，拼出这一次的你。刻度表示答题偏好，不是能力分数。</p><div className="dimension-grid">{dimensions.map((d,i)=>{const value=Math.round((result.scores[i]+1)*50);return <div className="dimension" key={d[0]}><div className="dimension-name"><b>{d[0]}</b><span>{Math.abs(value-50)<12?'两端兼具':value<50?`偏${d[1]}`:`偏${d[2]}`}</span></div><div className="dimension-track"><span style={{left:`${value}%`}}/></div><div className="dimension-labels"><span>{d[1]}</span><span>{d[2]}</span></div></div>})}</div></section>
      <section className="hidden-soul"><div><div className="report-section-label">03 / YOUR OTHER SIDE</div><h2>等等，你还有另一面。</h2><h3>{secondary.name} <span>× {secondary.master}</span></h3><p>主导的你偏向「{primary.tags.join('、')}」，另一面也带着「{secondary.tags.join('、')}」的倾向。两种语言，可以同时属于你。</p><span className="small-label">隐藏灵魂来自本次答题的第二接近原型</span></div><Artwork kind={secondary.id}/></section>
      <section className="report-section history-section"><div className="report-section-label">04 / A LITTLE DESIGN HISTORY</div><h2>不止有梗，还有来历。</h2><p>{primary.history}</p><div className="practice"><span className="small-label">给你的创作小挑战 ✳</span><p>{primary.practice}</p></div></section><div className="report-footnote"><span>DESIGN DNA / {new Date(result.createdAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})}</span><p>这是一份设计偏好探索，不代表审美高低或专业能力。模型未经心理测量信效度验证。门派人设及宣言为趣味创作，并非大师本人的性格或原话。</p></div></div></article>
      <div className="result-actions"><div><button className="primary-button" onClick={saveImage} disabled={exporting}>{exporting?<LoaderCircle className="spin" size={18}/>:<Download size={18}/>} {exporting?'正在生成长图…':'保存结果长图'}</button><button className="secondary-button" onClick={copyLink}><Link2 size={18}/> 复制结果链接</button></div><p>收藏这份独特，或者发给那个总和你审美不合的朋友。</p><a className="text-button" href={homeHref()}><RotateCcw size={14}/> 再测一次（需输入密码）</a>{error&&<p className="error" role="alert">{error}</p>}</div>
    </>:<div className="empty-state"><h1>这份档案暂时打不开</h1><p className="error" role="alert">{error||'请确认结果链接完整。'}</p><a className="primary-button" href={homeHref()}>返回首页 <ArrowRight size={18}/></a></div>}</main>}
    <footer className="site-footer"><a href={homeHref()} className="footer-brand">DESIGN DNA<span>✳</span></a><p>没有标准答案，只有你的设计直觉。</p><button className="text-button" onClick={()=>setShowAbout(true)}>关于这场探索 <ArrowUpRight size={14}/></button></footer>
    {toast&&<div className="toast" role="status"><Check size={17}/>{toast}</div>}
    {showAbout&&<div className="modal-backdrop" onClick={()=>setShowAbout(false)}><section className="modal about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={e=>e.stopPropagation()}><button autoFocus className="close-button" aria-label="关闭" onClick={()=>setShowAbout(false)}><X/></button><p className="eyebrow">ABOUT DESIGN DNA</p><h2 id="about-title">探索偏好，<br/>别急着定义自己。</h2><p>24 道真实场景与脑洞选择题，观察创作方式、视觉偏好、规则态度、设计目标、灵感来源和表现语言。</p><p>每个选择影响 1–2 个维度。系统汇总你的六维偏好，与 12 个设计风格原型比较，输出最近的主导门派与第二接近的隐藏灵魂。相同答案会得到相同结果。</p><p>这是一款趣味探索工具，计分矩阵属于启发式模型，尚未经过信度与效度验证。它不测能力，也不作心理诊断。部分门派是个人风格类别，并非严格的历史流派。</p><p>每个密码可成功提交 3 次；返回修改、刷新或恢复未提交答题不扣次。会话有效期 24 小时。服务器保存匿名偏好结果与密码使用次数，本机保存未完成的答题进度。结果链接持有者可以直接查看该份结果。</p><button className="primary-button" onClick={()=>setShowAbout(false)}>带着好奇，继续探索 <ArrowRight size={17}/></button></section></div>}
    {image&&<div className="modal-backdrop" onClick={()=>setImage(null)}><section className="modal image-modal" role="dialog" aria-modal="true" aria-labelledby="image-title" onClick={e=>e.stopPropagation()}><button autoFocus className="close-button" aria-label="关闭图片预览" onClick={()=>setImage(null)}><X/></button><h2 id="image-title">把你的设计灵魂带走。</h2><p>手机端可长按图片保存，或通过系统分享菜单存储。<br/>电脑端已请求下载 PNG，也可以再次点击下载。</p><div className="image-preview"><img src={image.url} alt="你的完整设计灵魂结果长图，可长按保存"/></div><div className="image-buttons"><button className="primary-button" onClick={shareImage}><Download size={17}/> 保存 / 分享图片</button><a className="secondary-button" href={image.url} download={image.filename}>下载 PNG</a></div></section></div>}
    {manualLink&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="copy-title"><button className="close-button" aria-label="关闭" onClick={()=>setManualLink('')}><X/></button><h2 id="copy-title">复制你的结果链接</h2><p>当前浏览器不支持自动复制，请选中下面的完整链接复制。</p><input className="manual-link" aria-label="结果分享链接" readOnly value={manualLink} autoFocus onFocus={e=>e.target.select()}/><button className="primary-button" onClick={()=>setManualLink('')}><Copy size={17}/> 完成</button></section></div>}
  </div>;
}
