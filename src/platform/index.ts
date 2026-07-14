export { detectDevice, getDeviceProfile, checkDynamicDowngrade } from './deviceProfile'
export type { DeviceProfile, QualityTier } from './deviceProfile'

export { platform } from './platformAdapter'
export type { IPlatform } from './platformAdapter'

export { detectSafeArea, getSafeArea, injectSafeAreaCSS } from './safeArea'
export type { SafeArea } from './safeArea'

export { createTouchControls, destroyTouchControls, getTouchState } from './touchControls'
export type { TouchState } from './touchControls'