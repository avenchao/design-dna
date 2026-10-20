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
 const dark=result.primary==='T6',quiet=result.primary==='T8';
 const paper=dark?'#292d32':'#fffefa';
 const sticker=dark?'#e8ef93':result.primary==='T7'?'#e7eacb':'#ffe65a';
 const pink=dark?'#f9aa8e':result.primary==='T7'?'#a14432':'#f52c79';
 const tint=dark?'#383a35':result.primary==='T3'?'#e3ece8':result.primary==='T5'?'#ffe4ee':result.primary==='T7'?'#edeee2':'#fff4c9';
 function rect(x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string) {
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}
 }
 function text(s:string,y:number,size:number,weight=400,color=m.ink,max=880,x=540,align:CanvasTextAlign='center') {
  ctx.font=`${weight} ${size}px ${system}`;ctx.fillStyle=color;ctx.textAlign=align;
  let line='';const lines:string[]=[];
  for(const ch of s){if(ctx.measureText(line+ch).width>max&&line){lines.push(line);line=ch;}else line+=ch;}
  if(line)lines.push(line);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.45));
 }
 function fit(s:string,y:number,size:number,weight=700,max=880,color=m.ink) {
  let fitted=size;ctx.font=`${weight} ${fitted}px ${system}`;
  while(ctx.measureText(s).width>max&&fitted>24){fitted--;ctx.font=`${weight} ${fitted}px ${system}`;}
  text(s,y,fitted,weight,color,max);
 }
 function star(x:number,y:number,size:number,color=m.ink) {
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.lineWidth=3.5;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(0,-size);ctx.quadraticCurveTo(-size*.12,-size*.12,-size,0);ctx.quadraticCurveTo(-size*.12,size*.12,0,size);ctx.quadraticCurveTo(size*.12,size*.12,size,0);ctx.quadraticCurveTo(size*.12,-size*.12,0,-size);ctx.stroke();ctx.restore();
 }
 function underline(x1:number,x2:number,y:number,color:string,width=10) {
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y+3);ctx.quadraticCurveTo((x1+x2)/2,y-6,x2,y-1);ctx.stroke();ctx.restore();
 }
 ctx.fillStyle=m.background;ctx.fillRect(0,0,1080,1920);
 if(!quiet){
  ctx.fillStyle=sticker;ctx.beginPath();ctx.arc(22,94,177,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=pink;ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(1060,1660,210,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 rect(42,45,996,1828,38,paper,dark?'#4a4d51':'#e7e3db');
 ctx.save();ctx.translate(229,124);ctx.rotate(-.035);rect(-141,-35,282,70,32,m.ink);text('DESIGN DNA',11,31,800,paper,270,0);ctx.restore();
 text('DESIGN',105,25,750,m.muted,220,888);text('SURVIVOR!',140,25,750,m.muted,220,888);
 if(!quiet)star(981,180,19,pink);
 text('AI时代，我的设计精神状态是',237,27,500,m.muted);
 fit(p.name,343,84,850,890);underline(396,684,374,quiet?m.accent:sticker,12);
 fit(p.quote,438,35,700,882);
 const img=new Image();img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await img.decode();
 if(!quiet){rect(100,500,892,694,27,dark?'#47403c':'#efe7d7');rect(88,488,892,694,27,tint);}
 ctx.drawImage(img,88,488,900,697.5);
 if(!quiet){
  star(110,499,26,m.ink);star(972,1170,23,pink);
  ctx.save();ctx.translate(797,1160);ctx.rotate(-.075);rect(-132,-33,264,66,18,sticker);text('这很我！',11,31,800,'#242322',235,0);ctx.restore();
  ctx.save();ctx.strokeStyle=pink;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(943,448);ctx.lineTo(956,428);ctx.moveTo(968,460);ctx.lineTo(989,451);ctx.stroke();ctx.restore();
 }
 text('灵魂大师',1258,22,500,m.muted);fit(p.master,1312,38,800,875);fit(p.english,1355,25,500,875);fit(m.movement,1397,23,500,875,m.muted);
 rect(88,1443,900,235,24,quiet?'#f5f5ef':tint);
 ctx.save();ctx.translate(238,1476);ctx.rotate(-.045);rect(-120,-24,240,48,12,quiet?'#e9ebe2':sticker);text('隐藏人格',8,22,750,'#35352f',220,0);ctx.restore();
 fit(hidden.name,1541,38,800,840);text(combination(result.primary,result.secondary).replace(/你/g,'我'),1602,28,500,m.muted,824);
 const qr=document.createElement('canvas');await QRCode.toCanvas(qr,url,{width:116,margin:1,errorCorrectionLevel:'M',color:{dark:'#1d1d1f',light:'#ffffff'}});
 ctx.drawImage(qr,862,1722,116,116);
 text('我的脑袋，很难批量生成。',1768,28,750,m.ink,720,88,'left');text('测测你的设计精神状态 →',1810,24,400,m.muted,720,88,'left');
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请重试。')),'image/png'));
 return {blob,filename:`DESIGN-DNA-${p.name}-${result.id.slice(0,8)}.png`};
}
