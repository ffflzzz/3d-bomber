import React from 'react'
import { useGameStore } from '../../game/store'
import './GameOver.css'

export function GameOver() {
  const phase = useGameStore(s => s.phase)
  const player = useGameStore(s => s.player)
  const monstersKilled = useGameStore(s => s.monstersKilled)
  const resetGame = useGameStore(s => s.resetGame)
  const setPhase = useGameStore(s => s.setPhase)
  const quests = useGameStore(s => s.quests)
  const currentWave = useGameStore(s => s.currentWave)
  const maxCombo = useGameStore(s => s.maxCombo)
  const totalDamageDealt = useGameStore(s => s.totalDamageDealt)
  const totalDamageTaken = useGameStore(s => s.totalDamageTaken)
  const bombsPlaced = useGameStore(s => s.bombsPlaced)
  const powerupsCollected = useGameStore(s => s.powerupsCollected)

  if (phase !== 'gameover') return null

  const completedQuests = quests.filter(q => q.completed).length
  const totalQuests = quests.length

  return (
    <div className="gameover">
      <div className="gameover-backdrop" />
      <div className="gameover-content">
        <h1 className="gameover-title">游戏结束</h1>

        <div className="gameover-stats-grid">
          <div className="gameover-stat">
            <span className="stat-label">等级</span>
            <span className="stat-value">{player.level}</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-label">击杀</span>
            <span className="stat-value">{monstersKilled}</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-label">到达波次</span>
            <span className="stat-value">{currentWave}</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-label">最高连击</span>
            <span className="stat-value">{maxCombo}</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-label">任务完成</span>
            <span className="stat-value">{completedQuests}/{totalQuests}</span>
          </div>
          <div className="gameover-stat">
            <span className="stat-label">炸弹威力</span>
            <span className="stat-value">{player.bombPower}</span>
          </div>
        </div>

        <div className="gameover-detail-stats">
          <div className="detail-row">
            <span className="detail-label">总伤害输出</span>
            <span className="detail-value">{totalDamageDealt.toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">总伤害承受</span>
            <span className="detail-value">{totalDamageTaken.toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="stat-label">炸弹放置</span>
            <span className="detail-value">{bombsPlaced}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">道具收集</span>
            <span className="detail-value">{powerupsCollected}</span>
          </div>
        </div>

        <div className="gameover-buttons">
          <button className="gameover-btn primary" onClick={resetGame}>
            再来一次
          </button>
          <button className="gameover-btn" onClick={() => setPhase('menu')}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}
