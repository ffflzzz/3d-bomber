/**
 * 设备性能检测与分级系统
 * 按照《网页游戏跨端适配技术方案》实现
 */

export type QualityTier = 'low' | 'medium' | 'high'

export interface DeviceProfile {
  tier: QualityTier
  gpu: string
  maxTextureSize: number
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  cpuCores: number
  deviceMemory: number // GB
  isTouch: boolean
  networkType: string
  webglVersion: 1 | 2
  isMobile: boolean
  isWeChat: boolean
  isTablet: boolean
  // 渲染配置
  renderScale: number
  shadowEnabled: boolean
  postProcessing: boolean
  particleScale: number
  textureRes: number
  maxDrawCalls: number
  antialiasing: 'none' | 'fxaa' | 'msaa'
  targetFPS: number
}

let _profile: DeviceProfile | null = null

/** 生成分级配置（参数化的，避免重复定义） */
function buildTierConfigs(pixelRatio: number): Record<QualityTier, Partial<DeviceProfile>> {
  return {
    low: {
      renderScale: 0.75,
      shadowEnabled: false,
      postProcessing: false,
      particleScale: 0.5,
      textureRes: 512,
      maxDrawCalls: 50,
      antialiasing: 'none',
      targetFPS: 30,
    },
    medium: {
      renderScale: Math.min(pixelRatio, 2),
      shadowEnabled: true,
      postProcessing: true,
      particleScale: 0.75,
      textureRes: 1024,
      maxDrawCalls: 100,
      antialiasing: 'fxaa',
      targetFPS: 45,
    },
    high: {
      renderScale: pixelRatio,
      shadowEnabled: true,
      postProcessing: true,
      particleScale: 1.0,
      textureRes: 2048,
      maxDrawCalls: 200,
      antialiasing: 'msaa',
      targetFPS: 60,
    },
  }
}

export function detectDevice(): DeviceProfile {
  if (_profile) return _profile

  const canvas = document.createElement('canvas')
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  let webglVersion: 1 | 2 = 1

  try {
    gl = canvas.getContext('webgl2') as WebGL2RenderingContext
    if (gl) webglVersion = 2
    else {
      gl = canvas.getContext('webgl') as WebGLRenderingContext
      webglVersion = 1
    }
  } catch { gl = null }

  let gpu = 'unknown'
  let maxTextureSize = 2048
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown'
    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 3)
  const cpuCores = navigator.hardwareConcurrency || 2
  const deviceMemory = (navigator as unknown as Record<string, unknown>).deviceMemory as number || 4
  const isTouch = navigator.maxTouchPoints > 0
  const conn = (navigator as unknown as Record<string, unknown>).connection as Record<string, unknown> | undefined
  const networkType = (conn?.effectiveType as string) || 'unknown'

  const ua = navigator.userAgent.toLowerCase()
  const isMobile = /mobile|android|iphone|ipod/.test(ua)
  const isWeChat = /micromessenger/.test(ua)
  const isTablet = /ipad|tablet/.test(ua) || (isTouch && !isMobile && screenWidth >= 768)

  const gpuLower = gpu.toLowerCase()
  const isLowGPU = /mali-4|mali-3|adreno 3|adreno 2|powervr sgx|intel hd 3/.test(gpuLower)
  const isHighGPU = /rtx|gtx 1[6-9]|gtx 2|gtx 3|radeon rx|apple m|adreno 7|adreno 6[5-9]|mali-g7[2-9]|mali-g[89]/.test(gpuLower)

  let tier: QualityTier
  if (isLowGPU || deviceMemory <= 3 || pixelRatio <= 1.5 || cpuCores <= 2) {
    tier = 'low'
  } else if (isHighGPU && deviceMemory > 6 && webglVersion === 2) {
    tier = 'high'
  } else {
    tier = 'medium'
  }

  const configs = buildTierConfigs(pixelRatio)
  const cfg = configs[tier]

  _profile = {
    tier, gpu, maxTextureSize, screenWidth, screenHeight, pixelRatio,
    cpuCores, deviceMemory, isTouch, networkType, webglVersion,
    isMobile, isWeChat, isTablet,
    ...cfg,
  } as DeviceProfile

  console.log('[DeviceProfile] Tier:', tier, '| GPU:', gpu, '| Memory:', deviceMemory + 'GB', '| WebGL' + webglVersion)
  return _profile
}

export function getDeviceProfile(): DeviceProfile {
  return _profile || detectDevice()
}

/**
 * 运行时动态降级：帧率持续低于目标值5秒时降一档
 */
let _lowFPSSince = 0
export function checkDynamicDowngrade(currentFPS: number) {
  const profile = getDeviceProfile()
  if (currentFPS < profile.targetFPS * 0.8) {
    if (_lowFPSSince === 0) _lowFPSSince = Date.now()
    if (Date.now() - _lowFPSSince > 5000) {
      const configs = buildTierConfigs(profile.pixelRatio)
      if (profile.tier === 'high') {
        _profile = { ...profile, tier: 'medium', ...configs.medium } as DeviceProfile
        console.warn('[DeviceProfile] Dynamic downgrade: high -> medium')
      } else if (profile.tier === 'medium') {
        _profile = { ...profile, tier: 'low', ...configs.low } as DeviceProfile
        console.warn('[DeviceProfile] Dynamic downgrade: medium -> low')
      }
      _lowFPSSince = 0
    }
  } else {
    _lowFPSSince = 0
  }
}