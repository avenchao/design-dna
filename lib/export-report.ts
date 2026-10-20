import { archetypes } from './archetypes';
import { dimensions, type Result } from './assessment';
export async function exportReport(result: Result, svg: string, url: string) {
  await document.fonts.ready;
  const p=archetypes.find(p=>p.id===result.primary)!,s=archetypes.find(p=>p.id===result.secondary)!;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=9000;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器暂不支持图片生成。');
  const font='"PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle='#f4f1e9';ctx.fillRect(0,0,1080,9000);ctx.fillStyle='#24271f';
  let y=95;
  const text=(t:string,size=30,bold=false,color='#24271f',width=920)=>{
    ctx.font=`${bold?'700':'400'} ${size}px ${font}`;ctx.fillStyle=color;
    let line='';
    for(const c of t){if(c==='\n'||ctx.measureText(line+c).width>width){ctx.fillText(line,80,y);y+=size*1.7;line=c==='\n'?'':c;}else line+=c;}
    if(line){ctx.fillText(line,80,y);y+=size*1.7;}
  };
  const rule=()=>{y+=20;ctx.fillStyle='#cecec0';ctx.fillRect(80,y,920,1);y+=62;};
  const section=(label:string,body:string)=>{text(label,23,true,'#6c7064');y+=10;text(body,29);y+=28;};
  text('DESIGN DNA  /  设计灵魂档案',28,true);y+=22;
  text(p.english,21,false,'#6c7064');y+=8;text(p.name,76,true);text(`${p.school} × ${p.master}`,31);y+=15;
  const img=new Image();
  // Explicit intrinsic size avoids the browser's 300×150 SVG fallback when
  // drawing source rectangles into a canvas.
  const sizedSvg=svg.replace('<svg','<svg width="400" height="400"');
  img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sizedSvg)}`;
  await img.decode();ctx.drawImage(img,0,62,400,265,80,y,920,610);y+=680;
  text(`「${p.quote}」`,39,true);y+=8;text(p.tags.join('  /  '),25,false,'#6c7064');rule();
  section('01 / 你的灵魂档案',p.story);
  section('你的设计称号',p.title);
  section('门派绝技',p.power);
  section('成长提示',p.weakness);rule();
  text('02 / 六维创作偏好',30,true);text('这是本次答题的偏好刻度，不是能力评分或匹配概率。',21,false,'#6c7064');y+=25;
  dimensions.forEach((d,i)=>{
    text(`${d[0]}    ${d[1]} ↔ ${d[2]}`,26,true);
    const score=Math.round((result.scores[i]+1)*50);
    ctx.fillStyle='#deded2';ctx.fillRect(80,y,920,9);ctx.fillStyle=p.color;ctx.fillRect(80,y,920*score/100,9);
    ctx.beginPath();ctx.arc(80+920*score/100,y+4.5,10,0,Math.PI*2);ctx.fill();y+=60;
  });rule();
  section('03 / 隐藏设计灵魂',`${s.name} × ${s.master}\n主导的你偏向「${p.tags.join('、')}」，另一面也带着「${s.tags.join('、')}」的倾向。两种语言，可以同时属于你。`);
  section('04 / 设计史彩蛋',p.history);
  section('给你的创作小挑战',p.practice);rule();
  text('你的设计灵魂，究竟是哪一派？',32,true);text('打开链接，查看这份档案',23,false,'#6c7064');text(url,21,false,'#6c7064');y+=25;
  text(`DESIGN DNA · ${new Date(result.createdAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})} · ${result.version}`,20,false,'#6c7064');
  text('本测评为设计偏好探索与趣味体验，未经心理测量信效度验证。',20,false,'#6c7064');
  text('门派人设与宣言为产品创作，不代表艺术家本人的性格或原话。',20,false,'#6c7064');
  const output=document.createElement('canvas');output.width=1080;output.height=Math.ceil(y+60);
  output.getContext('2d')!.drawImage(canvas,0,0);
  const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请重试。')),'image/png'));
  return {blob,filename:`DESIGN-DNA-${p.name}-${result.id.slice(0,8)}.png`};
}
