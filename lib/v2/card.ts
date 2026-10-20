import QRCode from 'qrcode';
import {profiles,combination,type ResultV2} from './model';
import {masterStyles} from './masters';

export async function renderCard(result:ResultV2,svg:string,url:string) {
 await document.fonts.ready;
 const p=profiles[result.primary],hidden=profiles[result.secondary],m=masterStyles[result.primary];
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const context=canvas.getContext('2d');if(!context)throw new Error('当前浏览器暂不支持图片生成。');
 const ctx:CanvasRenderingContext2D=context;
 const system='-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Helvetica Neue","Microsoft YaHei",Arial,sans-serif';
 const left=result.primary==='T2',font=system,x=left?88:540;
 ctx.fillStyle=m.background;ctx.fillRect(0,0,1080,1920);
 function text(s:string,y:number,size:number,weight=400,color=m.ink,max=900,family=font) {
  ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=color;ctx.textAlign=left?'left':'center';
  if(ctx.measureText(s).width<=max){ctx.fillText(s,x,y);return y+size*1.5;}
  let line='';const lines:string[]=[];
  for(const ch of s){if(ctx.measureText(line+ch).width>max){lines.push(line);line=ch;}else line+=ch;}
  if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*size*1.5));return y+lines.length*size*1.5;
 }
 function fit(s:string,y:number,size:number,weight=600,max=900) {
  let fitted=size;ctx.font=`${weight} ${fitted}px ${font}`;
  while(ctx.measureText(s).width>max&&fitted>42){fitted--;ctx.font=`${weight} ${fitted}px ${font}`;}
  text(s,y,fitted,weight,m.ink,max);
 }
 ctx.fillStyle=m.accent;ctx.globalAlpha=.13;ctx.beginPath();ctx.roundRect(left?88:388,72,304,61,12);ctx.fill();ctx.globalAlpha=1;
 text('DESIGN DNA',114,31,800,m.ink,900,system);
 if(result.primary==='T1'){
  ctx.fillStyle=m.accent;ctx.fillRect(88,159,65,12);ctx.fillStyle='#245ba0';ctx.fillRect(153,159,35,12);ctx.fillStyle='#edc83c';ctx.fillRect(188,159,23,12);
 } else if(left){ctx.fillStyle=m.accent;ctx.fillRect(88,150,900,5);}
 else if(result.primary==='T6'){ctx.strokeStyle='#f6f3eb';ctx.lineWidth=1;ctx.strokeRect(74,75,932,1770);}
 else if(result.primary==='T7'){ctx.fillStyle=m.accent;ctx.fillRect(958,89,23,23);}
 text('AI时代，我的设计精神状态是',248,27,400,m.muted);
 fit(p.name,357,80,800);
 ctx.strokeStyle=m.accent;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(left?91:457,382);ctx.quadraticCurveTo(left?167:535,376,left?250:622,382);ctx.stroke();
 text('灵魂大师',442,22,400,m.muted);
 fit(p.master,498,39,600);
 text(p.english,545,27,500,m.ink,900,system);
 text(m.movement,590,24,400,m.muted,900,system);
 const img=new Image();img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await img.decode();
 if(result.primary!=='T8'){
  ctx.fillStyle=m.accent;ctx.globalAlpha=.08;ctx.beginPath();ctx.roundRect(90,641,900,697.5,32);ctx.fill();ctx.globalAlpha=1;
 }
 ctx.drawImage(img,90,641,900,697.5);
 if(result.primary!=='T8'){
  ctx.strokeStyle=m.ink;ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(969,621);ctx.quadraticCurveTo(966,641,948,644);ctx.quadraticCurveTo(966,647,969,666);ctx.quadraticCurveTo(972,647,990,644);ctx.quadraticCurveTo(972,641,969,621);ctx.stroke();
 }
 text(p.quote,1390,42,700,m.ink,900);
 text('隐藏人格',1540,23,400,m.muted);
 fit(hidden.name,1597,38,600);
 text(combination(result.primary,result.secondary).replace(/你/g,'我'),1663,29,400,m.muted,880,system);
 const qr=document.createElement('canvas');await QRCode.toCanvas(qr,url,{width:116,margin:1,errorCorrectionLevel:'M',color:{dark:'#1d1d1f',light:'#ffffff'}});
 ctx.drawImage(qr,862,1722,116,116);ctx.textAlign='left';ctx.font=`600 28px ${system}`;ctx.fillStyle=m.ink;ctx.fillText('DESIGN DNA',88,1768);
 ctx.font=`400 24px ${system}`;ctx.fillStyle=m.muted;ctx.fillText('测测你的设计精神状态 →',88,1810);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请重试。')),'image/png'));
 return {blob,filename:`DESIGN-DNA-${p.name}-${result.id.slice(0,8)}.png`};
}
