import { create } from 'zustand'
import { audio } from '../utils/audio'

export interface PlayerStats {
  level: number
  xp: number
  xpToNext: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  bombCount: number
  bombPower: number
}

export interface QuestObjective {
  id: string
  description: string
  type: 'kill' | 'collect' | 'reach' | 'talk'
  target: string
  current: number
  required: number
  completed: boolean
}

export interface Quest {
  id: string
  title: string
  description: string
  objectives: QuestObjective[]
  rewards: { xp?: number; item?: string }
  completed: boolean
  active: boolean
}

export type PowerupType = 'bomb_up' | 'fire_up' | 'speed_up' | 'shield' | 'kick' | 'remote'

export interface AbilityState {
  key: string
  name: string
  icon: string
  mana: number
  cooldown: number
  maxCooldown: number
  ready: boolean
}

export interface PowerupItem {
  id: number
  type: PowerupType
  x: number
  z: number
  collected: boolean
}

export interface PortalInstance {
  id: string
  x: number
  z: number
  targetDimension: string
}

export interface GameState {
  // Game phase
  phase: 'menu' | 'playing' | 'paused' | 'gameover'
  
  // Player stats
  player: PlayerStats
  
  // World
  worldSeed: number
  monstersKilled: number
  
  // Dimension system
  currentDimension: string
  isTransitioning: boolean
  transitionProgress: number
  unlockedDimensions: string[]
  portals: PortalInstance[]
  
  // Quests
  quests: Quest[]
  activeQuestId: string | null
  
  // Items
  powerups: PowerupItem[]
  shieldActive: boolean
  shieldTimer: number
  canKickBombs: boolean
  canRemoteDetonate: boolean
  
  // UI state
  showInventory: boolean
  showQuestLog: boolean
  showSettings: boolean
  dialogNpc: string | null
  dialogText: string
  
  // Hero selection
  selectedHeroId: string
  heroSelectOpen: boolean
  
  // Fog of War
  fogOfWarEnabled: boolean
  playerWorldPos: { x: number; z: number }
  mp: number
  maxMp: number
  
  // Minimap
  showMinimap: boolean
  minimapMonsters: Array<{ x: number; z: number; type: number; alive: boolean }>
  minimapMap: number[][]
  minimapSize: number
  minimapPortals: Array<{ x: number; z: number; targetDimension: string }>
  currentWave: number
  waveActive: boolean
  waveMonstersKilled: number
  waveMonstersTotal: number
  waveAnnouncement: string | null
  waveTimer: number
  abilities: AbilityState[]
  comboCount: number
  comboTimer: number
  maxCombo: number
  totalDamageDealt: number
  totalDamageTaken: number
  bombsPlaced: number
  powerupsCollected: number
  floatingDamages: Array<{ id: string; x: number; y: number; z: number; text: string; color: string }>

  // Camera
  cameraMode: '2.5d' | '3d'
  cameraAngle: number
  cameraPitch: number
  cameraDistance: number
  
  // Audio
  musicVolume: number
  sfxVolume: number
  musicEnabled: boolean
  
  // Notifications
  notifications: Array<{ id: string; text: string; type: 'info' | 'xp' | 'levelup' | 'quest'; time: number }>
  
  // Actions
  setPhase: (phase: GameState['phase']) => void
  updatePlayer: (partial: Partial<PlayerStats>) => void
  addXp: (amount: number) => void
  takeDamage: (amount: number) => void
  heal: (amount: number) => void
  killMonster: () => void
  toggleInventory: () => void
  toggleQuestLog: () => void
  toggleSettings: () => void
  setDialog: (npc: string | null, text?: string) => void
  activateQuest: (questId: string) => void
  updateQuestProgress: (questId: string, objectiveId: string, amount: number) => void
  completeQuest: (questId: string) => void
  addNotification: (text: string, type: 'info' | 'xp' | 'levelup' | 'quest') => void
  removeNotification: (id: string) => void
  setSelectedHero: (id: string) => void
  setHeroSelectOpen: (open: boolean) => void
  setFogOfWar: (enabled: boolean) => void
  setPlayerWorldPos: (x: number, z: number) => void
  toggleMinimap: () => void
  setMinimapData: (map: number[][], monsters: Array<{ x: number; z: number; type: number; alive: boolean }>, player?: { x: number; z: number }, portals?: Array<{ x: number; z: number; targetDimension: string }>) => void
  regenMana: (amount: number) => void
  useMana: (amount: number) => boolean
  tickAbilityCooldowns: (dt: number) => void
  setAbilityCooldown: (key: string, cooldown: number) => void
  addDamageDealt: (amount: number) => void
  addFloatingDamage: (x: number, y: number, z: number, text: string, color: string) => void
  addCombo: () => void
  tickCombo: (dt: number) => void
  startWave: (wave: number, total: number) => void
  waveMonsterKilled: () => void
  setCameraMode: (mode: '2.5d' | '3d') => void
  toggleCameraMode: () => void
  setCameraAngle: (a: number) => void
  setCameraPitch: (p: number) => void
  setCameraDistance: (d: number) => void
  setMusicVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  toggleMusic: () => void
  addPowerup: (x: number, z: number, type: PowerupType) => void
  collectPowerup: (id: number) => void
  setShield: (active: boolean, duration?: number) => void
  setCanKick: (v: boolean) => void
  setCanRemote: (v: boolean) => void
  // Dimension actions
  setDimension: (dimensionId: string) => void
  setTransitioning: (v: boolean) => void
  setTransitionProgress: (v: number) => void
  unlockDimension: (dimensionId: string) => void
  setPortals: (portals: PortalInstance[]) => void
  resetGame: () => void
}

const defaultPlayer: PlayerStats = {
  level: 1,
  xp: 0,
  xpToNext: 50,
  hp: 100,
  maxHp: 100,
  attack: 10,
  defense: 5,
  speed: 5,
  bombCount: 1,
  bombPower: 2,
}

const defaultQuests: Quest[] = [
  {
    id: 'q1',
    title: '初入翠林',
    description: '在翠林原野中消灭敌人，探索虫洞',
    objectives: [
      { id: 'q1_kill', description: '消灭5只史莱姆', type: 'kill', target: 'slime', current: 0, required: 5, completed: false },
      { id: 'q1_collect', description: '收集3个道具', type: 'collect', target: 'powerup', current: 0, required: 3, completed: false },
    ],
    rewards: { xp: 100 },
    completed: false,
    active: true,
  },
  {
    id: 'q2',
    title: '穿越虫洞',
    description: '找到并穿越一个虫洞，到达新的维度',
    objectives: [
      { id: 'q2_reach', description: '穿越虫洞', type: 'reach', target: 'portal', current: 0, required: 1, completed: false },
    ],
    rewards: { xp: 200 },
    completed: false,
    active: false,
  },
]

let notificationCounter = 0
let powerupCounter = 0

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  player: { ...defaultPlayer },
  worldSeed: Math.floor(Math.random() * 100000),
  monstersKilled: 0,

  // Dimension
  currentDimension: 'baroque',
  isTransitioning: false,
  transitionProgress: 0,
  unlockedDimensions: ['baroque'],
  portals: [],

  quests: defaultQuests.map(q => ({ ...q, objectives: q.objectives.map(o => ({ ...o })) })),
  activeQuestId: 'q1',
  powerups: [],
  shieldActive: false,
  shieldTimer: 0,
  canKickBombs: false,
  canRemoteDetonate: false,
  showInventory: false,
  showQuestLog: false,
  showSettings: false,
  dialogNpc: null,
  dialogText: '',
  selectedHeroId: 'bach',
  heroSelectOpen: false,
  fogOfWarEnabled: false,
  playerWorldPos: { x: 0, z: 0 },
  mp: 80,
  maxMp: 80,
  showMinimap: true,
  minimapMonsters: [],
  minimapMap: [],
  minimapSize: 210,
  minimapPortals: [],
  currentWave: 0,
  waveActive: false,
  waveMonstersKilled: 0,
  waveMonstersTotal: 0,
  waveAnnouncement: null as string | null,
  waveTimer: 0,
  abilities: [
    { key: 'w', name: '连锁爆破', icon: '💥', mana: 20, cooldown: 0, maxCooldown: 8, ready: true },
    { key: 'e', name: '冲刺', icon: '⚡', mana: 15, cooldown: 0, maxCooldown: 6, ready: true },
    { key: 'r', name: '超级炸弹', icon: '☄️', mana: 40, cooldown: 0, maxCooldown: 18, ready: true },
  ],
  comboCount: 0,
  comboTimer: 0,
  maxCombo: 0,
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  bombsPlaced: 0,
  powerupsCollected: 0,
  floatingDamages: [],
  cameraMode: '2.5d',
  cameraAngle: 0,
  cameraPitch: Math.PI / 4,
  cameraDistance: 18,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  musicEnabled: true,
  notifications: [],

  // Actions
  setPhase: (phase) => set({ phase }),
  updatePlayer: (partial) => set((s) => ({ player: { ...s.player, ...partial } })),
  addXp: (amount) => {
    const state = get()
    let newXp = state.player.xp + amount
    let newLevel = state.player.level
    let newXpToNext = state.player.xpToNext
    let newMaxHp = state.player.maxHp
    let newHp = state.player.hp
    let newAttack = state.player.attack
    let newDefense = state.player.defense

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext
      newLevel++
      newXpToNext = Math.floor(newXpToNext * 1.5)
      newMaxHp += 10
      newHp = newMaxHp
      newAttack += 2
      newDefense += 1
      audio.play('levelup')
      get().addNotification('升级! 等级 ' + newLevel, 'levelup')
    }

    set({
      player: {
        ...state.player,
        xp: newXp,
        level: newLevel,
        xpToNext: newXpToNext,
        maxHp: newMaxHp,
        hp: newHp,
        attack: newAttack,
        defense: newDefense,
      },
    })
  },
  takeDamage: (amount) => {
    const state = get()
    if (state.shieldActive) return
    const dmg = Math.max(1, amount - state.player.defense)
    const newHp = Math.max(0, state.player.hp - dmg)
    set({ player: { ...state.player, hp: newHp }, totalDamageTaken: state.totalDamageTaken + dmg })
    if (newHp <= 0) {
      set({ phase: 'gameover' })
    }
  },
  heal: (amount) => set((s) => ({
    player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + amount) },
  })),
  killMonster: () => set((s) => ({ monstersKilled: s.monstersKilled + 1 })),
  toggleInventory: () => set((s) => ({ showInventory: !s.showInventory })),
  toggleQuestLog: () => set((s) => ({ showQuestLog: !s.showQuestLog })),
  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
  setDialog: (npc, text) => set({ dialogNpc: npc, dialogText: text || '' }),
  activateQuest: (questId) => set((s) => ({
    activeQuestId: questId,
    quests: s.quests.map(q => q.id === questId ? { ...q, active: true } : q),
  })),
  updateQuestProgress: (questId, objectiveId, amount) => {
    set((s) => ({
      quests: s.quests.map(q => {
        if (q.id !== questId) return q
        const updatedObjectives = q.objectives.map(o => {
          if (o.id !== objectiveId) return o
          const newCurrent = Math.min(o.required, o.current + amount)
          return { ...o, current: newCurrent, completed: newCurrent >= o.required }
        })
        const allComplete = updatedObjectives.every(o => o.completed)
        if (allComplete && !q.completed) {
          setTimeout(() => {
            get().completeQuest(questId)
          }, 100)
        }
        return { ...q, objectives: updatedObjectives, completed: allComplete }
      }),
    }))
  },
  completeQuest: (questId) => {
    const state = get()
    const quest = state.quests.find(q => q.id === questId)
    if (!quest || quest.completed) return
    if (quest.rewards.xp) {
      get().addXp(quest.rewards.xp)
    }
    get().addNotification('任务完成: ' + quest.title, 'quest')
    set((s) => ({
      quests: s.quests.map(q => q.id === questId ? { ...q, completed: true } : q),
    }))
  },
  addNotification: (text, type) => {
    const id = 'n_' + (++notificationCounter)
    set((s) => ({
      notifications: [...s.notifications.slice(-10), { id, text, type, time: Date.now() }],
    }))
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) }))
    }, 4000)
  },
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter(n => n.id !== id),
  })),
  setSelectedHero: (id) => set({ selectedHeroId: id }),
  setHeroSelectOpen: (open) => set({ heroSelectOpen: open }),
  setFogOfWar: (enabled) => set({ fogOfWarEnabled: enabled }),
  setPlayerWorldPos: (x, z) => set({ playerWorldPos: { x, z } }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  setMinimapData: (map, monsters, player, portals) => {
    const update: Partial<GameState> = {
      minimapMap: map,
      minimapMonsters: monsters,
    }
    if (player) update.playerWorldPos = player
    if (portals) update.minimapPortals = portals
    set(update)
  },
  regenMana: (amount) => set((s) => ({
    mp: Math.min(s.maxMp, s.mp + amount),
  })),
  useMana: (amount) => {
    const state = get()
    if (state.mp < amount) return false
    set({ mp: state.mp - amount })
    return true
  },
  tickAbilityCooldowns: (dt) => set((s) => ({
    abilities: s.abilities.map(ab => ({
      ...ab,
      cooldown: Math.max(0, ab.cooldown - dt),
      ready: ab.cooldown - dt <= 0,
    })),
  })),
  setAbilityCooldown: (key, cooldown) => set((s) => ({
    abilities: s.abilities.map(ab => ab.key === key ? { ...ab, cooldown, ready: false } : ab),
  })),
  addDamageDealt: (amount) => set((s) => ({ totalDamageDealt: s.totalDamageDealt + amount })),
  addFloatingDamage: (x, y, z, text, color) => set((s) => ({
    floatingDamages: [...s.floatingDamages.slice(-20), { id: 'fd_' + Date.now() + '_' + Math.random().toString(16).slice(2), x, y, z, text, color }],
  })),
  addCombo: () => set((s) => {
    const comboCount = s.comboCount + 1
    return { comboCount, comboTimer: 3, maxCombo: Math.max(s.maxCombo, comboCount) }
  }),
  tickCombo: (dt) => set((s) => ({
    comboTimer: Math.max(0, s.comboTimer - dt),
    comboCount: s.comboTimer - dt <= 0 ? 0 : s.comboCount,
  })),
  startWave: (wave, total) => set({
    currentWave: wave, waveActive: true, waveMonstersKilled: 0,
    waveMonstersTotal: total, waveAnnouncement: '波次 ' + wave, waveTimer: 0,
  }),
  waveMonsterKilled: () => set((s) => {
    const waveMonstersKilled = s.waveMonstersKilled + 1
    return { waveMonstersKilled, waveActive: waveMonstersKilled < s.waveMonstersTotal }
  }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleCameraMode: () => set((s) => ({ cameraMode: s.cameraMode === '2.5d' ? '3d' : '2.5d' })),
  setCameraAngle: (a) => set({ cameraAngle: a }),
  setCameraPitch: (p) => set({ cameraPitch: Math.max(0.1, Math.min(Math.PI / 2, p)) }),
  setCameraDistance: (d) => set({ cameraDistance: Math.max(5, Math.min(55, d)) }),
  setMusicVolume: (v) => {
    set({ musicVolume: v })
    audio.setMusicVolume(v)
  },
  setSfxVolume: (v) => {
    set({ sfxVolume: v })
    audio.setSfxVolume(v)
  },
  toggleMusic: () => {
    set((s) => ({ musicEnabled: !s.musicEnabled }))
    audio.toggleMusic()
  },
  addPowerup: (x, z, type) => {
    const id = ++powerupCounter
    set((s) => ({
      powerups: [...s.powerups, { id, type, x, z, collected: false }],
      powerupsCollected: s.powerupsCollected,
    }))
  },
  collectPowerup: (id) => {
    const state = get()
    const powerup = state.powerups.find(p => p.id === id)
    if (!powerup || powerup.collected) return
    set((s) => ({
      powerups: s.powerups.map(p => p.id === id ? { ...p, collected: true } : p),
      powerupsCollected: s.powerupsCollected + 1,
    }))
    const labels: Record<PowerupType, string> = {
      bomb_up: '炸弹数量+1',
      fire_up: '爆炸范围+1',
      speed_up: '移动速度+0.5',
      shield: '护盾 3秒无敌',
      kick: '获得踢弹能力',
      remote: '获得遥控引爆炸弹',
    }
    switch (powerup.type) {
      case 'bomb_up':
        set((s) => ({ player: { ...s.player, bombCount: s.player.bombCount + 1 } }))
        break
      case 'fire_up':
        set((s) => ({ player: { ...s.player, bombPower: s.player.bombPower + 1 } }))
        break
      case 'speed_up':
        set((s) => ({ player: { ...s.player, speed: s.player.speed + 0.5 } }))
        break
      case 'shield':
        get().setShield(true, 3)
        break
      case 'kick':
        set({ canKickBombs: true })
        break
      case 'remote':
        set({ canRemoteDetonate: true })
        break
    }
    audio.play('item_pickup')
    get().addNotification(labels[powerup.type], 'info')
  },
  setShield: (active, duration) => {
    set({ shieldActive: active, shieldTimer: duration || 0 })
    if (active) {
      audio.play('shield_activate')
      if (duration && duration > 0) {
        setTimeout(() => {
          set({ shieldActive: false, shieldTimer: 0 })
        }, duration * 1000)
      }
    }
  },
  setCanKick: (v) => set({ canKickBombs: v }),
  setCanRemote: (v) => set({ canRemoteDetonate: v }),
  setDimension: (dimensionId) => set({ currentDimension: dimensionId }),
  setTransitioning: (v) => set({ isTransitioning: v }),
  setTransitionProgress: (v) => set({ transitionProgress: v }),
  unlockDimension: (dimensionId) => set((s) => ({
    unlockedDimensions: s.unlockedDimensions.includes(dimensionId)
      ? s.unlockedDimensions
      : [...s.unlockedDimensions, dimensionId],
  })),
  setPortals: (portals) => set({ portals }),
  resetGame: () => set({
    phase: 'playing',
    player: { ...defaultPlayer },
    monstersKilled: 0,
    currentDimension: 'baroque',
    isTransitioning: false,
    transitionProgress: 0,
    unlockedDimensions: ['baroque'],
    portals: [],
    quests: defaultQuests.map(q => ({ ...q, objectives: q.objectives.map(o => ({ ...o })) })),
    activeQuestId: 'q1',
    powerups: [],
    shieldActive: false,
    shieldTimer: 0,
    canKickBombs: false,
    canRemoteDetonate: false,
    showInventory: false,
    showQuestLog: false,
    showSettings: false,
    dialogNpc: null,
    dialogText: '',
    notifications: [],
    mp: 80,
    maxMp: 80,
    currentWave: 0,
    waveActive: false,
    waveMonstersKilled: 0,
    waveMonstersTotal: 0,
    waveAnnouncement: null as string | null,
    waveTimer: 0,
    abilities: [
      { key: 'w', name: '连锁爆破', icon: '💥', mana: 20, cooldown: 0, maxCooldown: 8, ready: true },
      { key: 'e', name: '冲刺', icon: '⚡', mana: 15, cooldown: 0, maxCooldown: 6, ready: true },
      { key: 'r', name: '超级炸弹', icon: '☄️', mana: 40, cooldown: 0, maxCooldown: 18, ready: true },
    ],
    comboCount: 0,
    comboTimer: 0,
    maxCombo: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    bombsPlaced: 0,
    powerupsCollected: 0,
    floatingDamages: [] as Array<{ id: string; x: number; y: number; z: number; text: string; color: string }>,
    worldSeed: Math.floor(Math.random() * 100000),
  }),
}))

