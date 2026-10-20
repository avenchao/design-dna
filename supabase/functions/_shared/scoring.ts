import {TYPES,primaryMap,secondaryMap,signatureAnswers,type TypeId} from './model.ts';
export function calculateV2(answers:number[]){
 if(!Array.isArray(answers)||answers.length!==10||answers.some(v=>!Number.isInteger(v)||v<0||v>3))throw new Error('请完成全部10道题。');
 const primaryScore=Object.fromEntries(TYPES.map(t=>[t,0])) as Record<TypeId,number>;
 const signatureHit={...primaryScore},secondarySupport={...primaryScore};
 answers.forEach((a,i)=>{const p=primaryMap[i][a];primaryScore[p]++;secondarySupport[secondaryMap[i][a]]++;if(signatureAnswers[p].includes(`Q${i+1}${'ABCD'[a]}`))signatureHit[p]++;});
 const finalPrimaryScore=Object.fromEntries(TYPES.map(t=>[t,primaryScore[t]+signatureHit[t]*.25])) as Record<TypeId,number>;
 const pick=(pool:TypeId[])=>{
   let tied=pool;
   for(const metric of [finalPrimaryScore,signatureHit,secondarySupport]){const max=Math.max(...tied.map(t=>metric[t]));tied=tied.filter(t=>metric[t]===max);if(tied.length===1)return tied[0];}
   for(const q of [8,9,7,4]){const match=primaryMap[q][answers[q]];if(tied.includes(match))return match;}
   // Stable final fallback if none of the four value questions names a finalist.
   return tied[0];
 };
 const primary=pick([...TYPES]),secondary=pick(TYPES.filter(t=>t!==primary));
 return {primary,secondary,primaryScore,signatureHit,secondarySupport,finalPrimaryScore};
}
