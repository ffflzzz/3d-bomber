import React, { useEffect, useCallback, Suspense } from 'react'
import { GameScene } from './game/GameScene'
import { HUD, MainMenu, PauseMenu, GameOver, QuestLog, HeroSelect, SettingsPanel } from './ui'
import { useGameStore } from './game/store'
import { audio } from './utils/audio'
import { detectDevice } from './platform/deviceProfile'
import { injectSafeAreaCSS } from './platform/safeArea'
import { createTouchControls, destroyTouchControls } from './platform/touchControls'
import './App.css'

export default function App() {
  const phase = useGameStore(s => s.phase)
  const setPhase = useGameStore(s => s.setPhase)
  const toggleQuestLog = useGameStore(s => s.toggleQuestLog)
  const toggleCameraMode = useGameStore(s => s.toggleCameraMode)
  const setFogOfWar = useGameStore(s => s.setFogOfWar)
  const fogOfWarEnabled = useGameStore(s => s.fogOfWarEnabled)
  const toggleMinimap = useGameStore(s => s.toggleMinimap)
  const minimapMap = useGameStore(s => s.minimapMap)
  const minimapMonsters = useGameStore(s => s.minimapMonsters)

  // Platform init: device detection + safe area
  useEffect(() => {
    const profile = detectDevice()
    injectSafeAreaCSS()
    if (profile.isMobile && screen.orientation) {
      (screen.orientation as unknown as { lock: (o: string) => Promise<void> }).lock('landscape').catch(() => {})
    }
    console.log('[App] Platform initialized:', profile.tier, '| Touch:', profile.isTouch)
  }, [])

  // Music follows game phase
  useEffect(() => {
    const heroId = useGameStore.getState().selectedHeroId
    if (phase === 'playing') {
      audio.playMusic(heroId)
    } else if (phase === 'menu') {
      audio.playMusic('hisaishi')
    }
  }, [phase])

  // Touch controls: only during playing/paused
  useEffect(() => {
    const profile = detectDevice()
    if (!profile.isTouch) return
    if (phase === 'playing' || phase === 'paused') {
      createTouchControls()
    } else {
      destroyTouchControls()
    }
  }, [phase])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (phase === 'playing') setPhase('paused')
      else if (phase === 'paused') setPhase('playing')
    }
    if (e.key === 'v' || e.key === 'V') {
      if (phase === 'playing') toggleCameraMode()
    }
    if (e.key === 'f' || e.key === 'F') {
      if (phase === 'playing') setFogOfWar(!fogOfWarEnabled)
    }
    if (e.key === 'm' || e.key === 'M') {
      if (phase === 'playing') toggleMinimap()
    }
    if (e.key === 'q' || e.key === 'Q') {
      if (phase === 'playing') toggleQuestLog()
    }
  }, [phase, setPhase, toggleQuestLog, toggleCameraMode, fogOfWarEnabled, setFogOfWar, toggleMinimap])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="game-app">
      <GameScene />
      <HUD map={minimapMap} monsters={minimapMonsters} />
      <MainMenu />
      <PauseMenu />
      <GameOver />
      <QuestLog />
      <HeroSelect />
      <SettingsPanel />
    </div>
  )
}