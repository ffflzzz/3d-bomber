import React from 'react'
import { useGameStore } from '../../game/store'
import './QuestLog.css'

export function QuestLog() {
  const showQuestLog = useGameStore(s => s.showQuestLog)
  const quests = useGameStore(s => s.quests)
  const toggleQuestLog = useGameStore(s => s.toggleQuestLog)

  if (!showQuestLog) return null

  return (
    <div className="quest-log">
      <div className="quest-log-header">
        <h3>任务日志</h3>
        <button className="quest-close" onClick={toggleQuestLog}>✕</button>
      </div>
      <div className="quest-list">
        {quests.map(quest => (
          <div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''} ${quest.active ? 'active' : ''}`}>
            <div className="quest-title">
              {quest.completed ? '✓' : quest.active ? '🔶' : '🔹'} {quest.title}
            </div>
            <p className="quest-desc">{quest.description}</p>
            <div className="quest-objectives">
              {quest.objectives.map(obj => (
                <div key={obj.id} className={`quest-obj ${obj.completed ? 'done' : ''}`}>
                  <span className="quest-obj-check">{obj.completed ? '◆' : '◇'}</span>
                  <span>{obj.description}: {obj.current}/{obj.required}</span>
                </div>
              ))}
            </div>
            {quest.rewards.xp && (
              <div className="quest-reward">奖励: {quest.rewards.xp} XP</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}