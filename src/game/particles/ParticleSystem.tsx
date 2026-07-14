/**
 * GPU粒子系统引擎
 * 基于 THREE.Points + BufferGeometry 的高性能粒子系统
 * 支持对象池、自动回收、多种发射模式
 */
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ParticleConfig {
  count: number
  lifetime: [number, number]
  speed: [number, number]
  size: [number, number]
  color: string | string[]
  emissive?: string
  emissiveIntensity?: number
  opacity: [number, number]
  gravity?: number
  spread: number
  drag?: number
  blending?: THREE.Blending
}

const DEFAULT_CONFIG: ParticleConfig = {
  count: 20,
  lifetime: [0.3, 0.8],
  speed: [2, 5],
  size: [0.15, 0.4],
  color: '#ff6f00',
  opacity: [1, 0],
  gravity: -2,
  spread: 0.8,
  drag: 0.95,
  blending: THREE.AdditiveBlending,
}

export const PARTICLE_PRESETS: Record<string, Partial<ParticleConfig>> = {
  explosion_sparks: {
    count: 30, lifetime: [0.2, 0.6], speed: [4, 10], size: [0.1, 0.3],
    opacity: [1, 0], gravity: -1, spread: 1.0, drag: 0.92,
    blending: THREE.AdditiveBlending,
  },
  explosion_smoke: {
    count: 15, lifetime: [0.5, 1.2], speed: [0.5, 2], size: [0.3, 0.8],
    opacity: [0.6, 0], gravity: 0.5, spread: 0.6, drag: 0.98,
    blending: THREE.NormalBlending,
  },
  explosion_shockwave: {
    count: 40, lifetime: [0.15, 0.4], speed: [6, 12], size: [0.08, 0.2],
    opacity: [0.8, 0], gravity: 0, spread: 0.1, drag: 0.88,
    blending: THREE.AdditiveBlending,
  },
  monster_death: {
    count: 25, lifetime: [0.4, 1.0], speed: [2, 6], size: [0.12, 0.35],
    opacity: [1, 0], gravity: -4, spread: 0.9, drag: 0.96,
    blending: THREE.AdditiveBlending,
  },
  levelup_burst: {
    count: 50, lifetime: [0.5, 1.5], speed: [1, 4], size: [0.1, 0.25],
    opacity: [1, 0], gravity: 2, spread: 0.3, drag: 0.97,
    blending: THREE.AdditiveBlending,
  },
  shield_aura: {
    count: 8, lifetime: [0.3, 0.6], speed: [0.5, 1.5], size: [0.15, 0.3],
    opacity: [0.7, 0], gravity: 0, spread: 1.0, drag: 0.99,
    blending: THREE.AdditiveBlending,
  },
  pickup_flash: {
    count: 12, lifetime: [0.2, 0.5], speed: [1, 3], size: [0.1, 0.2],
    opacity: [1, 0], gravity: -0.5, spread: 0.7, drag: 0.95,
    blending: THREE.AdditiveBlending,
  },
  ambient_dust: {
    count: 60, lifetime: [3, 6], speed: [0.1, 0.4], size: [0.05, 0.12],
    opacity: [0.3, 0], gravity: 0.1, spread: 1.0, drag: 0.999,
    blending: THREE.AdditiveBlending,
  },
  portal_swirl: {
    count: 20, lifetime: [0.5, 1.5], speed: [1, 3], size: [0.08, 0.2],
    opacity: [0.8, 0], gravity: 0, spread: 0.2, drag: 0.97,
    blending: THREE.AdditiveBlending,
  },
  move_trail: {
    count: 3, lifetime: [0.15, 0.3], speed: [0.2, 0.8], size: [0.06, 0.15],
    opacity: [0.5, 0], gravity: -0.5, spread: 0.5, drag: 0.9,
    blending: THREE.AdditiveBlending,
  },
  fuse_spark: {
    count: 5, lifetime: [0.1, 0.25], speed: [1, 2.5], size: [0.05, 0.12],
    opacity: [1, 0], gravity: -1, spread: 0.4, drag: 0.93,
    blending: THREE.AdditiveBlending,
  },
  hero_attack: {
    count: 15, lifetime: [0.15, 0.4], speed: [3, 7], size: [0.08, 0.2],
    opacity: [1, 0], gravity: -0.5, spread: 0.6, drag: 0.93,
    blending: THREE.AdditiveBlending,
  },
}

interface PoolState {
  positions: Float32Array
  velocities: Float32Array
  lifetimes: Float32Array
  maxLifetimes: Float32Array
  sizes: Float32Array
  colors: Float32Array
  nextIndex: number
  capacity: number
}

function createPool(capacity: number): PoolState {
  return {
    positions: new Float32Array(capacity * 3),
    velocities: new Float32Array(capacity * 3),
    lifetimes: new Float32Array(capacity),
    maxLifetimes: new Float32Array(capacity),
    sizes: new Float32Array(capacity),
    colors: new Float32Array(capacity * 3),
    nextIndex: 0,
    capacity,
  }
}

function emitParticles(pool: PoolState, pos: [number, number, number], config: ParticleConfig) {
  const count = Math.min(config.count, pool.capacity)
  const color = new THREE.Color(Array.isArray(config.color) ? config.color[0] : config.color)

  for (let i = 0; i < count; i++) {
    const idx = pool.nextIndex
    pool.nextIndex = (pool.nextIndex + 1) % pool.capacity

    pool.positions[idx * 3] = pos[0]
    pool.positions[idx * 3 + 1] = pos[1]
    pool.positions[idx * 3 + 2] = pos[2]

    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(1 - Math.random() * config.spread)
    const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0])
    pool.velocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed
    pool.velocities[idx * 3 + 1] = Math.cos(phi) * speed * 0.5
    pool.velocities[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

    pool.lifetimes[idx] = config.lifetime[0] + Math.random() * (config.lifetime[1] - config.lifetime[0])
    pool.maxLifetimes[idx] = pool.lifetimes[idx]
    pool.sizes[idx] = config.size[0] + Math.random() * (config.size[1] - config.size[0])

    if (Array.isArray(config.color) && config.color.length > 1) {
      color.set(config.color[Math.floor(Math.random() * config.color.length)])
    }
    pool.colors[idx * 3] = color.r
    pool.colors[idx * 3 + 1] = color.g
    pool.colors[idx * 3 + 2] = color.b
  }
}

function tickPool(pool: PoolState, dt: number, gravity: number, drag: number) {
  for (let i = 0; i < pool.capacity; i++) {
    if (pool.lifetimes[i] <= 0) continue

    pool.lifetimes[i] -= dt
    if (pool.lifetimes[i] <= 0) { pool.lifetimes[i] = 0; continue }

    pool.positions[i * 3] += pool.velocities[i * 3] * dt
    pool.positions[i * 3 + 1] += pool.velocities[i * 3 + 1] * dt
    pool.positions[i * 3 + 2] += pool.velocities[i * 3 + 2] * dt

    pool.velocities[i * 3 + 1] += gravity * dt
    pool.velocities[i * 3] *= drag
    pool.velocities[i * 3 + 1] *= drag
    pool.velocities[i * 3 + 2] *= drag

    pool.sizes[i] *= 0.997
  }
}

// ─── 全局粒子系统组件（挂在SceneContent内） ───
export type EmitFn = (pos: [number, number, number], preset: string, overrides?: Partial<ParticleConfig>) => void

interface GlobalParticleSystemProps {
  capacity?: number
  onReady?: (emit: EmitFn) => void
}

export function GlobalParticleSystem({ capacity = 3000, onReady }: GlobalParticleSystemProps) {
  const poolRef = useRef<PoolState>(createPool(capacity))
  const geoRef = useRef<THREE.BufferGeometry>(null!)

  const posAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(capacity * 3), 3), [capacity])
  const colAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(capacity * 3), 3), [capacity])
  const szAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(capacity), 1), [capacity])

  const configRef = useRef<ParticleConfig>(DEFAULT_CONFIG)

  const emitFn = useRef<EmitFn>((pos, preset, overrides) => {
    const pCfg = PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.explosion_sparks
    const cfg: ParticleConfig = { ...DEFAULT_CONFIG, ...pCfg, ...overrides }
    configRef.current = cfg
    emitParticles(poolRef.current, pos, cfg)
  })

  useEffect(() => { onReady?.(emitFn.current) }, [onReady])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const pool = poolRef.current
    tickPool(pool, dt, -2, 0.96)

    if (!geoRef.current) return
    const pArr = posAttr.array as Float32Array
    const cArr = colAttr.array as Float32Array
    const sArr = szAttr.array as Float32Array
    pArr.set(pool.positions)
    cArr.set(pool.colors)
    sArr.set(pool.sizes)
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    szAttr.needsUpdate = true
    geoRef.current.setDrawRange(0, pool.capacity)
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" {...posAttr} />
        <bufferAttribute attach="attributes-color" {...colAttr} />
        <bufferAttribute attach="attributes-size" {...szAttr} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors size={0.15} sizeAttenuation transparent
        depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── 独立爆发粒子组件 ───
interface ParticleBurstProps {
  position: [number, number, number]
  preset: string
  color?: string
  count?: number
  overrides?: Partial<ParticleConfig>
  onComplete?: () => void
}

export function ParticleBurst({ position, preset, color, count, overrides, onComplete }: ParticleBurstProps) {
  const poolRef = useRef<PoolState | null>(null)
  const geoRef = useRef<THREE.BufferGeometry>(null!)
  const timerRef = useRef(0)
  const maxLifeRef = useRef(0)

  const config = useMemo(() => {
    const pCfg = PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.explosion_sparks
    const cfg: ParticleConfig = { ...DEFAULT_CONFIG, ...pCfg, ...overrides }
    if (color) cfg.color = color
    if (count) cfg.count = count
    return cfg
  }, [preset, color, count, overrides])

  const maxCount = config.count * 2
  const posAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(maxCount * 3), 3), [maxCount])
  const colAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(maxCount * 3), 3), [maxCount])
  const szAttr = useMemo(() => new THREE.Float32BufferAttribute(new Float32Array(maxCount), 1), [maxCount])

  useEffect(() => {
    const pool = createPool(maxCount)
    emitParticles(pool, position, config)
    poolRef.current = pool
    maxLifeRef.current = config.lifetime[1] + 0.2
    timerRef.current = 0
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const pool = poolRef.current
    if (!pool || !geoRef.current) return

    timerRef.current += dt
    if (timerRef.current > maxLifeRef.current) { onComplete?.(); return }

    tickPool(pool, dt, config.gravity ?? -2, config.drag ?? 0.95)

    const pArr = posAttr.array as Float32Array
    const cArr = colAttr.array as Float32Array
    const sArr = szAttr.array as Float32Array
    pArr.set(pool.positions)
    cArr.set(pool.colors)
    sArr.set(pool.sizes)
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    szAttr.needsUpdate = true
    geoRef.current.setDrawRange(0, pool.capacity)
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" {...posAttr} />
        <bufferAttribute attach="attributes-color" {...colAttr} />
        <bufferAttribute attach="attributes-size" {...szAttr} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors size={0.12} sizeAttenuation transparent
        depthWrite={false} blending={config.blending || THREE.AdditiveBlending}
      />
    </points>
  )
}