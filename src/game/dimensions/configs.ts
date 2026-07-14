// Music Era dimension configurations

export interface DimensionConfig {
  id: string
  name: string
  nameEn: string
  era: string
  themeColor: string
  accentColor: string
  skyColor: string
  fogColor: string
  fogNear: number
  fogFar: number
  ambientIntensity: number
  groundColor: string
  wallColor: string
  destructibleColor: string
  grassColor: string
  wallDensity: number
  destructibleDensity: number
  grassDensity: number
  monsterCount: number
  groundTexture: string
  wallTexture: string
  destructibleTexture: string
  monsterTypes: Array<{
    type: number
    name: string
    hp: number
    atk: number
    speed: number
    xp: number
    range: number
    color: string
  }>
  portalTargets: string[]
  mechanic: string
}

export const DIMENSIONS: Record<string, DimensionConfig> = {
  baroque: {
    id: 'baroque',
    name: '巴洛克纪元',
    nameEn: 'Baroque Era',
    era: '1600-1750',
    themeColor: '#c8a84e',
    accentColor: '#ffd54f',
    skyColor: '#1a1505',
    fogColor: '#2a1a05',
    fogNear: 40,
    fogFar: 110,
    ambientIntensity: 1.0,
    groundColor: '#3a2a10',
    wallColor: '#5a4a25',
    destructibleColor: '#7a6a35',
    grassColor: '#4a3a15',
    wallDensity: 0.0,
    destructibleDensity: 0.40,
    grassDensity: 0.10,
    monsterCount: 20,
    groundTexture: '/textures/era_baroque_ground.png',
    wallTexture: '/textures/era_baroque_wall.png',
    destructibleTexture: '/textures/era_baroque_dest.png',
    monsterTypes: [
      { type: 0, name: '不协和音符', hp: 30, atk: 1, speed: 2, xp: 12, range: 6, color: '#c8a84e' },
      { type: 1, name: '走调管风琴', hp: 60, atk: 3, speed: 2.5, xp: 25, range: 8, color: '#8d6e63' },
      { type: 2, name: '失调维瓦尔第', hp: 250, atk: 9, speed: 1.5, xp: 120, range: 12, color: '#b71c1c' },
    ],
    portalTargets: ['classical', 'romantic'],
    mechanic: 'echo',
  },
  classical: {
    id: 'classical',
    name: '古典纪元',
    nameEn: 'Classical Era',
    era: '1750-1820',
    themeColor: '#f5f0e8',
    accentColor: '#e0d5c0',
    skyColor: '#0a0a15',
    fogColor: '#1a1a2a',
    fogNear: 45,
    fogFar: 120,
    ambientIntensity: 1.3,
    groundColor: '#2a2520',
    wallColor: '#4a4540',
    destructibleColor: '#6a6560',
    grassColor: '#3a3530',
    wallDensity: 0.0,
    destructibleDensity: 0.38,
    grassDensity: 0.08,
    monsterCount: 22,
    groundTexture: '/textures/era_classical_ground.png',
    wallTexture: '/textures/era_classical_wall.png',
    destructibleTexture: '/textures/era_classical_dest.png',
    monsterTypes: [
      { type: 3, name: '走音乐器傀儡', hp: 40, atk: 3, speed: 2.5, xp: 15, range: 7, color: '#f5f0e8' },
      { type: 4, name: '失衡指挥棒', hp: 70, atk: 4, speed: 3, xp: 28, range: 9, color: '#5c6bc0' },
      { type: 5, name: '疯狂贝多芬', hp: 350, atk: 12, speed: 1.8, xp: 160, range: 13, color: '#37474f' },
    ],
    portalTargets: ['baroque', 'romantic'],
    mechanic: 'symmetry',
  },
  romantic: {
    id: 'romantic',
    name: '浪漫纪元',
    nameEn: 'Romantic Era',
    era: '1820-1900',
    themeColor: '#8b1a1a',
    accentColor: '#e57373',
    skyColor: '#0a0510',
    fogColor: '#1a0a15',
    fogNear: 30,
    fogFar: 90,
    ambientIntensity: 0.7,
    groundColor: '#2a0a0a',
    wallColor: '#4a1515',
    destructibleColor: '#6a2525',
    grassColor: '#3a1010',
    wallDensity: 0.0,
    destructibleDensity: 0.45,
    grassDensity: 0.12,
    monsterCount: 25,
    groundTexture: '/textures/era_romantic_ground.png',
    wallTexture: '/textures/era_romantic_wall.png',
    destructibleTexture: '/textures/era_romantic_dest.png',
    monsterTypes: [
      { type: 6, name: '失控节拍器', hp: 35, atk: 4, speed: 4, xp: 18, range: 7, color: '#8b1a1a' },
      { type: 7, name: '黑暗夜曲', hp: 80, atk: 7, speed: 2.5, xp: 35, range: 10, color: '#880e4f' },
      { type: 8, name: '黑暗肖邦', hp: 400, atk: 13, speed: 2, xp: 200, range: 14, color: '#4a148c' },
    ],
    portalTargets: ['classical', 'modern'],
    mechanic: 'tempo_shift',
  },
  modern: {
    id: 'modern',
    name: '现代纪元',
    nameEn: 'Modern Era',
    era: '1900-Present',
    themeColor: '#00bcd4',
    accentColor: '#80deea',
    skyColor: '#050a0d',
    fogColor: '#0a1520',
    fogNear: 25,
    fogFar: 80,
    ambientIntensity: 0.8,
    groundColor: '#0a1520',
    wallColor: '#152530',
    destructibleColor: '#1a3540',
    grassColor: '#0a2030',
    wallDensity: 0.0,
    destructibleDensity: 0.50,
    grassDensity: 0.05,
    monsterCount: 28,
    groundTexture: '/textures/era_modern_ground.png',
    wallTexture: '/textures/era_modern_wall.png',
    destructibleTexture: '/textures/era_modern_dest.png',
    monsterTypes: [
      { type: 9, name: '电子噪音兽', hp: 40, atk: 6, speed: 4.5, xp: 20, range: 8, color: '#00bcd4' },
      { type: 10, name: '失真合成器', hp: 90, atk: 8, speed: 3, xp: 40, range: 11, color: '#ff6f00' },
      { type: 11, name: '机器斯特拉文斯基', hp: 500, atk: 16, speed: 2, xp: 240, range: 15, color: '#b71c1c' },
    ],
    portalTargets: ['romantic', 'baroque'],
    mechanic: 'glitch',
  },
}

export const DIMENSION_IDS = Object.keys(DIMENSIONS)
export const DEFAULT_DIMENSION = 'baroque'
