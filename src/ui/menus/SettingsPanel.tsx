import React from 'react'
import { useGameStore } from '../../game/store'
import './SettingsPanel.css'

export function SettingsPanel() {
  const showSettings = useGameStore(s => s.showSettings)
  const toggleSettings = useGameStore(s => s.toggleSettings)
  const musicVolume = useGameStore(s => s.musicVolume)
  const sfxVolume = useGameStore(s => s.sfxVolume)
  const setMusicVolume = useGameStore(s => s.setMusicVolume)
  const setSfxVolume = useGameStore(s => s.setSfxVolume)
  const phase = useGameStore(s => s.phase)

  if (!showSettings || phase !== 'playing') return null

  return (
    <div className="settings-panel">
      <div className="settings-backdrop" onClick={toggleSettings} />
      <div className="settings-content">
        <h2 className="settings-title">设置</h2>

        <div className="settings-section">
          <h3 className="settings-label">音频</h3>
          <div className="settings-row">
            <span className="settings-row-label">音乐音量</span>
            <input type="range" min="0" max="1" step="0.05"
              value={musicVolume}
              onChange={e => setMusicVolume(parseFloat(e.target.value))}
              className="settings-slider" />
            <span className="settings-value">{Math.round(musicVolume * 100)}%</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">音效音量</span>
            <input type="range" min="0" max="1" step="0.05"
              value={sfxVolume}
              onChange={e => setSfxVolume(parseFloat(e.target.value))}
              className="settings-slider" />
            <span className="settings-value">{Math.round(sfxVolume * 100)}%</span>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-label">操作指南</h3>
          <div className="settings-controls">
            <div className="control-row"><kbd>W A S D</kbd> <span>移动</span></div>
            <div className="control-row"><kbd>空格</kbd> <span>放置炸弹</span></div>
            <div className="control-row"><kbd>J</kbd> <span>近战攻击</span></div>
            <div className="control-row"><kbd>W</kbd> <span>技能1 - 连环爆破</span></div>
            <div className="control-row"><kbd>E</kbd> <span>技能2 - 冲刺护盾</span></div>
            <div className="control-row"><kbd>R</kbd> <span>终极技能 - 超级炸弹</span></div>
            <div className="control-row"><kbd>V</kbd> <span>切换 2.5D/3D 视角</span></div>
            <div className="control-row"><kbd>F</kbd> <span>战争迷雾开关</span></div>
            <div className="control-row"><kbd>M</kbd> <span>小地图开关</span></div>
            <div className="control-row"><kbd>Q</kbd> <span>任务日志</span></div>
            <div className="control-row"><kbd>ESC</kbd> <span>暂停/继续</span></div>
            <div className="control-row"><kbd>鼠标滚轮</kbd> <span>缩放</span></div>
            <div className="control-row"><kbd>右键拖拽</kbd> <span>3D模式旋转视角</span></div>
          </div>
        </div>

        <button className="settings-close-btn" onClick={toggleSettings}>关闭</button>
      </div>
    </div>
  )
}
