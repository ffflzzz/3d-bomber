export interface HeroDef {
  videoPath?: string
  id: string
  name: string
  title: string
  description: string
  emoji: string
  modelPath: string
  texturePath: string
  color: string
  era: string
  instrument: string
  stats: {
    hp: number
    attack: number
    defense: number
    speed: number
    bombCount: number
    bombPower: number
  }
  abilities: Array<{
    key: string
    name: string
    icon: string
    description: string
    cooldown: number
    mana: number
  }>
  passive: string
  bombColor: string
  explosionColor: string
}

export const HEROES: HeroDef[] = [
  // ═══════════════════════════════════════════════════
  // BAROQUE ERA (1600-1750)
  // ═══════════════════════════════════════════════════
  {
    id: 'bach',
        videoPath: '/hero_videos/bach.mp4',
    name: '巴赫',
    title: '赋格之父',
    description: '巴洛克音乐的巅峰，复调大师。炸弹以十字赋格形式爆炸，带有管风琴回响。',
    emoji: '🎻',
    modelPath: '/models/hero_bach.glb',
    texturePath: '/textures/hero_bach.png',
    color: '#c8a84e',
    era: 'baroque',
    instrument: '管风琴',
    stats: { hp: 120, attack: 12, defense: 8, speed: 4, bombCount: 1, bombPower: 3 },
    abilities: [
      { key: 'Q', name: '赋格炸弹', icon: '🎵', description: '放置赋格炸弹，十字爆炸带回旋音符', cooldown: 0.5, mana: 0 },
      { key: 'W', name: '赋格连锁', icon: '🎼', description: '引爆所有炸弹并产生复调连锁反应', cooldown: 8, mana: 25 },
      { key: 'E', name: '管风琴护盾', icon: '🛡', description: '管风琴音管环绕形成护盾', cooldown: 10, mana: 35 },
      { key: 'R', name: '马太受难曲', icon: '⛪', description: '神圣音乐全屏眩晕所有敌人', cooldown: 45, mana: 100 },
    ],
    passive: '十字爆炸范围+1，每升3级炸弹容量+1',
    bombColor: '#c8a84e',
    explosionColor: '#ffd54f',
  },
  {
    id: 'vivaldi',
        videoPath: '/hero_videos/vivaldi.mp4',
    name: '维瓦尔第',
    title: '四季大师',
    description: '小提琴大师，以《四季》闻名。炸弹随机附带春/夏/秋/冬属性效果。',
    emoji: '🌸',
    modelPath: '/models/hero_vivaldi.glb',
    texturePath: '/textures/hero_vivaldi.png',
    color: '#e91e63',
    era: 'baroque',
    instrument: '小提琴',
    stats: { hp: 80, attack: 14, defense: 4, speed: 7, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '四季炸弹', icon: '🌺', description: '放置随机季节属性炸弹', cooldown: 0.3, mana: 5 },
      { key: 'W', name: '春之花环', icon: '🌷', description: '花环围绕，持续治疗', cooldown: 8, mana: 30 },
      { key: 'E', name: '夏之烈焰', icon: '☀', description: '烈焰加速，移速翻倍2秒', cooldown: 6, mana: 20 },
      { key: 'R', name: '冬之冰封', icon: '❄', description: '冰霜爆发，冻结周围敌人3秒', cooldown: 35, mana: 80 },
    ],
    passive: '炸弹随机附带元素效果，击杀回复生命',
    bombColor: '#e91e63',
    explosionColor: '#f48fb1',
  },
  {
    id: 'handel',
        videoPath: '/hero_videos/handel.mp4',
    name: '亨德尔',
    title: '弥赛亚之声',
    description: '清唱剧大师，《弥赛亚》创作者。炸弹爆炸带有神圣光环，可治疗己方。',
    emoji: '✝',
    modelPath: '/models/hero_handel.glb',
    texturePath: '/textures/hero_handel.png',
    color: '#ffd54f',
    era: 'baroque',
    instrument: '大键琴',
    stats: { hp: 150, attack: 8, defense: 12, speed: 3.5, bombCount: 1, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '弥赛亚炸弹', icon: '✨', description: '放置神圣炸弹，爆炸治疗附近友方', cooldown: 0.5, mana: 10 },
      { key: 'W', name: '哈利路亚波', icon: '🙏', description: '释放神圣冲击波击退敌人', cooldown: 7, mana: 30 },
      { key: 'E', name: '水乐护盾', icon: '💧', description: '水之音乐形成流动护盾', cooldown: 12, mana: 40 },
      { key: 'R', name: '弥赛亚降临', icon: '👼', description: '全队回复50%生命+3秒无敌', cooldown: 60, mana: 120 },
    ],
    passive: '每秒回复1%最大生命，治疗效果+30%',
    bombColor: '#ffd54f',
    explosionColor: '#fff9c4',
  },
  // ═══════════════════════════════════════════════════
  // CLASSICAL ERA (1750-1820)
  // ═══════════════════════════════════════════════════
  {
    id: 'mozart',
        videoPath: '/hero_videos/mozart.mp4',
    name: '莫扎特',
    title: '音乐神童',
    description: '天才中的天才，歌剧大师。炸弹带有魔笛的魅惑铃声，华丽而致命。',
    emoji: '🎹',
    modelPath: '/models/hero_mozart.glb',
    texturePath: '/textures/hero_mozart.png',
    color: '#7b1fa2',
    era: 'classical',
    instrument: '钢琴',
    stats: { hp: 70, attack: 18, defense: 3, speed: 6, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '魔笛炸弹', icon: '🔔', description: '放置魔笛炸弹，铃声眩晕附近敌人', cooldown: 0.3, mana: 8 },
      { key: 'W', name: '费加罗序曲', icon: '⚡', description: '序曲加速，所有技能冷却-3秒', cooldown: 6, mana: 25 },
      { key: 'E', name: '安魂曲', icon: '💀', description: '死亡后3秒自动复活（每场1次）', cooldown: 0, mana: 50 },
      { key: 'R', name: '魔笛·夜后', icon: '👸', description: '召唤夜后咏叹调，高音碎片横扫全场', cooldown: 40, mana: 100 },
    ],
    passive: '击杀敌人后获得短暂加速，技能冷却减少',
    bombColor: '#7b1fa2',
    explosionColor: '#ce93d8',
  },
  {
    id: 'beethoven',
        videoPath: '/hero_videos/beethoven.mp4',
    name: '贝多芬',
    title: '命运叩门者',
    description: '用生命谱写交响曲的巨人。命运敲门四连爆，力量型英雄的极致。',
    emoji: '✊',
    modelPath: '/models/hero_beethoven.glb',
    texturePath: '/textures/hero_beethoven.png',
    color: '#37474f',
    era: 'classical',
    instrument: '钢琴',
    stats: { hp: 160, attack: 16, defense: 10, speed: 3.5, bombCount: 1, bombPower: 3 },
    abilities: [
      { key: 'Q', name: '命运炸弹', icon: '💥', description: '当当当当！四段式十字爆炸', cooldown: 0.5, mana: 0 },
      { key: 'W', name: '月光·减速', icon: '🌙', description: '月光洒落，减速区域内所有敌人', cooldown: 8, mana: 30 },
      { key: 'E', name: '热情·狂暴', icon: '🔥', description: '攻击力翻倍3秒，但防御减半', cooldown: 10, mana: 35 },
      { key: 'R', name: '欢乐颂', icon: '🎶', description: '欢乐颂响彻战场，全队攻击+50% 5秒', cooldown: 50, mana: 100 },
    ],
    passive: '生命越低攻击力越高（最高+50%），免疫恐惧',
    bombColor: '#37474f',
    explosionColor: '#90a4ae',
  },
  {
    id: 'haydn',
        videoPath: '/hero_videos/haydn.mp4',
    name: '海顿',
    title: '交响乐之父',
    description: '古典时期的奠基人。惊愕炸弹看似无害，突然爆发巨响。',
    emoji: '😂',
    modelPath: '/models/hero_haydn.glb',
    texturePath: '/textures/hero_haydn.png',
    color: '#5c6bc0',
    era: 'classical',
    instrument: '小提琴',
    stats: { hp: 100, attack: 10, defense: 7, speed: 5, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '惊愕炸弹', icon: '😱', description: '放置隐形炸弹，敌人靠近时突然爆炸', cooldown: 0.5, mana: 5 },
      { key: 'W', name: '告别交响曲', icon: '🚪', description: '乐手离场效果，敌人随机方向逃跑2秒', cooldown: 8, mana: 30 },
      { key: 'E', name: '时钟交响曲', icon: '⏰', description: '时钟节奏，移速+50% 持续4秒', cooldown: 10, mana: 25 },
      { key: 'R', name: '创世纪', icon: '🌍', description: '重塑地形，将一片区域变为可破坏块', cooldown: 40, mana: 90 },
    ],
    passive: '炸弹延迟2秒爆炸但伤害+60%，击杀获得额外经验',
    bombColor: '#5c6bc0',
    explosionColor: '#9fa8da',
  },
  // ═══════════════════════════════════════════════════
  // ROMANTIC ERA (1820-1900)
  // ═══════════════════════════════════════════════════
  {
    id: 'chopin',
        videoPath: '/hero_videos/chopin.mp4',
    name: '肖邦',
    title: '钢琴诗人',
    description: '最细腻的钢琴诗人。夜曲炸弹无声放置，延迟优雅爆炸。',
    emoji: '🌹',
    modelPath: '/models/hero_chopin.glb',
    texturePath: '/textures/hero_chopin.png',
    color: '#880e4f',
    era: 'romantic',
    instrument: '钢琴',
    stats: { hp: 60, attack: 15, defense: 2, speed: 8, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '夜曲炸弹', icon: '🌙', description: '无声放置，3秒后优雅爆炸', cooldown: 0.3, mana: 5 },
      { key: 'W', name: '叙事曲·弹射', icon: '💫', description: '音符弹射，对直线敌人造成伤害', cooldown: 5, mana: 20 },
      { key: 'E', name: '练习曲·闪避', icon: '💨', description: '华丽闪避，0.5秒无敌+位移', cooldown: 4, mana: 15 },
      { key: 'R', name: '英雄波兰舞曲', icon: '🇵🇱', description: '波兰舞曲响彻，全屏致命一击', cooldown: 35, mana: 90 },
    ],
    passive: '闪避率30%，击杀后隐身1秒',
    bombColor: '#880e4f',
    explosionColor: '#f48fb1',
  },
  {
    id: 'tchaikovsky',
        videoPath: '/hero_videos/tchaikovsky.mp4',
    name: '柴可夫斯基',
    title: '芭蕾之王',
    description: '管弦乐色彩大师。胡桃夹子炸弹引发芭蕾舞般的连锁爆炸。',
    emoji: '🩰',
    modelPath: '/models/hero_tchaikovsky.glb',
    texturePath: '/textures/hero_tchaikovsky.png',
    color: '#1565c0',
    era: 'romantic',
    instrument: '管弦乐',
    stats: { hp: 100, attack: 14, defense: 6, speed: 5, bombCount: 1, bombPower: 3 },
    abilities: [
      { key: 'Q', name: '胡桃夹子炸弹', icon: '🪖', description: '放置胡桃夹子士兵炸弹', cooldown: 0.5, mana: 0 },
      { key: 'W', name: '天鹅湖·减速场', icon: '🦢', description: '天鹅湖音乐形成减速区域', cooldown: 8, mana: 30 },
      { key: 'E', name: '1812序曲·炮击', icon: '💣', description: '1812序曲炮击，远程轰炸指定区域', cooldown: 10, mana: 40 },
      { key: 'R', name: '睡美人·时间暂停', icon: '⏳', description: '时间暂停3秒，敌人静止不动', cooldown: 45, mana: 100 },
    ],
    passive: '炸弹爆炸范围+2，AOE伤害+20%',
    bombColor: '#1565c0',
    explosionColor: '#64b5f6',
  },
  {
    id: 'liszt',
        videoPath: '/hero_videos/liszt.mp4',
    name: '李斯特',
    title: '钢琴魔王',
    description: '史上最伟大的钢琴家。超技炸弹如钢琴键飞溅，华丽而危险。',
    emoji: '😈',
    modelPath: '/models/hero_liszt.glb',
    texturePath: '/textures/hero_liszt.png',
    color: '#b71c1c',
    era: 'romantic',
    instrument: '钢琴',
    stats: { hp: 80, attack: 16, defense: 4, speed: 7, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '超技炸弹', icon: '🎹', description: '钢琴键碎片飞溅的十字爆炸', cooldown: 0.3, mana: 5 },
      { key: 'W', name: '匈牙利狂想曲', icon: '💃', description: '狂想曲弹射，跳跃到远处', cooldown: 6, mana: 25 },
      { key: 'E', name: '钟·眩晕', icon: '🔔', description: '钟声眩晕周围敌人2秒', cooldown: 8, mana: 30 },
      { key: 'R', name: '但丁奏鸣曲', icon: '🔥', description: '地狱之门开启，大范围持续伤害', cooldown: 40, mana: 100 },
    ],
    passive: '连续击杀获得连击加成，速度持续提升',
    bombColor: '#b71c1c',
    explosionColor: '#ef9a9a',
  },
  // ═══════════════════════════════════════════════════
  // MODERN ERA (1900-present)
  // ═══════════════════════════════════════════════════
  {
    id: 'debussy',
        videoPath: '/hero_videos/debussy.mp4',
    name: '德彪西',
    title: '印象派音画',
    description: '用音符作画的印象派大师。月光炸弹如水波般扩散，柔和而致命。',
    emoji: '🌊',
    modelPath: '/models/hero_debussy.glb',
    texturePath: '/textures/hero_debussy.png',
    color: '#00bcd4',
    era: 'modern',
    instrument: '钢琴',
    stats: { hp: 75, attack: 13, defense: 5, speed: 6, bombCount: 2, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '月光炸弹', icon: '🌙', description: '水波纹扩散的柔和爆炸', cooldown: 0.5, mana: 5 },
      { key: 'W', name: '海·潮汐', icon: '🌊', description: '潮汐推力，推开所有敌人', cooldown: 7, mana: 30 },
      { key: 'E', name: '牧神午后', icon: '😴', description: '催眠区域内敌人2秒', cooldown: 10, mana: 35 },
      { key: 'R', name: '意象·水中倒影', icon: '🪞', description: '镜像所有敌人，复制体攻击本体', cooldown: 40, mana: 100 },
    ],
    passive: '炸弹爆炸呈波纹扩散，范围逐渐增大',
    bombColor: '#00bcd4',
    explosionColor: '#80deea',
  },
  {
    id: 'stravinsky',
        videoPath: '/hero_videos/stravinsky.mp4',
    name: '斯特拉文斯基',
    title: '革命之火',
    description: '《春之祭》引发音乐革命。不规则节奏的多段爆炸，混乱型英雄。',
    emoji: '🔥',
    modelPath: '/models/hero_stravinsky.glb',
    texturePath: '/textures/hero_stravinsky.png',
    color: '#ff6f00',
    era: 'modern',
    instrument: '管弦乐',
    stats: { hp: 90, attack: 17, defense: 5, speed: 5.5, bombCount: 1, bombPower: 3 },
    abilities: [
      { key: 'Q', name: '春之祭炸弹', icon: '🌿', description: '不规则节奏的多段十字爆炸', cooldown: 0.5, mana: 0 },
      { key: 'W', name: '火鸟·点燃', icon: '🐦', description: '火鸟飞过，点燃路径上的敌人', cooldown: 7, mana: 30 },
      { key: 'E', name: '彼得鲁什卡·分身', icon: '🤡', description: '召唤木偶分身吸引仇恨', cooldown: 10, mana: 35 },
      { key: 'R', name: '春之祭·献祭', icon: '⚡', description: '牺牲30%生命造成巨额全屏伤害', cooldown: 45, mana: 80 },
    ],
    passive: '爆炸有30%概率触发二次爆炸，混乱中获得力量',
    bombColor: '#ff6f00',
    explosionColor: '#ffcc80',
  },
  {
    id: 'hisaishi',
        videoPath: '/hero_videos/hisaishi.mp4',
    name: '久石让',
    title: '动画诗人',
    description: '宫崎骏的音乐灵魂伴侣。龙猫炸弹可爱但威力十足。',
    emoji: '🐱',
    modelPath: '/models/hero_hisaishi.glb',
    texturePath: '/textures/hero_hisaishi.png',
    color: '#4caf50',
    era: 'modern',
    instrument: '钢琴/管弦乐',
    stats: { hp: 110, attack: 11, defense: 7, speed: 5.5, bombCount: 1, bombPower: 2 },
    abilities: [
      { key: 'Q', name: '龙猫炸弹', icon: '🐱', description: '可爱的龙猫冲击波炸弹', cooldown: 0.5, mana: 0 },
      { key: 'W', name: '天空之城·飞行', icon: '🏰', description: '短暂飞行越过障碍物', cooldown: 8, mana: 30 },
      { key: 'E', name: '千与千寻·治愈', icon: '💚', description: '温暖音乐治愈，回复30%生命', cooldown: 12, mana: 40 },
      { key: 'R', name: '幽灵公主·自然之怒', icon: '🌲', description: '自然之力爆发，全屏治疗+伤害', cooldown: 50, mana: 100 },
    ],
    passive: '每5秒自动回复5%生命，队友在范围内获得增益',
    bombColor: '#4caf50',
    explosionColor: '#a5d6a7',
  },
]