import React from 'react'
import { useGameStore } from '../../game/store'
import { audio } from '../../utils/audio'
import './MainMenu.css'

export function MainMenu() {
  const phase = useGameStore(s => s.phase)
  const setHeroSelectOpen = useGameStore(s => s.setHeroSelectOpen)
  const setPhase = useGameStore(s => s.setPhase)
  const resetGame = useGameStore(s => s.resetGame)

  if (phase !== 'menu') return null

  const handleContinue = () => {
    audio.play('menu_click')
    resetGame()
  }

  const handleSettings = () => {
    audio.play('menu_click')
    // Start game with settings panel open
    resetGame()
    useGameStore.getState().toggleSettings()
  }

  return (
    <div className="main-menu">
      <div className="menu-backdrop" />
      <div className="menu-content">
        <h1 className="menu-title">
          <span className="title-bomb">💣</span>
          <span className="title-text">旋律炸弹人</span>
        </h1>
        <p className="menu-subtitle">音乐大师 · 平行宇宙 · 虫洞穿越</p>

        <div className="menu-features">
          <div className="menu-feature">
            <span className="menu-feat-icon">🎻</span>
            <span className="menu-feat-text">12位大师</span>
          </div>
          <div className="menu-feature">
            <span className="menu-feat-icon">🌊</span>
            <span className="menu-feat-text">波次挑战</span>
          </div>
          <div className="menu-feature">
            <span className="menu-feat-icon">💥</span>
            <span className="menu-feat-text">技能连击</span>
          </div>
          <div className="menu-feature">
            <span className="menu-feat-icon">🗺</span>
            <span className="menu-feat-text">3D世界</span>
          </div>
        </div>

        <div className="menu-buttons">
          <button className="menu-btn menu-btn-primary" onClick={() => { audio.play('menu_click'); setHeroSelectOpen(true) }}>
            选择英雄
          </button>
          <button className="menu-btn" onClick={handleContinue}>
            快速开始
          </button>
        </div>
        <div className="menu-footer">
          <span>abcyesno.cn</span>
          <span>Three.js + Rapier + bitECS</span>
        </div>
      </div>
    </div>
  )
}

