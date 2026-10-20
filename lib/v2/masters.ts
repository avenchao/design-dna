import type {TypeId} from './model';

export type MasterStyle = {
  movement: string; movementEnglish: string; bio: string; source: string;
  background: string; ink: string; muted: string; accent: string;
};

// Verified against these museums, foundations and studios. The visual
// directions interpret a body of work rather than copying one artwork.
export const masterStyles: Record<TypeId, MasterStyle> = {
  T1: {
    movement: '风格派 · 新造型主义', movementEnglish: 'DE STIJL',
    bio: '荷兰抽象艺术家。以垂直、水平线和红黄蓝原色，探索画面的秩序与平衡。',
    source: 'https://www.moma.org/artists/4057-piet-mondrian',
    background: '#f8f8f4', ink: '#1c1c1c', muted: '#696964', accent: '#d9382b',
  },
  T2: {
    movement: '瑞士国际主义平面设计', movementEnglish: 'INTERNATIONAL TYPOGRAPHIC STYLE',
    bio: '瑞士平面设计师。以网格、无衬线字体和清晰的信息层级，让复杂内容变得有条理。',
    source: 'https://swissgrid.posterhouse.org/',
    background: '#f4f2ec', ink: '#181818', muted: '#66635e', accent: '#d83b2d',
  },
  T3: {
    movement: '超现实主义', movementEnglish: 'SURREALISM',
    bio: '西班牙艺术家。把熟悉的事物放进梦境般的场景，让现实与想象的边界开始松动。',
    source: 'https://www.salvador-dali.org/en/dali-and-gala/dali-the-total-artist/painting/',
    background: '#f4eee2', ink: '#38372c', muted: '#746c5b', accent: '#416e70',
  },
  T4: {
    movement: '抽象艺术', movementEnglish: 'ABSTRACT ART',
    bio: '抽象艺术的先驱之一。把色彩、线条与形状当作音乐，让看不见的感受进入画面。',
    source: 'https://www.guggenheim.org/exhibition/kandinsky-gallery',
    background: '#f5f1e7', ink: '#252528', muted: '#6a655d', accent: '#3158a4',
  },
  T5: {
    movement: '孟菲斯设计', movementEnglish: 'MEMPHIS',
    bio: '意大利建筑师与设计师，孟菲斯设计的发起者之一。用跳脱的色彩、几何与趣味挑战惯例。',
    source: 'https://www.design-museum.de/en/exhibitions/detailpages/ettore-sottsass-rebel-and-poet.html',
    background: '#fff5eb', ink: '#28212b', muted: '#75656e', accent: '#bd315b',
  },
  T6: {
    movement: '包豪斯 · 新视觉实验', movementEnglish: 'BAUHAUS / NEW VISION',
    bio: '包豪斯教师与跨媒介艺术家。把光影、摄影和材料变成实验工具，拓展“看见”的方式。',
    source: 'https://moholynagy.org/photograms/',
    background: '#202326', ink: '#f6f3eb', muted: '#b8b9b6', accent: '#ee8054',
  },
  T7: {
    movement: '现代东方视觉 · 文化转译', movementEnglish: 'CONTEMPORARY CHINESE VISUAL DESIGN',
    bio: '香港设计师与水墨艺术家。把东方美学、水墨意趣与现代设计结合，让文化长出当代的表达。',
    source: 'https://hk.heritage.museum/documents/doc/en/exid264/20_20_booklet_rev.pdf',
    background: '#f3f1e8', ink: '#292e2b', muted: '#6c7066', accent: '#a14432',
  },
  T8: {
    movement: '感知 · 留白 · 克制的现代设计', movementEnglish: 'EMPTINESS / SENSORY DESIGN',
    bio: '日本平面设计师。关注日常感知，以白、留白与细微的材料质感，重新唤起人对事物的察觉。',
    source: 'https://hara.ndc.co.jp/en/about/',
    background: '#fafaf7', ink: '#3b3b36', muted: '#777970', accent: '#73796d',
  },
};
