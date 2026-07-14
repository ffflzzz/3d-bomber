import React from 'react'
import { useGameStore } from '../../game/store'
import './PauseMenu.css'

export function PauseMenu() {
  const phase = useGameStore(s => s.phase)
  const setPhase = useGameStore(s => s.setPhase)
  const resetGame = useGameStore(s => s.resetGame)

  if (phase !== 'paused') return null

  return (
    <div className="pause-menu">
      <div className="pause-backdrop" />
      <div className="pause-content">
        <h2 className="pause-title">暂停</h2>
        <div className="pause-keys">
          <div className="pause-key-row"><kbd>W A S D</kbd><span>移动</span></div>
          <div className="pause-key-row"><kbd>空格</kbd><span>放炸弹</span></div>
          <div className="pause-key-row"><kbd>J</kbd><span>近战攻击</span></div>
          <div className="pause-key-row"><kbd>W / E / R</kbd><span>技能</span></div>
          <div className="pause-key-row"><kbd>V</kbd><span>切换视角</span></div>
          <div className="pause-key-row"><kbd>F</kbd><span>战争迷雾</span></div>
          <div className="pause-key-row"><kbd>M</kbd><span>小地图</span></div>
          <div className="pause-key-row"><kbd>Q</kbd><span>任务日志</span></div>
          <div className="pause-key-row"><kbd>滚轮</kbd><span>缩放</span></div>
        </div>
        <div className="pause-buttons">
          <button className="pause-btn primary" onClick={() => setPhase('playing')}>
            继续游戏
          </button>
          <button className="pause-btn" onClick={resetGame}>
            重新开始
          </button>
          <button className="pause-btn" onClick={() => setPhase('menu')}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}
