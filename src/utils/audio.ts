import { Howl } from 'howler'

/**
 * 英雄音乐风格配置
 * 每位英雄有独特的音阶、节奏和音色，反映其音乐风格
 */
interface MusicStyle {
  name: string
  /** 音阶频率 (Hz)，相对于根音的倍率 */
  scale: number[]
  /** 根音频率 */
  baseFreq: number
  /** BPM */
  bpm: number
  /** 音色类型 */
  timbre: 'sine' | 'triangle' | 'sawtooth' | 'square'
  /** 和弦进行（音阶索引） */
  chords: number[][]
  /** 旋律音阶索引序列 */
  melodyPattern: number[]
  /** 装饰音密度 0-1 */
  ornamentDensity: number
  /** 低音模式 */
  bassPattern: number[]
}

const MUSIC_STYLES: Record<string, MusicStyle> = {
  // 巴赫 — 管风琴复调，D小调，庄严
  bach: {
    name: '赋格', baseFreq: 146.83, bpm: 72, timbre: 'triangle',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [0, 2, 4]],
    melodyPattern: [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 2, 5, 4, 7, 5, 0],
    ornamentDensity: 0.3, bassPattern: [0, 0, 3, 3, 4, 4, 0, 0],
  },
  // 维瓦尔第 — 小提琴，明亮E大调，活泼
  vivaldi: {
    name: '四季', baseFreq: 164.81, bpm: 108, timbre: 'sine',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [4, 6, 1], [2, 4, 6], [0, 2, 4]],
    melodyPattern: [0, 2, 4, 7, 5, 4, 2, 0, 4, 7, 5, 2, 0, 4, 2, 7],
    ornamentDensity: 0.5, bassPattern: [0, 4, 5, 4, 0, 4, 3, 4],
  },
  // 亨德尔 — 大键琴，庄严D大调
  handel: {
    name: '弥赛亚', baseFreq: 146.83, bpm: 80, timbre: 'triangle',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [3, 5, 7], [0, 4, 7], [4, 7, 2]],
    melodyPattern: [0, 4, 2, 5, 4, 7, 5, 2, 0, 2, 4, 7, 5, 4, 2, 0],
    ornamentDensity: 0.2, bassPattern: [0, 0, 3, 4, 5, 4, 3, 0],
  },
  // 海顿 — 交响乐，明快G大调
  haydn: {
    name: '惊愕', baseFreq: 196, bpm: 96, timbre: 'sine',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [4, 6, 1], [0, 2, 4], [3, 5, 0]],
    melodyPattern: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1],
    ornamentDensity: 0.15, bassPattern: [0, 0, 0, 0, 3, 3, 4, 4],
  },
  // 莫扎特 — 歌剧般优雅，C大调
  mozart: {
    name: '魔笛', baseFreq: 261.63, bpm: 104, timbre: 'sine',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [0, 2, 4]],
    melodyPattern: [0, 2, 4, 0, 4, 5, 7, 5, 4, 2, 0, -1, 7, 5, 4, 2],
    ornamentDensity: 0.35, bassPattern: [0, 4, 3, 4, 0, 4, 3, 0],
  },
  // 贝多芬 — 命运动机，C小调，沉重有力
  beethoven: {
    name: '命运', baseFreq: 130.81, bpm: 76, timbre: 'sawtooth',
    scale: [1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5, 2],
    chords: [[0, 2, 4], [3, 5, 7], [0, 2, 4], [4, 6, 1]],
    melodyPattern: [0, 0, 0, 4, -1, 3, 3, 3, 7, -1, 5, 5, 5, 4, 3, 2],
    ornamentDensity: 0.1, bassPattern: [0, 0, 0, 0, 3, 3, 3, 3],
  },
  // 肖邦 — 夜曲，降E大调，柔和
  chopin: {
    name: '夜曲', baseFreq: 155.56, bpm: 66, timbre: 'sine',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [5, 7, 2], [3, 5, 7], [0, 2, 4]],
    melodyPattern: [7, 5, 4, 2, 0, 2, 4, 7, 5, 4, 0, 2, 4, 7, 5, 4],
    ornamentDensity: 0.6, bassPattern: [0, 0, 5, 5, 3, 3, 0, 0],
  },
  // 柴可夫斯基 — 天鹅湖，降B小调，华丽
  tchaikovsky: {
    name: '天鹅湖', baseFreq: 233.08, bpm: 88, timbre: 'sine',
    scale: [1, 9/8, 6/5, 4/3, 3/2, 8/5, 9/5, 2],
    chords: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [0, 2, 4]],
    melodyPattern: [0, 2, 4, 7, 4, 2, 0, -1, 5, 7, 4, 2, 5, 4, 2, 0],
    ornamentDensity: 0.4, bassPattern: [0, 4, 5, 4, 3, 5, 4, 0],
  },
  // 李斯特 — 匈牙利狂想曲，A小调，炫技
  liszt: {
    name: '狂想曲', baseFreq: 220, bpm: 120, timbre: 'sawtooth',
    scale: [1, 8/7, 6/5, 4/3, 3/2, 8/5, 9/5, 2],
    chords: [[0, 2, 4], [4, 6, 1], [3, 5, 0], [0, 2, 4]],
    melodyPattern: [0, 4, 7, 4, 0, 5, 7, 5, 4, 7, 5, 2, 0, 4, 7, 0],
    ornamentDensity: 0.7, bassPattern: [0, 0, 4, 4, 5, 5, 3, 4],
  },
  // 德彪西 — 月光，印象派，朦胧
  debussy: {
    name: '月光', baseFreq: 138.59, bpm: 60, timbre: 'sine',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 7/4, 15/8, 2],
    chords: [[0, 4, 7], [2, 5, 0], [3, 7, 2], [0, 4, 7]],
    melodyPattern: [0, 4, 7, 4, 2, 5, 0, 7, 4, 2, 5, 0, 7, 4, 2, 0],
    ornamentDensity: 0.2, bassPattern: [0, 0, 2, 2, 3, 3, 0, 0],
  },
  // 斯特拉文斯基 — 春之祭，原始节奏
  stravinsky: {
    name: '春之祭', baseFreq: 146.83, bpm: 132, timbre: 'square',
    scale: [1, 8/7, 6/5, 4/3, 3/2, 8/5, 7/4, 2],
    chords: [[0, 3, 4], [2, 5, 0], [4, 7, 2], [0, 3, 4]],
    melodyPattern: [0, 0, 4, 0, 5, 5, 4, 0, 7, 7, 5, 4, 0, 5, 4, 0],
    ornamentDensity: 0.15, bassPattern: [0, 0, 0, 4, 0, 0, 5, 4],
  },
  // 久石让 — 龙猫，温暖治愈
  hisaishi: {
    name: 'Summer', baseFreq: 196, bpm: 92, timbre: 'triangle',
    scale: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
    chords: [[0, 2, 4], [5, 7, 2], [3, 5, 7], [0, 4, 7]],
    melodyPattern: [0, 2, 4, 5, 7, 5, 4, 2, 0, 4, 7, 5, 4, 2, 0, -1],
    ornamentDensity: 0.25, bassPattern: [0, 0, 5, 5, 3, 3, 4, 0],
  },
}

class AudioManager {
  private sounds: Map<string, Howl> = new Map()
  private musicNode: AudioBufferSourceNode | null = null
  private musicGain: GainNode | null = null
  private audioCtx: AudioContext | null = null
  private _musicVolume = 0.5
  private _sfxVolume = 0.7
  private _musicEnabled = true
  private currentTrack: string | null = null

  private createSynthSound(name: string, freq: number | number[], duration: number, type: OscillatorType) {
    const sampleRate = 44100
    const samples = Math.floor(sampleRate * duration)
    const buffer = new Float32Array(samples)
    const freqs = Array.isArray(freq) ? freq : [freq]
    const segmentLen = Math.floor(samples / freqs.length)
    for (let f = 0; f < freqs.length; f++) {
      const start = f * segmentLen
      const end = f === freqs.length - 1 ? samples : (f + 1) * segmentLen
      for (let i = start; i < end; i++) {
        const t = i / sampleRate
        const localT = (i - start) / sampleRate
        const env = Math.max(0, 1 - localT / (duration / freqs.length))
        let sample = 0
        const phase = 2 * Math.PI * freqs[f] * t
        switch (type) {
          case 'sine': sample = Math.sin(phase); break
          case 'square': sample = Math.sin(phase) > 0 ? 1 : -1; break
          case 'sawtooth': sample = 2 * (freqs[f] * t % 1) - 1; break
          default: sample = Math.sin(phase)
        }
        buffer[i] = sample * env * 0.3
      }
    }
    const wav = this.float32ToWav(buffer, sampleRate)
    const blob = new Blob([wav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const howl = new Howl({ src: [url], format: ['wav'], volume: this._sfxVolume })
    this.sounds.set(name, howl)
  }

  private float32ToWav(buffer: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1; const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * bitsPerSample / 8
    const blockAlign = numChannels * bitsPerSample / 8
    const dataSize = buffer.length * blockAlign
    const arrayBuffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(arrayBuffer)
    const w = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
    w(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); w(8, 'WAVE'); w(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true); view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true); view.setUint16(34, bitsPerSample, true)
    w(36, 'data'); view.setUint32(40, dataSize, true)
    let off = 44
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
    }
    return arrayBuffer
  }

  init() {
    this.createSynthSound('bomb_place', 220, 0.1, 'square')
    this.createSynthSound('bomb_explode', 100, 0.3, 'sawtooth')
    this.createSynthSound('hit', 440, 0.1, 'square')
    this.createSynthSound('player_hit', 330, 0.15, 'sawtooth')
    this.createSynthSound('monster_hit', 300, 0.12, 'sawtooth')
    this.createSynthSound('levelup', [523, 659, 784], 0.4, 'sine')
    this.createSynthSound('pickup', 660, 0.1, 'sine')
    this.createSynthSound('item_pickup', [880, 1100], 0.15, 'sine')
    this.createSynthSound('quest_complete', [440, 554, 659, 880], 0.5, 'sine')
    this.createSynthSound('menu_click', 800, 0.05, 'sine')
    this.createSynthSound('shield_activate', [440, 660], 0.3, 'sine')
    this.createSynthSound('bomb_kick', 150, 0.08, 'square')
    this.createSynthSound('remote_detonate', 1000, 0.05, 'square')
  }

  play(name: string) {
    const sound = this.sounds.get(name)
    if (sound) { sound.volume(this._sfxVolume); sound.play() }
  }

  /**
   * 根据英雄风格播放BGM
   * heroId 对应 HEROES 中的 id，如 'bach', 'mozart' 等
   */
  playMusic(heroId: string) {
    if (!this._musicEnabled || this.currentTrack === heroId) return
    this.stopMusic()

    if (!this.audioCtx) this.audioCtx = new AudioContext()
    const ctx = this.audioCtx
    if (ctx.state === 'suspended') ctx.resume()

    const style = MUSIC_STYLES[heroId] || MUSIC_STYLES.bach
    const beatDur = 60 / style.bpm
    const loopBars = 4
    const beatsPerBar = 8
    const duration = loopBars * beatsPerBar * beatDur
    const sampleRate = ctx.sampleRate
    const samples = Math.floor(sampleRate * duration)
    const buffer = ctx.createBuffer(1, samples, sampleRate)
    const data = buffer.getChannelData(0)

    // 生成和弦铺底
    const generateTone = (freq: number, startSample: number, lenSamples: number, vol: number, timbre: string) => {
      for (let i = 0; i < lenSamples; i++) {
        const idx = startSample + i
        if (idx >= samples) break
        const t = i / sampleRate
        const env = Math.min(1, t * 8) * Math.max(0, 1 - (t / (lenSamples / sampleRate)) * 0.5)
        let s = 0
        const ph = 2 * Math.PI * freq * t
        if (timbre === 'sine') s = Math.sin(ph)
        else if (timbre === 'triangle') s = Math.asin(Math.sin(ph)) * (2 / Math.PI)
        else if (timbre === 'sawtooth') s = 2 * (freq * t % 1) - 1
        else s = Math.sin(ph) > 0 ? 1 : -1
        data[idx] += s * env * vol
      }
    }

    // 和弦铺底
    const chordLen = beatsPerBar * beatDur
    for (let bar = 0; bar < loopBars; bar++) {
      const chord = style.chords[bar % style.chords.length]
      const startSample = Math.floor(bar * chordLen * sampleRate)
      const len = Math.floor(chordLen * sampleRate)
      for (const degree of chord) {
        const freq = style.baseFreq * style.scale[degree % style.scale.length] * (degree >= style.scale.length ? 2 : 1)
        generateTone(freq, startSample, len, 0.08, 'sine')
      }
    }

    // 旋律
    const melodyBeatDur = beatDur * 0.85
    for (let i = 0; i < style.melodyPattern.length; i++) {
      const degree = style.melodyPattern[i]
      if (degree < 0) continue // 休止
      const freq = style.baseFreq * style.scale[degree % style.scale.length] * (degree >= style.scale.length ? 2 : 0.5)
      const startSample = Math.floor(i * beatDur * sampleRate)
      const len = Math.floor(melodyBeatDur * sampleRate)
      generateTone(freq, startSample, len, 0.15, style.timbre)
      // 装饰音
      if (Math.random() < style.ornamentDensity && i + 1 < style.melodyPattern.length) {
        const ornDeg = style.melodyPattern[i] + 1
        if (ornDeg < style.scale.length) {
          const ornFreq = style.baseFreq * style.scale[ornDeg % style.scale.length]
          const ornStart = Math.floor((i * beatDur + beatDur * 0.7) * sampleRate)
          generateTone(ornFreq, ornStart, Math.floor(beatDur * 0.2 * sampleRate), 0.08, style.timbre)
        }
      }
    }

    // 低音
    for (let i = 0; i < style.bassPattern.length; i++) {
      const degree = style.bassPattern[i]
      const freq = style.baseFreq * style.scale[degree % style.scale.length] * 0.5
      const startSample = Math.floor(i * beatDur * sampleRate)
      const len = Math.floor(beatDur * 0.9 * sampleRate)
      generateTone(freq, startSample, len, 0.12, 'sine')
    }

    // 节拍强调
    for (let i = 0; i < loopBars * beatsPerBar; i++) {
      if (i % 4 === 0) {
        const startSample = Math.floor(i * beatDur * sampleRate)
        generateTone(style.baseFreq * 0.25, startSample, Math.floor(0.05 * sampleRate), 0.06, 'sine')
      }
    }

    // 归一化
    let maxAbs = 0
    for (let i = 0; i < samples; i++) maxAbs = Math.max(maxAbs, Math.abs(data[i]))
    if (maxAbs > 0) {
      const scale = 0.7 / maxAbs
      for (let i = 0; i < samples; i++) data[i] *= scale
    }

    // 淡入淡出
    const fadeLen = Math.floor(0.3 * sampleRate)
    for (let i = 0; i < fadeLen && i < samples; i++) data[i] *= i / fadeLen
    for (let i = 0; i < fadeLen && (samples - 1 - i) >= 0; i++) data[samples - 1 - i] *= i / fadeLen

    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = this._musicVolume * 0.4
    this.musicGain.connect(ctx.destination)

    this.musicNode = ctx.createBufferSource()
    this.musicNode.buffer = buffer
    this.musicNode.loop = true
    this.musicNode.connect(this.musicGain)
    this.musicNode.start()

    this.currentTrack = heroId
  }

  stopMusic() {
    if (this.musicNode) { try { this.musicNode.stop() } catch {}; this.musicNode.disconnect(); this.musicNode = null }
    if (this.musicGain) { this.musicGain.disconnect(); this.musicGain = null }
    this.currentTrack = null
  }

  setMusicVolume(v: number) { this._musicVolume = v; if (this.musicGain) this.musicGain.gain.value = v * 0.4 }
  setSfxVolume(v: number) { this._sfxVolume = v }
  toggleMusic() { this._musicEnabled = !this._musicEnabled; if (!this._musicEnabled) this.stopMusic() }
}

export const audio = new AudioManager()