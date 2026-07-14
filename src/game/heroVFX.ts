/**
 * 英雄视觉特效配置
 * 每位英雄的炸弹、爆炸、粒子特效与其音乐风格关联
 */

export interface HeroVFX {
  bombColor: string
  bombEmissive: string
  bombScale: number
  explosionColor: string
  explosionEmissive: string
  explosionPattern: 'cross' | 'ring' | 'star' | 'wave' | 'spiral' | 'scatter'
  particleCount: number
  /** 特殊粒子色（烟雾、火花等） */
  particleColor: string
  /** 爆炸持续时间 */
  explosionDuration: number
}

export const HERO_VFX: Record<string, HeroVFX> = {
  // 巴赫 — 金色十字赋格，精确而庄严
  bach: {
    bombColor: '#c8a84e', bombEmissive: '#ffd54f', bombScale: 0.85,
    explosionColor: '#c8a84e', explosionEmissive: '#ffd54f',
    explosionPattern: 'cross', particleCount: 16, particleColor: '#fff8e1',
    explosionDuration: 1.0,
  },
  // 维瓦尔第 — 四季色彩（随机春绿/夏红/秋金/冬蓝）
  vivaldi: {
    bombColor: '#e91e63', bombEmissive: '#f48fb1', bombScale: 0.75,
    explosionColor: '#e91e63', explosionEmissive: '#f48fb1',
    explosionPattern: 'star', particleCount: 20, particleColor: '#fce4ec',
    explosionDuration: 0.9,
  },
  // 亨德尔 — 圣洁光环，金色扩散
  handel: {
    bombColor: '#ffd54f', bombEmissive: '#fff9c4', bombScale: 0.9,
    explosionColor: '#ffd54f', explosionEmissive: '#fff9c4',
    explosionPattern: 'ring', particleCount: 24, particleColor: '#fffde7',
    explosionDuration: 1.2,
  },
  // 海顿 — "惊愕"式爆发，突然而强烈
  haydn: {
    bombColor: '#42a5f5', bombEmissive: '#90caf9', bombScale: 0.7,
    explosionColor: '#42a5f5', explosionEmissive: '#90caf9',
    explosionPattern: 'cross', particleCount: 18, particleColor: '#e3f2fd',
    explosionDuration: 0.7,
  },
  // 莫扎特 — 华丽的音符粒子，轻盈而优雅
  mozart: {
    bombColor: '#ff9800', bombEmissive: '#ffcc80', bombScale: 0.75,
    explosionColor: '#ff9800', explosionEmissive: '#ffcc80',
    explosionPattern: 'star', particleCount: 22, particleColor: '#fff3e0',
    explosionDuration: 0.85,
  },
  // 贝多芬 — 命运的沉重力量，深色轰鸣
  beethoven: {
    bombColor: '#d32f2f', bombEmissive: '#ef5350', bombScale: 0.95,
    explosionColor: '#d32f2f', explosionEmissive: '#ef5350',
    explosionPattern: 'cross', particleCount: 28, particleColor: '#ffcdd2',
    explosionDuration: 1.1,
  },
  // 肖邦 — 夜曲般柔和的光晕，诗意扩散
  chopin: {
    bombColor: '#7c4dff', bombEmissive: '#b388ff', bombScale: 0.7,
    explosionColor: '#7c4dff', explosionEmissive: '#b388ff',
    explosionPattern: 'wave', particleCount: 14, particleColor: '#ede7f6',
    explosionDuration: 1.3,
  },
  // 柴可夫斯基 — 华丽多彩如芭蕾舞裙
  tchaikovsky: {
    bombColor: '#e040fb', bombEmissive: '#ea80fc', bombScale: 0.8,
    explosionColor: '#e040fb', explosionEmissive: '#ea80fc',
    explosionPattern: 'star', particleCount: 26, particleColor: '#f3e5f5',
    explosionDuration: 1.0,
  },
  // 李斯特 — 烈焰般炫技，火红的速度感
  liszt: {
    bombColor: '#b71c1c', bombEmissive: '#ef5350', bombScale: 0.85,
    explosionColor: '#ff6f00', explosionEmissive: '#ffab40',
    explosionPattern: 'spiral', particleCount: 30, particleColor: '#fff3e0',
    explosionDuration: 0.8,
  },
  // 德彪西 — 水波纹扩散，印象派光影
  debussy: {
    bombColor: '#00bcd4', bombEmissive: '#80deea', bombScale: 0.7,
    explosionColor: '#00bcd4', explosionEmissive: '#80deea',
    explosionPattern: 'wave', particleCount: 12, particleColor: '#e0f7fa',
    explosionDuration: 1.5,
  },
  // 斯特拉文斯基 — 原始火焰，不规则的混乱
  stravinsky: {
    bombColor: '#ff6f00', bombEmissive: '#ffab40', bombScale: 0.9,
    explosionColor: '#ff6f00', explosionEmissive: '#ffab40',
    explosionPattern: 'scatter', particleCount: 32, particleColor: '#ffe0b2',
    explosionDuration: 0.75,
  },
  // 久石让 — 自然清新，温暖的绿色光芒
  hisaishi: {
    bombColor: '#4caf50', bombEmissive: '#81c784', bombScale: 0.75,
    explosionColor: '#4caf50', explosionEmissive: '#a5d6a7',
    explosionPattern: 'ring', particleCount: 18, particleColor: '#e8f5e9',
    explosionDuration: 1.2,
  },
}