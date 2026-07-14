import React, { useState, useEffect } from 'react'
import { DIMENSIONS } from '../../game/dimensions/configs'
import { useGameStore } from '../../game/store'
import { Minimap } from './Minimap'
import './HUD.css'

interface HUDProps {
  map?: number[][]
  monsters?: Array<{ x: number; z: number; type: number; alive: boolean }>
}

export function HUD({ map = [], monsters = [] }: HUDProps) {
  const player = useGameStore(s => s.player)
  const phase = useGameStore(s => s.phase)
  const notifications = useGameStore(s => s.notifications)
  const monstersKilled = useGameStore(s => s.monstersKilled)
  const cameraMode = useGameStore(s => s.cameraMode)
  const toggleCameraMode = useGameStore(s => s.toggleCameraMode)
  const fogOfWarEnabled = useGameStore(s => s.fogOfWarEnabled)
  const setFogOfWar = useGameStore(s => s.setFogOfWar)
  const playerWorldPos = useGameStore(s => s.playerWorldPos)
  const currentDimension = useGameStore(s => s.currentDimension)
  const unlockedDimensions = useGameStore(s => s.unlockedDimensions)
  const isTransitioning = useGameStore(s => s.isTransitioning)
  const dim = DIMENSIONS[currentDimension] || DIMENSIONS.verdant

  const [gameTime, setGameTime] = useState(0)
  const [dayNight, setDayNight] = useState<'day' | 'night'>('day')

  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      setGameTime(t => {
        const nt = t + 1
        setDayNight(Math.floor(nt / 120) % 2 === 0 ? 'day' : 'night')
        return nt
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  if (phase !== 'playing') return null

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const hpPercent = (player.hp / player.maxHp) * 100
  const mpPercent = 100
  const xpPercent = (player.xp / player.xpToNext) * 100

  return (
    <div className="dota-hud">
      {/* ═══════════════════════════════════════════════════
          TOP BAR - Score + Timer + Team Info
          ═══════════════════════════════════════════════════ */}
      <div className="dota-topbar">
        <div className="topbar-team topbar-radiant">
          <div className="team-score">{Math.max(0, monstersKilled)}</div>
          <div className="team-name">RADIANT</div>
        </div>
        <div className="topbar-center-area">
          <div className="topbar-dimension" style={{color: dim.accentColor}}>{dim.name}</div>
          <div className="topbar-timer">
            <div className={`daynight-indicator ${dayNight}`}>
              <span className="daynight-icon">{dayNight === 'day' ? '☀' : '🌙'}</span>
            </div>
            <span className="timer-text">{formatTime(gameTime)}</span>
          </div>
          <div className="topbar-kills">
            <span className="kill-num kill-radiant">{monstersKilled}</span>
            <span className="kill-separator">/</span>
            <span className="kill-num kill-dire">0</span>
          </div>
        </div>
        <div className="topbar-team topbar-dire">
          <div className="team-score">0</div>
          <div className="team-name">DIRE</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          KILL FEED (top-right)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-killfeed">
        {notifications.slice(-5).map(n => (
          <div key={n.id} className={`killfeed-entry killfeed-${n.type}`}>
            <span className="killfeed-text">{n.text}</span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          HERO PORTRAIT + STATS (left side, above minimap)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-hero-area">
        {/* Hero Portrait */}
        <div className="hero-portrait-container">
          <div className="hero-portrait">
            <div className="hero-portrait-img">💣</div>
            <div className="hero-level-badge">{player.level}</div>
          </div>
          {/* Buff/Debuff bar */}
          <div className="hero-buffs">
            <div className="buff-icon buff-active" title="Speed Boost">⚡</div>
            <div className="buff-icon buff-empty" />
            <div className="buff-icon buff-empty" />
            <div className="buff-icon buff-empty" />
          </div>
        </div>

        {/* HP / MP / XP Bars */}
        <div className="hero-bars-container">
          {/* HP Bar */}
          <div className="hero-bar-group">
            <div className="bar-outer hp-outer">
              <div className="bar-inner hp-inner" style={{ width: `${hpPercent}%` }} />
              <div className="bar-regen hp-regen" />
              <span className="bar-value">{Math.ceil(player.hp)} / {player.maxHp}</span>
            </div>
            <span className="bar-label-text">HEALTH</span>
          </div>
          {/* MP Bar */}
          <div className="hero-bar-group">
            <div className="bar-outer mp-outer">
              <div className="bar-inner mp-inner" style={{ width: `${mpPercent}%` }} />
              <span className="bar-value">100 / 100</span>
            </div>
            <span className="bar-label-text">MANA</span>
          </div>
          {/* XP Bar */}
          <div className="hero-bar-group xp-group">
            <div className="bar-outer xp-outer">
              <div className="bar-inner xp-inner" style={{ width: `${xpPercent}%` }} />
              <span className="bar-value xp-value">{Math.floor(player.xp)} / {player.xpToNext}</span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="hero-stats-panel">
          <div className="stat-row">
            <span className="stat-icon-str">⚔</span>
            <span className="stat-num">{player.attack}</span>
          </div>
          <div className="stat-row">
            <span className="stat-icon-agi">🛡</span>
            <span className="stat-num">{player.defense}</span>
          </div>
          <div className="stat-row">
            <span className="stat-icon-int">💨</span>
            <span className="stat-num">{player.speed.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MINIMAP (bottom-left, Dota exact layout)
          ═══════════════════════════════════════════════════ */}
      <Minimap map={map} monsters={monsters} playerPos={playerWorldPos} />

      {/* ═══════════════════════════════════════════════════
          ABILITY BAR (bottom-center)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-ability-area">
        {/* Auto-attack toggle */}
        <div className="autoattack-toggle">
          <div className="aa-icon active" title="Auto-Attack">⚔</div>
        </div>

        {/* Ability Slots */}
        <div className="ability-slots">
          {[
            { key: 'Q', icon: '💣', name: 'Bomb', learned: true, level: player.bombPower, cd: 0, maxCd: 3, mana: 0 },
            { key: 'W', icon: '💥', name: 'Detonate', learned: true, level: 1, cd: 0, maxCd: 0, mana: 0 },
            { key: 'E', icon: '🛡', name: 'Shield', learned: false, level: 0, cd: 0, maxCd: 10, mana: 50 },
            { key: 'D', icon: '🏃', name: 'Dash', learned: false, level: 0, cd: 0, maxCd: 8, mana: 30 },
            { key: 'F', icon: '🔥', name: 'Fire', learned: false, level: 0, cd: 0, maxCd: 12, mana: 60 },
            { key: 'R', icon: '⚡', name: 'Ultimate', learned: false, level: 0, cd: 0, maxCd: 60, mana: 100, isUlt: true },
          ].map((ability, i) => (
            <div key={i} className={`ability-slot ${ability.learned ? 'learned' : 'unlearned'} ${ability.isUlt ? 'ultimate' : ''}`}>
              <div className="ability-icon-bg">
                <span className="ability-icon-text">{ability.icon}</span>
              </div>
              {ability.cd > 0 && (
                <div className="ability-cooldown">
                  <span className="cd-text">{ability.cd}</span>
                </div>
              )}
              {ability.learned && ability.level > 0 && (
                <div className="ability-level-pips">
                  {Array.from({ length: ability.level }, (_, j) => (
                    <div key={j} className="level-pip filled" />
                  ))}
                  {Array.from({ length: 4 - ability.level }, (_, j) => (
                    <div key={j} className="level-pip empty" />
                  ))}
                </div>
              )}
              <div className="ability-hotkey">{ability.key}</div>
              <div className="ability-manacost">{ability.mana > 0 ? ability.mana : ''}</div>
            </div>
          ))}
        </div>

        {/* Level-up button */}
        <div className="levelup-btn" title="Level Up (Ctrl+ability)">
          <span>⬆</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          INVENTORY + BACKPACK (bottom-right of center)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-inventory-area">
        {/* Main inventory: 2 rows x 3 cols */}
        <div className="inventory-grid">
          {['🧪', '', '', '', '', ''].map((item, i) => (
            <div key={i} className={`inv-slot ${item ? 'has-item' : ''}`}>
              {item && <span className="inv-icon">{item}</span>}
              <div className="inv-hotkey">{['Z', 'X', 'C', 'V', 'B', 'N'][i]}</div>
            </div>
          ))}
        </div>

        {/* Backpack: 3 slots */}
        <div className="backpack-grid">
          <div className="bp-label">BACKPACK</div>
          <div className="bp-slots">
            {[0, 1, 2].map(i => (
              <div key={i} className="bp-slot" />
            ))}
          </div>
        </div>

        {/* Neutral item slot */}
        <div className="neutral-slot">
          <div className="neutral-icon">💎</div>
          <span className="neutral-label">NEUTRAL</span>
        </div>

        {/* TP scroll slot */}
        <div className="tp-slot">
          <div className="tp-icon">📜</div>
          <span className="tp-label">TP</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SHOP BUTTON (near minimap)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-shop-btn">
        <div className="shop-icon">🏪</div>
        <span className="shop-label">SHOP</span>
      </div>

      {/* ═══════════════════════════════════════════════════
          SCAN / COURIER / QUICKBUY (near minimap)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-minimap-buttons">
        <button className="minimap-action-btn" title="Scan">📡</button>
        <button className="minimap-action-btn" title="Courier">🐦</button>
        <button className="minimap-action-btn" title="Select Hero">👤</button>
      </div>

      {/* ═══════════════════════════════════════════════════
          TOGGLE BUTTONS (top-right of minimap area)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-toggles">
        <button className={`dota-toggle ${fogOfWarEnabled ? 'active' : ''}`}
                onClick={() => setFogOfWar(!fogOfWarEnabled)} title="F - Fog of War">
          🌫
        </button>
        <button className="dota-toggle" onClick={toggleCameraMode} title="V - Camera">
          {cameraMode === '2.5d' ? '🎥' : '🌐'}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          QUICKBUY (bottom-center, left of ability bar)
          ═══════════════════════════════════════════════════ */}
      <div className="dota-quickbuy">
        <div className="qb-label">QUICKBUY</div>
        <div className="qb-items">
          <div className="qb-item">🧪</div>
          <span className="qb-cost">50g</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          GOLD DISPLAY
          ═══════════════════════════════════════════════════ */}
      <div className="dota-gold">
        <span className="gold-icon">💰</span>
        <span className="gold-amount">{monstersKilled * 15 + 200}</span>
      </div>
    </div>
  )
}


