import {homeHref} from '../client-runtime';

export type IllustrationSlot='main'|'a'|'b'|'c'|'d';
export function questionIllustration(id:string,slot:IllustrationSlot){
 return `${homeHref()}illustrations/${id.toLowerCase()}-${slot}.webp`;
}
export const illustrationSlots:IllustrationSlot[]=['main','a','b','c','d'];
export const sceneDescriptions:Record<string,string>={
 Q01:'设计师看着黑色屏幕中的彩虹光泽，AI在旁边开心回应。',
 Q02:'设计师刷着一组长得很像的AI作品，表情逐渐麻木。',
 Q03:'设计师怀疑地看着不停点赞的AI和两张水平不同的设计稿。',
 Q04:'设计师对着第38版提示词疲惫地托着脸，AI依旧满脸自信。',
 Q05:'设计师看着屏幕里整齐排列的海报缩略图，筛选工作才刚开始。',
 Q06:'AI又端出龙、灯笼、祥云和红色块，设计师一脸无语。',
 Q07:'设计师站在空展厅里，身边只有纸箱、胶带和一张旧海报。',
 Q08:'设计师麻木地看着手机上关于AI替代设计师的新闻。',
 Q09:'设计师拿着手机准备回复争论AI作品获奖的设计群。',
 Q10:'AI在电脑前同时处理多种设计任务，设计师和朋友站在一旁。',
};
