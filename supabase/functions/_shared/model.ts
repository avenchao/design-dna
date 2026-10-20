import frozen from './frozen-content.json' with {type:'json'};
export const VERSION='design-dna-2.0';
export const TYPES=['T1','T2','T3','T4','T5','T6','T7','T8'] as const;
export type TypeId=typeof TYPES[number];
export const questions=frozen.questions;
export const primaryMap:TypeId[][]=[
 ['T1','T3','T5','T2'],['T1','T3','T4','T7'],['T1','T3','T4','T6'],['T2','T4','T8','T5'],['T1','T3','T8','T6'],
 ['T7','T5','T8','T6'],['T8','T7','T6','T2'],['T2','T5','T7','T8'],['T1','T3','T4','T6'],['T4','T2','T7','T5'],
];
export const secondaryMap:TypeId[][]=[
 ['T6','T8','T4','T3'],['T8','T6','T5','T1'],['T8','T6','T8','T2'],['T6','T1','T2','T6'],['T8','T6','T4','T2'],
 ['T5','T4','T7','T7'],['T4','T6','T3','T6'],['T6','T6','T8','T2'],['T8','T6','T3','T2'],['T8','T6','T5','T4'],
];
export const signatureAnswers:Record<TypeId,string[]>={T1:['Q1A','Q5A'],T2:['Q4A','Q8A'],T3:['Q2B','Q9B'],T4:['Q3C','Q9C'],T5:['Q6B','Q10D'],T6:['Q5D','Q9D'],T7:['Q6A','Q10C'],T8:['Q5C','Q8D']};
export const pairs:Record<string,string>={
 'T1-T2':'一个管像素，一个管世界秩序。','T1-T3':'脑洞可以疯，落地必须对齐。','T1-T4':'一边讲感觉，一边偷偷调0.5像素。','T1-T5':'想叛逆可以，先把参考线打开。','T1-T6':'看不顺眼就改，用不顺手也改。','T1-T7':'传统可以重做，但网格不能乱。','T1-T8':'一个负责对齐，一个负责删掉。',
 'T2-T3':'你的脑洞负责逃跑，你的系统负责抓回来。','T2-T4':'情绪可以汹涌，信息必须排队。','T2-T5':'表面遵守秩序，内心准备造反。','T2-T6':'别人还在讨论，你已经建好工作流了。','T2-T7':'你负责翻旧账，也负责重新归档。','T2-T8':'不光要整齐，还嫌东西太多。',
 'T3-T4':'你的想象力负责出逃，情绪负责提供燃料。','T3-T5':'你的脑子负责越狱，审美负责接应。','T3-T6':'想到怪点子还不够，你真的会去试。','T3-T7':'别人研究传统，你准备让传统穿越。','T3-T8':'一个疯狂做加法，一个拼命按删除键。',
 'T4-T5':'情绪一上来，审美就不太听话。','T4-T6':'一边感受世界，一边想办法改世界。','T4-T7':'你负责感受世界，也负责记住世界。','T4-T8':'感觉很多，但画面不一定要说很多。','T5-T6':'不是为了叛逆，是因为你真的想试试别的。','T5-T7':'传统到了你手里，多少得叛逆一下。','T5-T8':'一个想加戏，一个想删戏，天天内部打架。','T6-T7':'旧东西到你手里，先拆开看看还能怎么用。','T6-T8':'能少一个步骤，就绝不多按一次按钮。','T7-T8':'懂得从传统里拿东西，也懂得什么时候别拿太多。',
};
export function combination(a:TypeId,b:TypeId){return pairs[[a,b].sort().join('-')];}
export type Profile={id:TypeId;name:string;master:string;english:string;school:string;power:string;quote:string;color:string;motif:string;headline:string;lines:string[];evaluation:string};
export const profiles:Record<TypeId,Profile>={
 T1:{id:'T1',name:'像素级秩序控',master:'蒙德里安',english:'PIET MONDRIAN',school:'风格派 / De Stijl',power:'视觉判断力',quote:'世界可以乱，我的画面不能乱。',color:'#0071e3',motif:'mondrian',headline:'你的眼睛，自带参考线。',lines:['别人看到一张图：挺好看的。','你看到：这里是不是歪了0.5像素？','AI可以一秒生成1000张图。','但你更擅长知道：','哪999张应该删掉。'],evaluation:'你的眼睛可能没有散光，但自带参考线。'},
 T2:{id:'T2',name:'排版纪律委员会主任',master:'约瑟夫·穆勒-布罗克曼',english:'JOSEF MÜLLER-BROCKMANN',school:'瑞士国际主义 / International Typographic Style',power:'系统整理力',quote:'信息再多，也请排队站好。',color:'#366a9a',motif:'swiss',headline:'你负责让信息别发疯。',lines:['别人看到一堆内容：「好多。」','你看到：','「谁允许你们站这么乱的？」','AI能帮你生产信息。','你负责让信息别发疯。'],evaluation:'你的文件夹可能比你的人生更有秩序。'},
 T3:{id:'T3',name:'脑洞越狱惯犯',master:'萨尔瓦多·达利',english:'SALVADOR DALÍ',school:'超现实主义',power:'非常规联想',quote:'正常是不可能正常的。',color:'#8765b7',motif:'dali',headline:'你的脑子不太喜欢走正门。',lines:['别人问：「这个问题怎么解决？」','你的脑子：','「为什么一定要这样解决？」','AI负责给答案。','你更擅长：提出一个它没准备过的问题。'],evaluation:'别人需要灵感，你需要有人拦一下你的脑子。'},
 T4:{id:'T4',name:'情绪过载型设计人',master:'康定斯基',english:'WASSILY KANDINSKY',school:'抽象艺术',power:'情绪感知力',quote:'别问为什么，我就是感觉到了。',color:'#b25f79',motif:'kandinsky',headline:'到底是哪一种感觉？',lines:['你经常说：「这里就是有点不对。」','然后过一会儿发现：','你居然是对的。','AI知道“悲伤”这个词。','你在意的是：到底是哪一种悲伤。'],evaluation:'别人用眼睛看设计，你可能顺便用了心情。'},
 T5:{id:'T5',name:'视觉叛逆玩家',master:'埃托雷·索特萨斯',english:'ETTORE SOTTSASS',school:'孟菲斯设计',power:'反规则审美',quote:'生活已经够无聊了，设计别再那么乖。',color:'#966048',motif:'memphis',headline:'对“正确答案”，天然有一点不服。',lines:['别人说：「这样不太高级。」','你的脑子：「那不是正好吗？」','你不是单纯喜欢花哨。','你只是对已经被证明“正确”的视觉答案，','天然有一点不服。'],evaluation:'你的设计不一定守规矩，但至少不会无聊。'},
 T6:{id:'T6',name:'功能实验狂人',master:'拉斯洛·莫霍利-纳吉',english:'LÁSZLÓ MOHOLY-NAGY',school:'包豪斯',power:'实验解决力',quote:'先别问好不好看，试试看能不能用。',color:'#507d74',motif:'bauhaus',headline:'你的工具箱，没有边界。',lines:['别人还在讨论风格。','你已经开始：拆、装、换工具、试材料、改流程。','AI对你来说不像敌人。','更像：','一个能力很强、但需要调教的实习生。'],evaluation:'你的设计软件只是工具箱，路边纸箱也可能是。'},
 T7:{id:'T7',name:'传统文化再造狂人',master:'靳埭强',english:'KAN TAI-KEUNG',school:'现代东方视觉 / 中国文化的现代视觉转译',power:'文化转译力',quote:'传统不是素材库，是一个还没讲完的故事。',color:'#79855b',motif:'kan',headline:'旧故事，还可以重新玩一次。',lines:['别人看到旧招牌、老物件、民间纹样：「怀旧。」','你看到：「这个能不能重新玩一次？」','AI可以学习一百万张中国风图片。','但生活过的文化，','不只存在于图片里。'],evaluation:'别人去博物馆参观，你可能偷偷在里面找选题。'},
 T8:{id:'T8',name:'留白上瘾者',master:'原研哉',english:'KENYA HARA',school:'感知、留白、克制的现代设计',power:'感知与克制',quote:'别人还在加，我已经开始删了。',color:'#7c817e',motif:'hara',headline:'你知道，什么时候该停。',lines:['AI：「我可以再生成100个版本。」','你：「我们真的需要这么多吗？」','你相信设计有时候不是继续增加。','而是知道：','什么时候该停。'],evaluation:'你的删除键，可能才是使用频率最高的设计工具。'},
};
export type ResultV2={id:string;version:typeof VERSION;primary:TypeId;secondary:TypeId;createdAt:number};
