/**
 * 平台抽象层 - 统一 H5 / 微信小游戏 / 抖音小游戏的差异
 * 按照《网页游戏跨端适配技术方案》第7章实现
 */

export interface IPlatform {
  /** 创建画布 */
  createCanvas(): HTMLCanvasElement | OffscreenCanvas
  /** 加载图片 */
  loadImage(src: string): Promise<HTMLImageElement | ImageBitmap>
  /** 存储 */
  storage: {
    get(key: string): string | null
    set(key: string, value: string): void
    remove(key: string): void
  }
  /** 网络 */
  network: {
    get(url: string): Promise<Response>
    post(url: string, data: unknown): Promise<Response>
  }
  /** 平台名称 */
  name: string
  /** 是否触屏 */
  isTouch: boolean
}

/** H5 标准平台实现 */
class H5Platform implements IPlatform {
  name = 'h5'
  isTouch = navigator.maxTouchPoints > 0

  createCanvas(): HTMLCanvasElement {
    return document.createElement('canvas')
  }

  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  storage = {
    get: (key: string) => localStorage.getItem(key),
    set: (key: string, value: string) => localStorage.setItem(key, value),
    remove: (key: string) => localStorage.removeItem(key),
  }

  network = {
    get: (url: string) => fetch(url),
    post: (url: string, data: unknown) =>
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  }
}

/** 微信小游戏平台实现（预留接口） */
class WeChatPlatform implements IPlatform {
  name = 'wechat'
  isTouch = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private wx: any = (window as unknown as Record<string, unknown>).wx

  createCanvas() {
    return this.wx.createCanvas() as HTMLCanvasElement
  }

  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = this.wx.createImage()
      img.onload = () => resolve(img as HTMLImageElement)
      img.onerror = reject
      img.src = src
    })
  }

  storage = {
    get: (key: string) => this.wx.getStorageSync(key) || null,
    set: (key: string, value: string) => this.wx.setStorageSync(key, value),
    remove: (key: string) => this.wx.removeStorageSync(key),
  }

  network = {
    get: (url: string) =>
      new Promise<Response>((resolve, reject) => {
        this.wx.request({
          url, method: 'GET',
          success: (res: { data: string; statusCode: number }) =>
            resolve(new Response(res.data, { status: res.statusCode })),
          fail: reject,
        })
      }),
    post: (url: string, data: unknown) =>
      new Promise<Response>((resolve, reject) => {
        this.wx.request({
          url, method: 'POST', data,
          success: (res: { data: string; statusCode: number }) =>
            resolve(new Response(res.data, { status: res.statusCode })),
          fail: reject,
        })
      }),
  }
}

function detectPlatform(): IPlatform {
  const ua = navigator.userAgent.toLowerCase()
  if (/micromessenger/.test(ua) && typeof (window as unknown as Record<string, unknown>).wx !== 'undefined') {
    return new WeChatPlatform()
  }
  return new H5Platform()
}

export const platform: IPlatform = detectPlatform()
