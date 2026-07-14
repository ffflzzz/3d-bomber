/**
 * 虚拟摇杆与触屏操控系统 (v2)
 * 
 * 核心原理：
 * - 创建一个 z-index=9999 的全屏透明容器覆盖在所有内容之上
 * - 容器本身 pointer-events:none
 * - 只有摇杆和按钮自身 pointer-events:auto
 * - 空白区域触摸事件穿透到下方 Canvas/HUD
 * - 摇杆支持多点触控，用 touchId 跟踪不同手指
 * - bomb/ability 按钮为 toggle 模式，touchstart=true, touchend=false
 */

export interface TouchState {
  moveX: number   // -1 ~ 1
  moveZ: number   // -1 ~ 1
  bomb: boolean
  ability: boolean
}

const JOYSTICK_DEAD_ZONE = 10
const JOYSTICK_MAX_RADIUS = 50

let _container: HTMLDivElement | null = null
let _joystickEl: HTMLDivElement | null = null
let _knobEl: HTMLDivElement | null = null
let _bombBtn: HTMLDivElement | null = null
let _abilityBtn: HTMLDivElement | null = null

let _touchState: TouchState = { moveX: 0, moveZ: 0, bomb: false, ability: false }
let _joystickTouchId: number | null = null
let _joystickOrigin = { x: 0, y: 0 }

export function getTouchState(): TouchState {
  return _touchState
}

function injectStyles() {
  if (document.getElementById('touch-controls-style')) return
  const style = document.createElement('style')
  style.id = 'touch-controls-style'
  style.textContent = `
    #tc-container {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 9999;
      touch-action: none;
      -webkit-touch-callout: none;
    }
    #tc-joystick {
      position: absolute;
      left: 20px;
      bottom: 30%;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: 2px solid rgba(255,255,255,0.18);
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #tc-knob {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      border: 2px solid rgba(255,255,255,0.4);
      transform: translate(0,0);
      will-change: transform;
    }
    .tc-btn {
      position: absolute;
      width: 68px;
      height: 68px;
      border-radius: 50%;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
      will-change: transform;
      transition: transform 0.08s;
    }
    .tc-btn:active {
      transform: scale(0.88);
    }
    #tc-bomb {
      right: 20px;
      bottom: 32%;
      background: rgba(255,80,40,0.3);
      border: 2.5px solid rgba(255,80,40,0.55);
      font-size: 28px;
    }
    #tc-ability {
      right: 100px;
      bottom: 18%;
      background: rgba(100,120,255,0.3);
      border: 2.5px solid rgba(100,120,255,0.55);
      font-size: 26px;
    }
    @media (min-width: 1025px) {
      #tc-container { display: none !important; }
    }
    @media (max-height: 420px) {
      #tc-joystick { bottom: 25%; width: 100px; height: 100px; }
      #tc-knob { width: 40px; height: 40px; }
      .tc-btn { width: 56px; height: 56px; }
      #tc-bomb { right: 14px; bottom: 26%; font-size: 22px; }
      #tc-ability { right: 80px; bottom: 14%; font-size: 20px; }
    }
  `
  document.head.appendChild(style)
}

// ─── 摇杆处理 ───

function onJoyStart(e: TouchEvent) {
  // 阻止默认行为防止页面滚动/缩放
  e.preventDefault()
  e.stopPropagation()
  if (_joystickTouchId !== null) return // 已有手指在用
  const t = e.changedTouches[0]
  _joystickTouchId = t.identifier
  _joystickOrigin = { x: t.clientX, y: t.clientY }
}

function onJoyMove(e: TouchEvent) {
  if (_joystickTouchId === null) return
  e.preventDefault()
  e.stopPropagation()
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i]
    if (t.identifier !== _joystickTouchId) continue

    let dx = t.clientX - _joystickOrigin.x
    let dy = t.clientY - _joystickOrigin.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < JOYSTICK_DEAD_ZONE) {
      _touchState.moveX = 0
      _touchState.moveZ = 0
      if (_knobEl) _knobEl.style.transform = 'translate(0px,0px)'
      return
    }

    const clamped = Math.min(dist, JOYSTICK_MAX_RADIUS)
    const angle = Math.atan2(dy, dx)
    dx = Math.cos(angle) * clamped
    dy = Math.sin(angle) * clamped

    _touchState.moveX = +(dx / JOYSTICK_MAX_RADIUS).toFixed(3)
    _touchState.moveZ = +(-dy / JOYSTICK_MAX_RADIUS).toFixed(3)

    if (_knobEl) _knobEl.style.transform = `translate(${dx}px,${dy}px)`
    break
  }
}

function onJoyEnd(e: TouchEvent) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === _joystickTouchId) {
      _joystickTouchId = null
      _touchState.moveX = 0
      _touchState.moveZ = 0
      if (_knobEl) _knobEl.style.transform = 'translate(0px,0px)'
      return
    }
  }
}

// ─── 导出接口 ───

export function createTouchControls() {
  // 不在触屏环境则跳过
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (!isTouchDevice) return
  if (_container) return

  injectStyles()

  _container = document.createElement('div')
  _container.id = 'tc-container'

  // 摇杆
  _joystickEl = document.createElement('div')
  _joystickEl.id = 'tc-joystick'
  _knobEl = document.createElement('div')
  _knobEl.id = 'tc-knob'
  _joystickEl.appendChild(_knobEl)

  // 炸弹
  _bombBtn = document.createElement('div')
  _bombBtn.id = 'tc-bomb'
  _bombBtn.className = 'tc-btn'
  _bombBtn.textContent = '💣'

  // 技能
  _abilityBtn = document.createElement('div')
  _abilityBtn.id = 'tc-ability'
  _abilityBtn.className = 'tc-btn'
  _abilityBtn.textContent = '⚡'

  _container.appendChild(_joystickEl)
  _container.appendChild(_bombBtn)
  _container.appendChild(_abilityBtn)
  document.body.appendChild(_container)

  // 摇杆事件 — 绑在摇杆元素上
  _joystickEl.addEventListener('touchstart', onJoyStart, { passive: false })
  // move/end 绑在容器上（手指可能滑出摇杆区域）
  _container.addEventListener('touchmove', onJoyMove, { passive: false })
  _container.addEventListener('touchend', onJoyEnd, { passive: false })
  _container.addEventListener('touchcancel', onJoyEnd, { passive: false })

  // 炸弹按钮
  _bombBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation()
    _touchState.bomb = true
  }, { passive: false })
  _bombBtn.addEventListener('touchend', (e) => {
    e.stopPropagation()
    _touchState.bomb = false
  }, { passive: false })
  _bombBtn.addEventListener('touchcancel', () => { _touchState.bomb = false })

  // 技能按钮
  _abilityBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); e.stopPropagation()
    _touchState.ability = true
  }, { passive: false })
  _abilityBtn.addEventListener('touchend', (e) => {
    e.stopPropagation()
    _touchState.ability = false
  }, { passive: false })
  _abilityBtn.addEventListener('touchcancel', () => { _touchState.ability = false })

  console.log('[TouchControls] Initialized (v2)')
}

export function destroyTouchControls() {
  if (_container) {
    _container.remove()
    _container = null
    _joystickEl = null
    _knobEl = null
    _bombBtn = null
    _abilityBtn = null
  }
}