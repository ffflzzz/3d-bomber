/**
 * 安全区检测 - 处理刘海屏、圆角、底部导航条
 * 按照《网页游戏跨端适配技术方案》第4.1章实现
 */

export interface SafeArea {
  top: number
  bottom: number
  left: number
  right: number
}

let _safeArea: SafeArea = { top: 0, bottom: 0, left: 0, right: 0 }

export function detectSafeArea(): SafeArea {
  // 使用 CSS env() 获取安全区（iOS 11+、Android WebView）
  const style = getComputedStyle(document.documentElement)

  const parse = (val: string): number => {
    const num = parseInt(val, 10)
    return isNaN(num) ? 0 : num
  }

  _safeArea = {
    top: parse(style.getPropertyValue('env(safe-area-inset-top)')) || parse(style.getPropertyValue('--sat')) || 0,
    bottom: parse(style.getPropertyValue('env(safe-area-inset-bottom)')) || parse(style.getPropertyValue('--sab')) || 0,
    left: parse(style.getPropertyValue('env(safe-area-inset-left)')) || parse(style.getPropertyValue('--sal')) || 0,
    right: parse(style.getPropertyValue('env(safe-area-inset-right)')) || parse(style.getPropertyValue('--sar')) || 0,
  }

  // 兜底：已知设备的固定值
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) {
    const h = window.screen.height
    if (h >= 812) { // iPhone X+
      if (_safeArea.top === 0) _safeArea.top = 44
      if (_safeArea.bottom === 0) _safeArea.bottom = 34
    }
  }

  console.log('[SafeArea]', _safeArea)
  return _safeArea
}

export function getSafeArea(): SafeArea {
  return _safeArea
}

/**
 * 将 CSS 变量注入 :root，供 CSS 使用
 */
export function injectSafeAreaCSS() {
  const sa = detectSafeArea()
  const root = document.documentElement
  root.style.setProperty('--safe-top', sa.top + 'px')
  root.style.setProperty('--safe-bottom', sa.bottom + 'px')
  root.style.setProperty('--safe-left', sa.left + 'px')
  root.style.setProperty('--safe-right', sa.right + 'px')
}
