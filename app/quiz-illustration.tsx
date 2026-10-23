import {useEffect,useRef,useState} from 'react';
import {questionIllustrationSources,type IllustrationSlot} from '../lib/v2/illustrations';

export default function QuizIllustration({question,slot,alt='',retry=0,onFailure}:{question:string;slot:IllustrationSlot;alt?:string;retry?:number;onFailure:()=>void}){
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 const failureCallback=useRef(onFailure);
 useEffect(()=>{failureCallback.current=onFailure;},[onFailure]);
 const sources=questionIllustrationSources(question,slot);
 const original=sources[attempt];
 const src=retry?`${original}?retry=${retry}`:original;
 function next(){
  if(attempt<sources.length-1){setLoaded(false);setAttempt(attempt+1);}
  else {setFailed(true);failureCallback.current();}
 }
 useEffect(()=>{
  if(loaded||failed)return;
  const timer=setTimeout(()=>{
   if(attempt<2)setAttempt(attempt+1);
   else {setFailed(true);failureCallback.current();}
  },6000);
  return()=>clearTimeout(timer);
 },[attempt,loaded,failed]);
 return <span className={`quiz-illustration-media${loaded?' is-loaded':''}${failed?' has-image-error':''}`} data-image-source={attempt}>
  <img key={src} src={src} width={slot==='main'?1200:800} height={slot==='main'?900:600} alt={alt} loading="eager" decoding="sync" referrerPolicy="no-referrer" fetchPriority={slot==='main'?'high':'auto'} data-testid={slot==='main'?'question-scene':undefined} onLoad={()=>{setLoaded(true);setFailed(false);}} onError={next}/>
  {!loaded&&<span className="quiz-image-status" role={failed?'status':undefined}>{failed?'图片暂未载入，可重新加载':'插画加载中…'}</span>}
 </span>;
}
