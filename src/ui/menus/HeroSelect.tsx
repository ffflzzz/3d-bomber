import React, { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../game/store'
import { HEROES, type HeroDef } from '../../game/heroes'
import { audio } from '../../utils/audio'
import './HeroSelect.css'

export function HeroSelect() {
  const phase = useGameStore(s => s.phase)
  const heroSelectOpen = useGameStore(s => s.heroSelectOpen)
  const selectedHeroId = useGameStore(s => s.selectedHeroId)
  const setSelectedHero = useGameStore(s => s.setSelectedHero)
  const setHeroSelectOpen = useGameStore(s => s.setHeroSelectOpen)
  const resetGame = useGameStore(s => s.resetGame)
  const setPhase = useGameStore(s => s.setPhase)

  const [hoveredHero, setHoveredHero] = useState<HeroDef | null>(HEROES.find(h => h.id === selectedHeroId) || HEROES[0])
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setVideoError(false)
  }, [hoveredHero?.id])

  if (phase !== 'menu' || !heroSelectOpen) return null

  const handleConfirm = () => {
    audio.play('menu_click')
    setSelectedHero(hoveredHero?.id || 'bomber')
    setHeroSelectOpen(false)
    resetGame()
  }

  const handleBack = () => {
    audio.play('menu_click')
    setHeroSelectOpen(false)
  }

  const hero = hoveredHero || HEROES[0]
  const videoPath = `/hero_videos/${hero.id}.mp4`

  return (
    <div className="hero-select">
      <div className="hero-select-backdrop" />

      {/* Top banner */}
      <div className="hs-banner">
        <h1 className="hs-title">选择你的英雄</h1>
        <p className="hs-subtitle">CHOOSE YOUR HERO</p>
      </div>

      <div className="hs-layout">
        {/* Left: Hero Grid */}
        <div className="hs-hero-grid">
          {HEROES.map((h) => (
            <div
              key={h.id}
              className={`hs-hero-card ${selectedHeroId === h.id ? 'selected' : ''} ${hoveredHero?.id === h.id ? 'hovered' : ''}`}
              onClick={() => { setSelectedHero(h.id); setHoveredHero(h); audio.play('menu_click') }}
              onMouseEnter={() => setHoveredHero(h)}
              style={{ '--hero-color': h.color } as React.CSSProperties}
            >
              <div className="hs-card-portrait">
                <img src={h.texturePath} alt={h.name} className="hs-card-img" />
                <span className="hs-card-emoji">{h.emoji}</span>
              </div>
              <div className="hs-card-name">{h.name}</div>
            </div>
          ))}
        </div>

        {/* Center: Hero Preview with Video */}
        <div className="hs-preview">
          <div className="hs-preview-model" style={{ borderColor: hero.color }}>
            {!videoError ? (
              <video
                ref={videoRef}
                src={videoPath}
                className="hs-preview-video"
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
              />
            ) : (
              <img src={hero.texturePath} alt={hero.name} className="hs-preview-img" />
            )}
          </div>
          <h2 className="hs-hero-name" style={{ color: hero.color }}>{hero.name}</h2>
          <p className="hs-hero-title">{hero.title}</p>
        </div>

        {/* Right: Hero Info */}
        <div className="hs-info">
          <div className="hs-info-section">
            <h3 className="hs-info-label">属性</h3>
            <div className="hs-stats">
              {[
                { label: '生命', value: hero.stats.hp, max: 150, color: '#4caf50' },
                { label: '攻击', value: hero.stats.attack, max: 18, color: '#ef5350' },
                { label: '防御', value: hero.stats.defense, max: 10, color: '#42a5f5' },
                { label: '速度', value: hero.stats.speed, max: 8, color: '#ffd54f' },
                { label: '炸弹', value: hero.stats.bombCount, max: 2, color: '#ff9800' },
                { label: '威力', value: hero.stats.bombPower, max: 2, color: '#e040fb' },
              ].map(s => (
                <div key={s.label} className="hs-stat-row">
                  <span className="hs-stat-label">{s.label}</span>
                  <div className="hs-stat-bar">
                    <div className="hs-stat-fill" style={{ width: `${(s.value / s.max) * 100}%`, background: s.color }} />
                  </div>
                  <span className="hs-stat-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hs-info-section">
            <h3 className="hs-info-label">技能</h3>
            <div className="hs-abilities">
              {hero.abilities.map(a => (
                <div key={a.key} className="hs-ability">
                  <div className="hs-ab-icon">{a.icon}</div>
                  <div className="hs-ab-info">
                    <span className="hs-ab-name">{a.key} - {a.name}</span>
                    <span className="hs-ab-desc">{a.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hs-info-section">
            <h3 className="hs-info-label">被动</h3>
            <p className="hs-passive">{hero.passive}</p>
          </div>

          <p className="hs-description">{hero.description}</p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="hs-buttons">
        <button className="hs-btn hs-btn-back" onClick={handleBack}>
          ← 返回
        </button>
        <button className="hs-btn hs-btn-confirm" onClick={handleConfirm} style={{ borderColor: hero.color }}>
          确认选择
        </button>
      </div>
    </div>
  )
}
