import React, { useRef, useEffect, useMemo, useCallback, useState, Suspense } from 'react'
import { getTouchState } from '../platform/touchControls'
import { detectDevice } from '../platform/deviceProfile'
import { HEROES } from './heroes'
import { HERO_VFX } from './heroVFX'
import { getHeroDialogue } from './heroDialogues'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from './store'
import type { PowerupType, AbilityState, PortalInstance } from './store'
import { PowerupRenderer } from './PowerupRenderer'
import { PortalSystem } from './dimensions/PortalSystem'
import { DIMENSIONS } from './dimensions/configs'
import { generateChunk } from './dimensions/chunkGenerator'
import { audio } from '../utils/audio'
import { GlobalParticleSystem } from './particles'
import {
  TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT,
  TILE_EMPTY, TILE_WALL, TILE_DESTRUCTIBLE, TILE_GRASS,
  MONSTER_SLIME, MONSTER_FOREST, MONSTER_BOSS,
} from '../utils/constants'

const POWERUP_TYPES: PowerupType[] = ['bomb_up', 'fire_up', 'speed_up', 'shield', 'kick', 'remote']

function mulberry32(a: number) {
  return () => {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const _texCache = new Map<string, THREE.Texture>()

function createFallbackTexture(color: string, path: string): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 4; canvas.height = 4
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 4, 4)
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(0, 0, 2, 2)
  ctx.fillRect(2, 2, 2, 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  _texCache.set(path, tex)
  return tex
}

const FALLBACK_COLORS: Record<string, string> = {
  'wall': '#455a64', 'destructible': '#8d6e63', 'ground': '#2d2d3d',
  'grass': '#2e7d32', 'slime': '#66bb6a', 'forest_monster': '#8d6e63',
  'boss': '#ef5350', 'bomb': '#ff6f00', 'player': '#4fc3f7',
}
function getFallbackColor(path: string): string {
  for (const [key, color] of Object.entries(FALLBACK_COLORS)) {
    if (path.includes(key)) return color
  }
  return '#888888'
}


// Apply a texture to all mesh materials in a GLB scene
function applyTextureToModel(scene: THREE.Group, texture: THREE.Texture | null, color: string) {
  if (!scene) return
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const cloned = mat.clone()
            if (texture) { cloned.map = texture; cloned.needsUpdate = true }
            cloned.color.set(color)
            return cloned
          }
          return mat
        })
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        const cloned = mesh.material.clone()
        if (texture) { cloned.map = texture; cloned.needsUpdate = true }
        cloned.color.set(color)
        mesh.material = cloned
      }
    }
  })
}

function useSafeTexture(path: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(() => _texCache.get(path) || null)
  useEffect(() => {
    const cached = _texCache.get(path)
    if (cached) { setTexture(cached); return }
    const loader = new THREE.TextureLoader()
    loader.load(path, (tex) => {
      try {
        if (_deviceProfile.textureRes < 2048) {
          const scale = Math.max(0.25, _deviceProfile.textureRes / 2048)
          const w = Math.max(8, Math.round(tex.image.width * scale))
          const h = Math.max(8, Math.round(tex.image.height * scale))
          const c = document.createElement('canvas')
          c.width = w
          c.height = h
          const cx = c.getContext('2d')!
          cx.drawImage(tex.image, 0, 0, w, h)
          tex.image = c
        }
      } catch {}
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      tex.needsUpdate = true
      _texCache.set(path, tex)
      setTexture(tex)
    }, undefined, () => { createFallbackTexture(getFallbackColor(path), path); setTexture(_texCache.get(path)!) })
  }, [path])
  return texture
}

interface MonsterData {
  id: number; x: number; z: number; type: number
  hp: number; maxHp: number; attack: number; speed: number; xpReward: number
  alive: boolean; respawnTimer: number; aggroRange: number
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead'
  targetX: number; targetZ: number; stateTimer: number
  attackCooldown: number
}

interface BombInstance {
  id: number; x: number; z: number; timer: number
  radius: number; exploded: boolean; isMonsterBomb?: boolean
}

const keys: Record<string, boolean> = {}
function useKeyboard() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true
      if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => { keys[e.key.toLowerCase()] = false }
    const onBlur = () => { for (const k in keys) keys[k] = false }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}

function monsterBombRadius(type: number): number {
  if (type === MONSTER_BOSS) return 3
  if (type === MONSTER_FOREST) return 2
  return 1
}
function monsterDodgeChance(type: number): number {
  if (type === MONSTER_BOSS) return 0.9
  if (type === MONSTER_FOREST) return 0.6
  return 0.3
}

function isInBlastZone(wx: number, wz: number, bombs: BombInstance[], map: number[][]): boolean {
  for (const b of bombs) {
    if (b.exploded) continue
    const bx = Math.round(b.x / TILE_SIZE), bz = Math.round(b.z / TILE_SIZE)
    const mx = Math.round(wx / TILE_SIZE), mz = Math.round(wz / TILE_SIZE)
    if (bz === mz && Math.abs(bx - mx) <= b.radius) {
      const step = mx > bx ? 1 : -1
      let blocked = false
      for (let i = bx + step; i !== mx; i += step) {
        if (i >= 0 && i < WORLD_WIDTH && map[bz] && map[bz][i] === TILE_WALL) { blocked = true; break }
      }
      if (!blocked) return true
    }
    if (bx === mx && Math.abs(bz - mz) <= b.radius) {
      const step = mz > bz ? 1 : -1
      let blocked = false
      for (let i = bz + step; i !== mz; i += step) {
        if (i >= 0 && i < WORLD_HEIGHT && map[i] && map[i][bx] === TILE_WALL) { blocked = true; break }
      }
      if (!blocked) return true
    }
  }
  return false
}

function findSafeCell(mx: number, mz: number, map: number[][], bombs: BombInstance[]): { x: number; z: number } | null {
  const cx = Math.round(mx / TILE_SIZE), cz = Math.round(mz / TILE_SIZE)
  for (let r = 1; r <= 5; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue
        const nx = cx + dx, nz = cz + dz
        if (nx < 1 || nx >= WORLD_WIDTH - 1 || nz < 1 || nz >= WORLD_HEIGHT - 1) continue
        if (!map[nz] || map[nz][nx] !== TILE_EMPTY) continue
        if (!isInBlastZone(nx * TILE_SIZE, nz * TILE_SIZE, bombs, map)) return { x: nx * TILE_SIZE, z: nz * TILE_SIZE }
      }
    }
  }
  return null
}
const _dummy = new THREE.Object3D()

function InstancedTiles({ map, dimensionId }: { map: number[][]; dimensionId: string }) {
  const wallRef = useRef<THREE.InstancedMesh>(null!)
  const destructRef = useRef<THREE.InstancedMesh>(null!)
  const grassRef = useRef<THREE.InstancedMesh>(null!)
  const dim = DIMENSIONS[dimensionId] || DIMENSIONS.baroque

  const counts = useMemo(() => {
    let w = 0, d = 0, g = 0
    for (let z = 0; z < WORLD_HEIGHT; z++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        if (map[z][x] === TILE_WALL) w++
        else if (map[z][x] === TILE_DESTRUCTIBLE) d++
        else if (map[z][x] === TILE_GRASS) g++
      }
    }
    return { w, d, g }
  }, [map])

  const wallTex = useSafeTexture(dim.wallTexture)
  const destTex = useSafeTexture(dim.destructibleTexture)
  const grassTex = useSafeTexture(dim.groundTexture)

  useEffect(() => {
    let wi = 0, di = 0, gi = 0
    for (let z = 0; z < WORLD_HEIGHT; z++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const type = map[z][x]
        const wx = x * TILE_SIZE, wz = z * TILE_SIZE
        _dummy.position.set(wx, 0, wz)
        if (type === TILE_WALL && wallRef.current) {
          _dummy.position.y = 0.75
          _dummy.scale.set(TILE_SIZE * 0.95, 1.5, TILE_SIZE * 0.95)
          _dummy.updateMatrix()
          wallRef.current.setMatrixAt(wi++, _dummy.matrix)
        } else if (type === TILE_DESTRUCTIBLE && destructRef.current) {
          _dummy.position.y = 0.5
          _dummy.scale.set(TILE_SIZE * 0.95, 1.0, TILE_SIZE * 0.95)
          _dummy.updateMatrix()
          destructRef.current.setMatrixAt(di++, _dummy.matrix)
        } else if (type === TILE_GRASS && grassRef.current) {
          _dummy.position.y = 0.05
          _dummy.scale.set(TILE_SIZE * 0.95, 0.1, TILE_SIZE * 0.95)
          _dummy.updateMatrix()
          grassRef.current.setMatrixAt(gi++, _dummy.matrix)
        }
      }
    }
    wallRef.current && (wallRef.current.instanceMatrix.needsUpdate = true)
    destructRef.current && (destructRef.current.instanceMatrix.needsUpdate = true)
    grassRef.current && (grassRef.current.instanceMatrix.needsUpdate = true)
  }, [map])

  return (
    <>
      {counts.w > 0 && (
        <instancedMesh ref={wallRef} args={[undefined, undefined, counts.w]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={dim.wallColor} roughness={0.8} map={wallTex} />
        </instancedMesh>
      )}
      {counts.d > 0 && (
        <instancedMesh ref={destructRef} args={[undefined, undefined, counts.d]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={dim.destructibleColor} roughness={0.7} map={destTex} />
        </instancedMesh>
      )}
      {counts.g > 0 && (
        <instancedMesh ref={grassRef} args={[undefined, undefined, counts.g]} receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={dim.grassColor} roughness={0.9} map={grassTex} />
        </instancedMesh>
      )}
    </>
  )
}

function WallColliders({ map }: { map: number[][] }) {
  const colliders = useMemo(() => {
    const result: Array<{ x: number; z: number; w: number; d: number; h: number }> = []
    for (let z = 0; z < WORLD_HEIGHT; z++) {
      let runStart = -1, runType = TILE_EMPTY
      for (let x = 0; x <= WORLD_WIDTH; x++) {
        const type = x < WORLD_WIDTH ? map[z][x] : TILE_EMPTY
        const isSolid = type === TILE_WALL || type === TILE_DESTRUCTIBLE
        if (isSolid && type === runType) {
          if (runStart < 0) runStart = x
        } else {
          if (runStart >= 0) {
            const len = x - runStart
            const h = runType === TILE_WALL ? 1.5 : 1.0
            const cx = (runStart + (runStart + len - 1)) / 2 * TILE_SIZE
            result.push({ x: cx, z: z * TILE_SIZE, w: len * TILE_SIZE * 0.5, d: TILE_SIZE * 0.5, h: h / 2 })
            runStart = -1
          }
          runType = type
          if (isSolid) { runStart = x; runType = type }
        }
      }
    }
    return result
  }, [map])
  return (
    <>
      {colliders.map((c, i) => (
        <RigidBody key={i} type="fixed" position={[c.x, c.h, c.z]}>
          <CuboidCollider args={[c.w, c.h, c.d]} />
        </RigidBody>
      ))}
    </>
  )
}

function BombColliders({ bombs }: { bombs: BombInstance[] }) {
  return (
    <>
      {bombs.filter(b => !b.exploded).map(b => (
        <RigidBody key={b.id} type="fixed" position={[b.x, 0.5, b.z]}>
          <CuboidCollider args={[0.3, 0.5, 0.3]} />
        </RigidBody>
      ))}
    </>
  )
}

function Ground({ dimensionId }: { dimensionId: string }) {
  const dim = DIMENSIONS[dimensionId] || DIMENSIONS.baroque
  const groundTex = useSafeTexture(dim.groundTexture)
  return (
    <RigidBody type="fixed" position={[WORLD_WIDTH * TILE_SIZE / 2, -0.05, WORLD_HEIGHT * TILE_SIZE / 2]}>
      <CuboidCollider args={[WORLD_WIDTH * TILE_SIZE / 2, 0.1, WORLD_HEIGHT * TILE_SIZE / 2]} />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE]} />
        <meshStandardMaterial color={dim.groundColor} roughness={0.9} map={groundTex} />
      </mesh>
    </RigidBody>
  )
}

function ShieldVisual() {
  const shieldActive = useGameStore(s => s.shieldActive)
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.02 })
  if (!shieldActive) return null
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <sphereGeometry args={[1.0, 16, 16]} />
      <meshStandardMaterial color="#9c27b0" transparent opacity={0.25} emissive="#9c27b0" emissiveIntensity={0.8} />
    </mesh>
  )
}

function Player({ map, monsters, onBombPlace, playerRef: parentRef, portals, onPortalEnter }: {
  map: number[][]; monsters: MonsterData[]
  onBombPlace: (x: number, z: number) => void
  playerRef: React.MutableRefObject<RapierRigidBody | null>
  portals: PortalInstance[]
  onPortalEnter: (portal: PortalInstance) => void
}) {
  const ref = useRef<RapierRigidBody>(null!)
  const meshRef = useRef<THREE.Group>(null!)
  const phase = useGameStore(s => s.phase)
  const takeDamage = useGameStore(s => s.takeDamage)
  const addXp = useGameStore(s => s.addXp)
  const killMonster = useGameStore(s => s.killMonster)
  const updateQuestProgress = useGameStore(s => s.updateQuestProgress)
  const activeQuestId = useGameStore(s => s.activeQuestId)
  const collectPowerup = useGameStore(s => s.collectPowerup)
  const bombCooldown = useRef(0)
  const attackCooldown = useRef(0)
  const invincible = useRef(0)
  const lastBombKey = useRef(false)
  const portalCooldown = useRef(0)
  useKeyboard()
  useEffect(() => { parentRef.current = ref.current })

  const selectedHeroId = useGameStore(s => s.selectedHeroId)
  const heroDef = HEROES.find(h => h.id === selectedHeroId) || HEROES[0]
  const heroTexture = useSafeTexture(heroDef.texturePath)
  const heroGltf = useGLTF(heroDef.modelPath)
  const playerScene = heroGltf?.scene ?? null
  const playerModel = useMemo(() => playerScene?.clone(true) ?? null, [playerScene, selectedHeroId])

  // Apply hero texture to model
  useEffect(() => {
    if (playerModel && heroTexture) applyTextureToModel(playerModel, heroTexture, heroDef.color)
  }, [playerModel, heroTexture, heroDef.color])

  useFrame((_, delta) => {
    if (phase !== 'playing' || !ref.current) return
    const dt = Math.min(delta, 0.05)
    const rb = ref.current
    const pos = rb.translation()
    const store = useGameStore.getState()
    store.setPlayerWorldPos(pos.x, pos.z)

    const touch = getTouchState()
    let dx = 0, dz = 0
    if (keys['w'] || keys['arrowup']) dz = -1
    if (keys['s'] || keys['arrowdown']) dz = 1
    if (keys['a'] || keys['arrowleft']) dx = -1
    if (keys['d'] || keys['arrowright']) dx = 1
    // 鍚堝苟瑙﹀睆鎽囨潌杈撳叆
    const touchMX = Math.abs(touch.moveX) > 0.15 ? touch.moveX : 0
    const touchMZ = Math.abs(touch.moveZ) > 0.15 ? touch.moveZ : 0
    if (touchMX !== 0 || touchMZ !== 0) { dx = touchMX; dz = touchMZ }
    const len = Math.sqrt(dx * dx + dz * dz)
    const speed = 6 + store.player.speed * 0.3
    if (len > 0) {
      rb.setLinvel({ x: (dx / len) * speed, y: 0, z: (dz / len) * speed }, true)
      if (meshRef.current) meshRef.current.rotation.y = Math.atan2(dx, dz)
    } else {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    bombCooldown.current -= dt
    const bombKey = keys[' '] || touch.bomb
    if (bombKey && !lastBombKey.current && bombCooldown.current <= 0) {
      const bx = Math.round(pos.x / TILE_SIZE) * TILE_SIZE
      const bz = Math.round(pos.z / TILE_SIZE) * TILE_SIZE
      onBombPlace(bx, bz)
      bombCooldown.current = 0.3
      audio.play('bomb_place')
    }
    lastBombKey.current = bombKey
    attackCooldown.current -= dt
    invincible.current -= dt
    portalCooldown.current -= dt
    const currentPowerups = store.powerups
    store.regenMana(2 * dt)
    store.tickAbilityCooldowns(dt)

    if (keys['j'] && attackCooldown.current <= 0) {
      attackCooldown.current = 0.4
      audio.play('hit')
      for (const m of monsters) {
        if (!m.alive) continue
        const mdx = m.x - pos.x, mdz = m.z - pos.z
        if (Math.sqrt(mdx * mdx + mdz * mdz) < 2.5) {
          const dmg = store.player.attack
          m.hp -= dmg
          store.addDamageDealt(dmg)
          store.addFloatingDamage(m.x, 2, m.z, '-' + dmg, '#ffffff')
          audio.play('monster_hit')
          if (m.hp <= 0) {
            m.alive = false; m.respawnTimer = 10 + Math.random() * 10; m.state = 'dead'
            addXp(m.xpReward); killMonster(); store.waveMonsterKilled(); audio.play('levelup')
            store.addFloatingDamage(m.x, 3, m.z, '+' + m.xpReward + ' XP', '#ffd54f')
            if (activeQuestId) updateQuestProgress(activeQuestId, activeQuestId + '_kill', 1)
          }
        }
      }
    }

    if (invincible.current <= 0) {
      for (const m of monsters) {
        if (!m.alive) continue
        const mdx = m.x - pos.x, mdz = m.z - pos.z
        if (Math.sqrt(mdx * mdx + mdz * mdz) < 1.8) {
          const dmg = Math.max(1, m.attack - store.player.defense)
          takeDamage(dmg); invincible.current = 2.0; audio.play('player_hit'); const hurtLine = getHeroDialogue(selectedHeroId, 'hurt'); if (hurtLine && Math.random() < 0.4) store.addNotification(hurtLine, 'info')
          store.addFloatingDamage(pos.x, 2, pos.z, '-' + dmg, '#ef5350')
          break
        }
      }
    }

    for (const ab of store.abilities) {
      if (keys[ab.key] && ab.ready && store.mp >= ab.mana) {
        if (store.useMana(ab.mana)) {
          store.setAbilityCooldown(ab.key, ab.maxCooldown)
          castAbility(ab.key, pos, monsters, store.player)
        }
      }
    }

    for (const p of currentPowerups) {
      if (p.collected) continue
      const pdx = pos.x - p.x, pdz = pos.z - p.z
      if (Math.sqrt(pdx * pdx + pdz * pdz) < 1.2) collectPowerup(p.id)
    }

    if (portalCooldown.current <= 0 && !store.isTransitioning) {
      for (const portal of portals) {
        const pdx = pos.x - portal.x, pdz = pos.z - portal.z
        if (Math.sqrt(pdx * pdx + pdz * pdz) < 2.0) {
          portalCooldown.current = 2.0
          onPortalEnter(portal)
          break
        }
      }
    }
  })

  return (
    <RigidBody ref={ref} position={[WORLD_WIDTH / 2 * TILE_SIZE, 0.5, WORLD_HEIGHT / 2 * TILE_SIZE]}
      type="dynamic" lockRotations mass={1} linearDamping={0}>
      <CuboidCollider args={[0.3, 0.5, 0.3]} />
      <group ref={meshRef}>
        {playerModel ? <primitive object={playerModel} scale={[0.6, 0.6, 0.6]} /> : (
          <mesh><boxGeometry args={[0.6, 0.8, 0.6]} /><meshStandardMaterial color="#4fc3f7" /></mesh>
        )}
        <ShieldVisual />
      </group>
    </RigidBody>
  )
}

function Bomb({ bomb, onExplode }: { bomb: BombInstance; onExplode: (b: BombInstance) => void }) {
  const meshRef = useRef<THREE.Group>(null!)
  const bombGltf = useGLTF('/models/bomb.glb')
  const bombScene = bombGltf?.scene ?? null

  const heroId = useGameStore(s => s.selectedHeroId)
  const vfx = !bomb.isMonsterBomb ? (HERO_VFX[heroId] || HERO_VFX.bach) : null
  const bColor = vfx?.bombColor || '#ff6f00'
  const bEmissive = vfx?.bombEmissive || '#ff6f00'
  const bScale = vfx?.bombScale || 0.8

  const bombTexture = useSafeTexture('/textures/bomb.png')
  const bombModel = useMemo(() => bombScene?.clone(true) ?? null, [bombScene])
  useEffect(() => { if (bombModel && bombTexture) applyTextureToModel(bombModel, bombTexture, bColor) }, [bombModel, bombTexture, bColor])
  useFrame((_, delta) => {
    bomb.timer -= delta
    if (bomb.timer <= 0 && !bomb.exploded) { bomb.exploded = true; onExplode(bomb); audio.play('bomb_explode') }
    if (meshRef.current) {
      const scale = bScale + Math.sin(Date.now() * 0.01) * 0.1 * Math.max(0, bomb.timer)
      meshRef.current.scale.setScalar(scale)
      meshRef.current.visible = true
    }
  })
  return (
    <group ref={meshRef} position={[bomb.x, 0.5, bomb.z]}>
      {bombModel ? <primitive object={bombModel} scale={[bScale, bScale, bScale]} /> : (
        <mesh><sphereGeometry args={[0.35, 12, 12]} /><meshStandardMaterial color={bColor} emissive={bEmissive} emissiveIntensity={0.6} /></mesh>
      )}
      {!bomb.isMonsterBomb && (
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[bomb.radius * 0.8, bomb.radius * 0.8 + 0.15, 32]} />
          <meshBasicMaterial color={bColor} transparent opacity={0.3 + Math.sin(Date.now() * 0.008) * 0.15} />
        </mesh>
      )}
      {bomb.isMonsterBomb && (
        <mesh><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#ff0000" transparent opacity={0.3} emissive="#ff0000" emissiveIntensity={1} /></mesh>
      )}
    </group>
  )
}
function Explosion({ x, z, radius, onDone, explosionId }: {
  x: number; z: number; radius: number; onDone: (id: number) => void; explosionId: number
}) {
  const heroId = useGameStore.getState().selectedHeroId
  const vfx = HERO_VFX[heroId] || HERO_VFX.bach
  const duration = vfx.explosionDuration
  const timerRef = useRef(duration)
  const doneRef = useRef(false)
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = Math.max(1, (radius * 2 + 1 + radius * 2) + (vfx.explosionPattern === 'star' || vfx.explosionPattern === 'scatter' ? radius * 4 : 0))
  useFrame((_, delta) => {
    if (doneRef.current) return
    timerRef.current -= delta
    if (timerRef.current <= 0) { doneRef.current = true; onDone(explosionId); return }
    if (ref.current) {
      ref.current.visible = true
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.transparent = true
      mat.opacity = Math.max(0, timerRef.current / duration)
    }
  })
  useEffect(() => {
    if (!ref.current) return
    let idx = 0
    for (let i = -radius; i <= radius; i++) {
      _dummy.position.set(x + i * TILE_SIZE, 0.3, z)
      _dummy.scale.set(TILE_SIZE * 0.9, 0.6, TILE_SIZE * 0.9)
      _dummy.updateMatrix()
      ref.current.setMatrixAt(idx++, _dummy.matrix)
      if (i !== 0) {
        _dummy.position.set(x, 0.3, z + i * TILE_SIZE)
        _dummy.updateMatrix()
        ref.current.setMatrixAt(idx++, _dummy.matrix)
      }
    }
    if ((vfx.explosionPattern === 'star' || vfx.explosionPattern === 'scatter') && radius >= 2) {
      for (let i = 1; i <= radius - 1; i++) {
        _dummy.position.set(x + i * TILE_SIZE, 0.35, z + i * TILE_SIZE)
        _dummy.scale.set(TILE_SIZE * 0.7, 0.5, TILE_SIZE * 0.7)
        _dummy.updateMatrix()
        if (idx < count) ref.current.setMatrixAt(idx++, _dummy.matrix)
        _dummy.position.set(x - i * TILE_SIZE, 0.35, z + i * TILE_SIZE)
        _dummy.updateMatrix()
        if (idx < count) ref.current.setMatrixAt(idx++, _dummy.matrix)
        _dummy.position.set(x + i * TILE_SIZE, 0.35, z - i * TILE_SIZE)
        _dummy.updateMatrix()
        if (idx < count) ref.current.setMatrixAt(idx++, _dummy.matrix)
        _dummy.position.set(x - i * TILE_SIZE, 0.35, z - i * TILE_SIZE)
        _dummy.updateMatrix()
        if (idx < count) ref.current.setMatrixAt(idx++, _dummy.matrix)
      }
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [x, z, radius])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} renderOrder={999}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={vfx.explosionColor} transparent depthTest={false} opacity={1} emissive={vfx.explosionEmissive} emissiveIntensity={2} />
    </instancedMesh>
  )

}
function MonsterRenderer({ monsters, dimensionId }: { monsters: MonsterData[]; dimensionId: string }) {
  const dim = DIMENSIONS[dimensionId] || DIMENSIONS.baroque
  const groupRef = useRef<THREE.Group>(null!)
  const slimeGltf = useGLTF('/models/slime.glb')
  const forestGltf = useGLTF('/models/forest_monster.glb')
  const bossGltf = useGLTF('/models/boss.glb')
  const slimeScene = slimeGltf?.scene ?? null
  const forestScene = forestGltf?.scene ?? null
  const bossScene = bossGltf?.scene ?? null

  const slimeTexture = useSafeTexture('/textures/slime.png')
  const forestTexture = useSafeTexture('/textures/forest_monster.png')
  const bossTexture = useSafeTexture('/textures/boss.png')

  // Build one prototype per type, apply texture once
  const slimeProto = useMemo(() => {
    if (!slimeScene) return null
    const c = slimeScene.clone(true)
    if (slimeTexture) applyTextureToModel(c, slimeTexture, '#66bb6a')
    return c
  }, [slimeScene, slimeTexture])
  const forestProto = useMemo(() => {
    if (!forestScene) return null
    const c = forestScene.clone(true)
    if (forestTexture) applyTextureToModel(c, forestTexture, '#8d6e63')
    return c
  }, [forestScene, forestTexture])
  const bossProto = useMemo(() => {
    if (!bossScene) return null
    const c = bossScene.clone(true)
    if (bossTexture) applyTextureToModel(c, bossTexture, '#ef5350')
    return c
  }, [bossScene, bossTexture])

  // Clone per instance so each monster gets its own Object3D
  const aliveMonsters = useMemo(() => monsters.filter(m => m.alive), [monsters])
  const monsterModels = useMemo(() => {
    return aliveMonsters.map(m => {
      const proto = m.type === MONSTER_SLIME ? slimeProto : m.type === MONSTER_FOREST ? forestProto : bossProto
      if (!proto) return null
      return proto.clone(true)
    })
  }, [aliveMonsters.length, slimeProto, forestProto, bossProto])

  // Update positions each frame without re-rendering
  useFrame(() => {
    if (!groupRef.current) return
    const children = groupRef.current.children
    for (let i = 0; i < children.length; i++) {
      const m = aliveMonsters[i]
      if (!m) continue
      children[i].position.set(m.x, 0.5 + Math.sin(Date.now() * 0.003 + m.id) * 0.1, m.z)
    }
  })

  return (
    <group ref={groupRef}>
      {aliveMonsters.map((m, i) => {
        const model = monsterModels[i]
        const scale = m.type === MONSTER_BOSS ? 2.0 : m.type === MONSTER_FOREST ? 1.4 : 1.0
        const mType = dim.monsterTypes[m.type]
        const fallbackColor = mType?.color || '#66bb6a'
        return (
          <group key={m.id} position={[m.x, 0.5, m.z]} scale={[scale, scale, scale]}>
            {model ? <primitive object={model} /> : (
              <mesh><sphereGeometry args={[0.5, 12, 12]} /><meshStandardMaterial color={fallbackColor} /></mesh>
            )}
            {m.hp < m.maxHp && (
              <group position={[0, 0.9, 0]}>
                <mesh><boxGeometry args={[1, 0.08, 0.02]} /><meshBasicMaterial color="#333" /></mesh>
                <mesh position={[-(1 - m.hp / m.maxHp) * 0.5, 0, 0.01]}>
                  <boxGeometry args={[m.hp / m.maxHp, 0.06, 0.02]} /><meshBasicMaterial color="#e53935" />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}


// ========================
// Scene Props (destructible environment objects)
// ========================
interface ScenePropData { x: number; z: number; modelPath: string; scale: number; id: string; dimensionId?: string }

function ScenePropMesh({ prop }: { prop: ScenePropData }) {
  const groupRef = useRef<THREE.Group>(null!)
  const dim = DIMENSIONS[prop.dimensionId || 'baroque'] || DIMENSIONS.baroque
  // Preload all possible prop models at the top level (hooks rule)
  const barrelGltf = useGLTF('/models/prop_barrel.glb')
  const crateGltf = useGLTF('/models/prop_crate.glb')
  const fenceGltf = useGLTF('/models/prop_fence.glb')
  const stumpGltf = useGLTF('/models/prop_stump.glb')
  const torchGltf = useGLTF('/models/prop_torch.glb')
  const candelabraGltf = useGLTF('/models/env_baroque_candelabra.glb')
  const columnBaroqueGltf = useGLTF('/models/env_baroque_column.glb')
  const columnClassicalGltf = useGLTF('/models/env_classical_column.glb')
  const pianoGltf = useGLTF('/models/env_classical_piano.glb')
  const archGltf = useGLTF('/models/env_romantic_arch.glb')
  const roseGltf = useGLTF('/models/env_romantic_rose.glb')
  const djGltf = useGLTF('/models/env_modern_djconsole.glb')
  const speakerGltf = useGLTF('/models/env_modern_speaker.glb')

  const gltfMap: Record<string, typeof barrelGltf> = {
    '/models/prop_barrel.glb': barrelGltf,
    '/models/prop_crate.glb': crateGltf,
    '/models/prop_fence.glb': fenceGltf,
    '/models/prop_stump.glb': stumpGltf,
    '/models/prop_torch.glb': torchGltf,
    '/models/env_baroque_candelabra.glb': candelabraGltf,
    '/models/env_baroque_column.glb': columnBaroqueGltf,
    '/models/env_classical_column.glb': columnClassicalGltf,
    '/models/env_classical_piano.glb': pianoGltf,
    '/models/env_romantic_arch.glb': archGltf,
    '/models/env_romantic_rose.glb': roseGltf,
    '/models/env_modern_djconsole.glb': djGltf,
    '/models/env_modern_speaker.glb': speakerGltf,
  }
  const scene = gltfMap[prop.modelPath]?.scene ?? null

  const model = useMemo(() => {
    if (!scene) return null
    const cloned = scene.clone(true)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              const m = mat.clone()
              m.color.set(dim.themeColor)
              m.roughness = 0.85
              return m
            }
            return mat
          })
        } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const m = mesh.material.clone()
          m.color.set(dim.themeColor)
          m.roughness = 0.85
          mesh.material = m
        }
      }
    })
    return cloned
  }, [scene, dim.themeColor])

  if (!model) return null
  return (
    <group ref={groupRef} position={[prop.x, 0, prop.z]} scale={[prop.scale, prop.scale, prop.scale]}>
      <primitive object={model} />
    </group>
  )
}

function SceneProps({ map, seed, dimensionId }: { map: number[][]; seed: number; dimensionId: string }) {
  const props = useMemo(() => {
    const rng = mulberry32(seed + 9999)
    const result: ScenePropData[] = []
    const dimPropMap: Record<string, string[]> = {
      baroque: ['/models/env_baroque_candelabra.glb', '/models/env_baroque_column.glb', '/models/prop_barrel.glb', '/models/prop_torch.glb'],
      classical: ['/models/env_classical_column.glb', '/models/env_classical_piano.glb', '/models/prop_crate.glb', '/models/prop_fence.glb'],
      romantic: ['/models/env_romantic_arch.glb', '/models/env_romantic_rose.glb', '/models/prop_stump.glb', '/models/prop_torch.glb'],
      modern: ['/models/env_modern_djconsole.glb', '/models/env_modern_speaker.glb', '/models/prop_crate.glb', '/models/prop_barrel.glb'],
    }
    const propModels = dimPropMap[dimensionId] || dimPropMap.baroque
    let propId = 0
    for (let z = 2; z < WORLD_HEIGHT - 2; z += 3) {
      for (let x = 2; x < WORLD_WIDTH - 2; x += 3) {
        if (map[z][x] !== TILE_EMPTY) continue
        // Skip center spawn area
        if (Math.abs(x - WORLD_WIDTH / 2) < 4 && Math.abs(z - WORLD_HEIGHT / 2) < 4) continue
        if (rng() > 0.15) continue // ~15% of empty tiles get a prop
        const modelIdx = Math.floor(rng() * propModels.length)
        const sc = 0.5 + rng() * 0.5
        result.push({
          x: x * TILE_SIZE, z: z * TILE_SIZE,
          modelPath: propModels[modelIdx],
          scale: sc,
          id: 'prop_' + dimensionId + '_' + (propId++),
          dimensionId,
        })
      }
    }
    return result
  }, [map, seed, dimensionId])

  return (
    <group>
      {props.map(p => <ScenePropMesh key={p.id} prop={p} />)}
    </group>
  )
}

function GameLoop({ map, monstersRef, bombsRef, explosionsRef, playerRef, onMonsterBombPlace }: {
  map: number[][]; monstersRef: React.MutableRefObject<MonsterData[]>
  bombsRef: React.MutableRefObject<BombInstance[]>
  explosionsRef: React.MutableRefObject<Array<{ id: number; x: number; z: number; radius: number }>>
  playerRef: React.MutableRefObject<RapierRigidBody | null>
  onMonsterBombPlace: (x: number, z: number, radius: number) => void
}) {
  const phase = useGameStore(s => s.phase)
  const frameCount = useRef(0)
  useFrame((_, delta) => {
    if (phase !== 'playing') return
    frameCount.current++
    if (frameCount.current % 2 !== 0) return
    const dt = Math.min(delta, 0.05) * 2
    const monsters = monstersRef.current
    const bombs = bombsRef.current
    let px = 0, pz = 0
    if (playerRef.current) { const p = playerRef.current.translation(); px = p.x; pz = p.z }

    for (const m of monsters) {
      if (!m.alive) {
        m.respawnTimer -= dt
        if (m.respawnTimer <= 0) {
          let rx: number, rz: number, attempts = 0
          do { rx = Math.floor(Math.random() * (WORLD_WIDTH - 4)) + 2; rz = Math.floor(Math.random() * (WORLD_HEIGHT - 4)) + 2; attempts++ }
          while ((!map[rz] || map[rz][rx] !== TILE_EMPTY) && attempts < 50)
          if (attempts < 50) { m.x = rx * TILE_SIZE; m.z = rz * TILE_SIZE; m.hp = m.maxHp; m.alive = true; m.state = 'idle'; m.stateTimer = 2; m.attackCooldown = 0 }
        }
        continue
      }
      m.stateTimer -= dt
      m.attackCooldown = Math.max(0, m.attackCooldown - dt)
      const dx = px - m.x, dz = pz - m.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < m.aggroRange * 1.8) { m.state = 'chase'; m.stateTimer = 8 }
      if (bombs.length > 0 && isInBlastZone(m.x, m.z, bombs, map)) {
        if (Math.random() < monsterDodgeChance(m.type) * dt * 3) {
          const safe = findSafeCell(m.x, m.z, map, bombs)
          if (safe) {
            const sdx = safe.x - m.x, sdz = safe.z - m.z, sd = Math.sqrt(sdx * sdx + sdz * sdz)
            if (sd > 0.1) { m.x += (sdx / sd) * m.speed * 2 * dt; m.z += (sdz / sd) * m.speed * 2 * dt }
            continue
          }
        }
      }
      switch (m.state) {
        case 'idle':
          if (dist < m.aggroRange) { m.state = 'chase'; m.stateTimer = 8 }
          else if (m.stateTimer <= 0) { m.state = 'patrol'; m.targetX = m.x + (Math.random() - 0.5) * 10; m.targetZ = m.z + (Math.random() - 0.5) * 10; m.stateTimer = 3 + Math.random() * 4 }
          break
        case 'patrol': {
          const pdx = m.targetX - m.x, pdz = m.targetZ - m.z, pd = Math.sqrt(pdx * pdx + pdz * pdz)
          if (pd < 0.5 || m.stateTimer <= 0) { m.state = 'idle'; m.stateTimer = 2 }
          else { m.x += (pdx / pd) * m.speed * 0.4 * dt; m.z += (pdz / pd) * m.speed * 0.4 * dt }
          if (dist < m.aggroRange) { m.state = 'chase'; m.stateTimer = 8 }
          break
        }
        case 'chase':
          if (dist < 1.8) { m.state = 'attack'; m.stateTimer = 1.2 }
          else if (dist > m.aggroRange * 1.5 || m.stateTimer <= 0) { m.state = 'idle'; m.stateTimer = 3 }
          else { m.x += (dx / dist) * m.speed * dt; m.z += (dz / dist) * m.speed * dt }
          break
        case 'attack':
          if (m.attackCooldown <= 0) {
            const bx = Math.round(m.x / TILE_SIZE) * TILE_SIZE, bz = Math.round(m.z / TILE_SIZE) * TILE_SIZE
            onMonsterBombPlace(bx, bz, monsterBombRadius(m.type))
            m.attackCooldown = m.type === MONSTER_BOSS ? 2.0 : m.type === MONSTER_FOREST ? 3.0 : 4.0
          }
          if (m.stateTimer <= 0) { m.state = dist < m.aggroRange ? 'chase' : 'idle'; m.stateTimer = 2 }
          break
      }
    }
  })
  return null
}

function CameraController({ playerRef }: { playerRef: React.MutableRefObject<RapierRigidBody | null> }) {
  const { camera } = useThree()
  const cameraMode = useGameStore(s => s.cameraMode)
  const cameraAngle = useGameStore(s => s.cameraAngle)
  const cameraPitch = useGameStore(s => s.cameraPitch)
  const cameraDistance = useGameStore(s => s.cameraDistance)
  const setCameraAngle = useGameStore(s => s.setCameraAngle)
  const setCameraPitch = useGameStore(s => s.setCameraPitch)
  const setCameraDistance = useGameStore(s => s.setCameraDistance)
  const phase = useGameStore(s => s.phase)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const currentAngle = useRef(0)
  const currentPitch = useRef(Math.PI / 4)
  const currentDist = useRef(18)
  const targetPos = useRef(new THREE.Vector3())

  useEffect(() => {
    const onWheel = (e: WheelEvent) => { if (phase !== 'playing') return; e.preventDefault(); setCameraDistance(cameraDistance + e.deltaY * 0.01) }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [cameraDistance, setCameraDistance, phase])

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => { if (phase !== 'playing' || cameraMode !== '3d') return; if (e.button === 2) { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } } }
    const onMouseMove = (e: MouseEvent) => { if (!isDragging.current) return; const dx = e.clientX - lastMouse.current.x; const dy = e.clientY - lastMouse.current.y; lastMouse.current = { x: e.clientX, y: e.clientY }; setCameraAngle(cameraAngle - dx * 0.005); setCameraPitch(cameraPitch - dy * 0.005) }
    const onMouseUp = (e: MouseEvent) => { if (e.button === 2) isDragging.current = false }
    const onContext = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('mousedown', onMouseDown); window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); window.addEventListener('contextmenu', onContext)
    return () => { window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('contextmenu', onContext) }
  }, [cameraMode, cameraAngle, cameraPitch, setCameraAngle, setCameraPitch, phase])

  useFrame((_, delta) => {
    if (phase !== 'playing' || !playerRef.current) return
    const dt = Math.min(delta, 0.05)
    const pos = playerRef.current.translation()
    if (cameraMode === '2.5d') {
      camera.position.lerp(new THREE.Vector3(pos.x, pos.y + currentDist.current, pos.z + currentDist.current * 0.6), 4 * dt)
      targetPos.current.lerp(new THREE.Vector3(pos.x, 0, pos.z), 4 * dt)
      camera.lookAt(targetPos.current)
    } else {
      currentAngle.current += (cameraAngle - currentAngle.current) * 4 * dt
      currentPitch.current += (cameraPitch - currentPitch.current) * 4 * dt
      currentDist.current += (cameraDistance - currentDist.current) * 4 * dt
      const phi = currentPitch.current, theta = currentAngle.current, dist = currentDist.current
      camera.position.lerp(new THREE.Vector3(pos.x + dist * Math.sin(phi) * Math.sin(theta), pos.y + dist * Math.cos(phi), pos.z + dist * Math.sin(phi) * Math.cos(theta)), 6 * dt)
      targetPos.current.lerp(new THREE.Vector3(pos.x, 0, pos.z), 6 * dt)
      camera.lookAt(targetPos.current)
    }
  })
  return null
}

function castAbility(key: string, pos: { x: number; y: number; z: number }, monsters: MonsterData[], player: { attack: number }) {
  const store = useGameStore.getState()
  switch (key) {
    case 'w': {
      audio.play('bomb_place'); const wLine = getHeroDialogue(store.selectedHeroId, 'ability', 'W'); store.addNotification(wLine || '连锁技能发动！', 'info')
      for (const m of monsters) {
        if (!m.alive) continue
        const d = Math.sqrt((m.x - pos.x) ** 2 + (m.z - pos.z) ** 2)
        if (d < 6) {
          const dmg = player.attack * 2; m.hp -= dmg; store.addDamageDealt(dmg)
          store.addFloatingDamage(m.x, 2, m.z, '-' + dmg, '#ff9800'); store.addCombo(); audio.play('monster_hit')
          if (m.hp <= 0) { m.alive = false; m.respawnTimer = 10 + Math.random() * 10; m.state = 'dead'; store.addXp(m.xpReward); store.killMonster(); store.waveMonsterKilled(); store.addFloatingDamage(m.x, 3, m.z, '+' + m.xpReward + ' XP', '#ffd54f'); const qid = store.activeQuestId; if (qid) store.updateQuestProgress(qid, qid + '_kill', 1) }
        }
      }
      break
    }
    case 'e': { store.setShield(true, 1.5); const eLine = getHeroDialogue(store.selectedHeroId, 'ability', 'E'); store.addNotification(eLine || '护盾激活！', 'info'); audio.play('shield_activate'); break }
    case 'r': {
      const rLine = getHeroDialogue(store.selectedHeroId, 'ability', 'R'); store.addNotification(rLine || '终极技能发动！', 'info'); audio.play('bomb_explode')
      for (const m of monsters) {
        if (!m.alive) continue
        const d = Math.sqrt((m.x - pos.x) ** 2 + (m.z - pos.z) ** 2)
        if (d < 12) {
          const dmg = player.attack * 4; m.hp -= dmg; store.addDamageDealt(dmg)
          store.addFloatingDamage(m.x, 2, m.z, '-' + dmg, '#e040fb'); store.addCombo()
          if (m.hp <= 0) { m.alive = false; m.respawnTimer = 15 + Math.random() * 10; m.state = 'dead'; store.addXp(m.xpReward * 2); store.killMonster(); store.waveMonsterKilled(); store.addFloatingDamage(m.x, 3, m.z, '+' + m.xpReward * 2 + ' XP', '#ffd54f'); const qid = store.activeQuestId; if (qid) store.updateQuestProgress(qid, qid + '_kill', 1) }
        }
      }
      break
    }
  }
}
const fogVert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
const fogFrag = 'uniform vec2 uPlayerPos; uniform vec2 uWorldSize; uniform float uVisibleRadius; uniform float uEdgeSoftness; varying vec2 vUv; void main() { vec2 worldPos = vUv * uWorldSize; float dist = distance(worldPos, uPlayerPos); float vis = smoothstep(uVisibleRadius, uVisibleRadius - uEdgeSoftness, dist); float alpha = 1.0 - vis; gl_FragColor = vec4(0.0, 0.0, 0.05, alpha * 0.85); }'

function FogOfWar({ playerRef }: { playerRef: React.MutableRefObject<RapierRigidBody | null> }) {
  const fogRef = useRef<THREE.ShaderMaterial>(null!)
  const enabled = useGameStore(s => s.fogOfWarEnabled)
  const uniforms = useMemo(() => ({
    uPlayerPos: { value: new THREE.Vector2(0, 0) },
    uWorldSize: { value: new THREE.Vector2(WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE) },
    uVisibleRadius: { value: 20.0 }, uEdgeSoftness: { value: 8.0 },
  }), [])
  useFrame(() => { if (!fogRef.current || !playerRef.current) return; const pos = playerRef.current.translation(); fogRef.current.uniforms.uPlayerPos.value.set(pos.x, pos.z) })
  if (!enabled) return null
  return (
    <mesh position={[WORLD_WIDTH * TILE_SIZE / 2, 2, WORLD_HEIGHT * TILE_SIZE / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
      <planeGeometry args={[WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE]} />
      <shaderMaterial ref={fogRef} vertexShader={fogVert} fragmentShader={fogFrag} uniforms={uniforms} transparent depthWrite={false} depthTest={false} />
    </mesh>
  )
}

function WaveController({ monstersRef, map, seed, dimensionId }: { monstersRef: React.MutableRefObject<MonsterData[]>; map: number[][]; seed: number; dimensionId: string }) {
  const phase = useGameStore(s => s.phase)
  const waveAnnouncement = useGameStore(s => s.waveAnnouncement)
  const lastSpawnedWave = useRef(0)
  const dim = DIMENSIONS[dimensionId] || DIMENSIONS.baroque
  useFrame((_, delta) => {
    if (phase !== 'playing') return
    const dt = Math.min(delta, 0.05)
    if (waveAnnouncement) { const timer = useGameStore.getState().waveTimer + dt; useGameStore.setState({ waveTimer: timer }); if (timer > 3) useGameStore.setState({ waveAnnouncement: null, waveTimer: 0 }) }
    const { currentWave, waveActive } = useGameStore.getState()
    if (!waveActive && lastSpawnedWave.current === currentWave) {
      const nextWave = currentWave + 1; const monsterCount = 5 + nextWave * 3; lastSpawnedWave.current = nextWave
      useGameStore.getState().startWave(nextWave, monsterCount)
      const rng = mulberry32(seed + nextWave * 777)
      for (let i = 0; i < monsterCount; i++) {
        let x: number, z: number, attempts = 0
        do { x = Math.floor(rng() * (WORLD_WIDTH - 4)) + 2; z = Math.floor(rng() * (WORLD_HEIGHT - 4)) + 2; attempts++ }
        while ((!map[z] || map[z][x] !== TILE_EMPTY || (Math.abs(x - WORLD_WIDTH / 2) < 5 && Math.abs(z - WORLD_HEIGHT / 2) < 5)) && attempts < 100)
        if (attempts >= 100) continue
        const t = i < monsterCount * 0.5 ? 0 : i < monsterCount * 0.8 ? 1 : 2
        const cfg = dim.monsterTypes[t]
        monstersRef.current.push({ id: monstersRef.current.length + i, x: x * TILE_SIZE, z: z * TILE_SIZE, type: cfg.type, hp: cfg.hp + nextWave * 10, maxHp: cfg.hp + nextWave * 10, attack: cfg.atk + nextWave, speed: cfg.speed, xpReward: cfg.xp + nextWave * 5, alive: true, respawnTimer: 0, aggroRange: cfg.range, state: 'idle', targetX: x * TILE_SIZE, targetZ: z * TILE_SIZE, stateTimer: 2 + rng() * 3, attackCooldown: 0 })
      }
    }
  })
  return null
}

function FloatingDamageItem({ damage }: { damage: { id: string; x: number; y: number; z: number; color: string } }) {
  const ref = useRef<THREE.Mesh>(null!); const matRef = useRef<THREE.MeshBasicMaterial>(null!); const startTime = useRef(Date.now())
  useFrame(() => {
    if (!ref.current || !matRef.current) return
    const progress = (Date.now() - startTime.current) / 1200
    if (progress >= 1) { ref.current.visible = false; return }
    ref.current.position.y = damage.y + progress * 2; matRef.current.opacity = Math.max(0, 1 - progress)
    const sc = 1 + progress * 0.3; ref.current.scale.set(sc * 0.5, sc * 0.25, 1)
  })
  return (
    <mesh ref={ref} position={[damage.x, damage.y, damage.z]} renderOrder={1000}>
      <planeGeometry args={[2, 1]} /><meshBasicMaterial ref={matRef} color={damage.color} transparent opacity={1} depthTest={false} />
    </mesh>
  )
}
function FloatingDamageRenderer() { const damages = useGameStore(s => s.floatingDamages); return <>{damages.map(d => <FloatingDamageItem key={d.id} damage={d} />)}</> }

function TransitionOverlay() {
  const isTransitioning = useGameStore(s => s.isTransitioning)
  const transitionProgress = useGameStore(s => s.transitionProgress)
  if (!isTransitioning) return null
  return (
    <mesh position={[WORLD_WIDTH * TILE_SIZE / 2, 5, WORLD_HEIGHT * TILE_SIZE / 2]} renderOrder={10000}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial color="#000" transparent opacity={Math.sin(transitionProgress * Math.PI)} depthTest={false} depthWrite={false} />
    </mesh>
  )
}

const CRITICAL_TEXTURES = ['/textures/wall.png', '/textures/destructible.png', '/textures/ground.png']

function AssetPreloader({ onReady }: { onReady: () => void }) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    let pending = CRITICAL_TEXTURES.length
    const finish = () => { if (--pending <= 0) { setLoaded(true); onReady() } }
    for (const path of CRITICAL_TEXTURES) {
      if (_texCache.has(path)) { finish(); continue }
      loader.load(path, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; _texCache.set(path, tex); finish() }, undefined, () => { createFallbackTexture(getFallbackColor(path), path); finish() })
    }
  }, [])
  if (loaded) return null
  return (
    <group><ambientLight intensity={1} /><mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#4fc3f7" emissive="#4fc3f7" emissiveIntensity={0.5} /></mesh></group>
  )
}

function SceneContent() {
  const phase = useGameStore(s => s.phase)
  const worldSeed = useGameStore(s => s.worldSeed)
  const powerups = useGameStore(s => s.powerups)
  const currentDimension = useGameStore(s => s.currentDimension)
  const setMinimapData = useGameStore(s => s.setMinimapData)
  const setPortals = useGameStore(s => s.setPortals)
  const dim = DIMENSIONS[currentDimension] || DIMENSIONS.baroque

  const map = useMemo(() => {
    const chunk = generateChunk(currentDimension, 0, 0, worldSeed)
    return chunk.tiles
  }, [currentDimension, worldSeed])

  const portalsData = useMemo(() => {
    const chunk = generateChunk(currentDimension, 0, 0, worldSeed)
    return chunk.portals.map((p, i) => ({ id: 'portal_' + currentDimension + '_' + i, x: p.x, z: p.z, targetDimension: p.targetDimension }))
  }, [currentDimension, worldSeed])

  useEffect(() => { setPortals(portalsData); setMinimapData(map, [], useGameStore.getState().playerWorldPos, portalsData) }, [portalsData, map, setPortals, setMinimapData])
  useEffect(() => {
    if (phase === 'playing') {
      audio.playMusic(useGameStore.getState().selectedHeroId)
      const st = useGameStore.getState()
      const spawnLine = getHeroDialogue(st.selectedHeroId, 'spawn')
      if (spawnLine) setTimeout(() => st.addNotification(spawnLine, 'info'), 800)
    }
    return () => { audio.stopMusic() }
  }, [phase])

  const monstersRef = useRef<MonsterData[]>([])
  const bombsRef = useRef<BombInstance[]>([])
  const explosionsRef = useRef<Array<{ id: number; x: number; z: number; radius: number }>>([])
  const playerRef = useRef<RapierRigidBody | null>(null)
  const emitParticlesRef = useRef<((pos: [number,number,number], preset: string) => void) | null>(null)
  const [bombs, setBombs] = useState<BombInstance[]>([])
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; z: number; radius: number }>>([])
  const [monsterState, setMonsterState] = useState<MonsterData[]>([])
  const nextBombId = useRef(0)
  const nextExplosionId = useRef(0)

  useEffect(() => {
    const chunk = generateChunk(currentDimension, 0, 0, worldSeed)
    const mt = dim.monsterTypes
    monstersRef.current = chunk.monsters.map((m, i) => ({
      id: i, x: m.x, z: m.z, type: mt[m.type]?.type ?? 0,
      hp: mt[m.type]?.hp ?? 30, maxHp: mt[m.type]?.hp ?? 30,
      attack: mt[m.type]?.atk ?? 3, speed: mt[m.type]?.speed ?? 2, xpReward: mt[m.type]?.xp ?? 12,
      alive: true, respawnTimer: 0, aggroRange: mt[m.type]?.range ?? 6,
      state: 'idle' as const, targetX: m.x, targetZ: m.z, stateTimer: 2 + Math.random() * 3, attackCooldown: 0,
    }))
    setMonsterState([...monstersRef.current])
  }, [currentDimension, worldSeed, dim])

  const frameCount = useRef(0)
  useFrame(() => {
    frameCount.current++
    if (frameCount.current % 10 === 0) {
      setMonsterState([...monstersRef.current])
      const monsters = monstersRef.current.map(m => ({ x: m.x, z: m.z, type: m.type, alive: m.alive }))
      useGameStore.getState().setMinimapData(map, monsters, useGameStore.getState().playerWorldPos, portalsData)
    }
  })

  const handleBombPlace = useCallback((x: number, z: number) => {
    bombsRef.current.push({ id: nextBombId.current++, x, z, timer: 2.5, radius: useGameStore.getState().player.bombPower, exploded: false })
    setBombs([...bombsRef.current])
  }, [])

  const handleMonsterBombPlace = useCallback((x: number, z: number, radius: number) => {
    if (bombsRef.current.some(b => Math.abs(b.x - x) < 0.5 && Math.abs(b.z - z) < 0.5)) return
    bombsRef.current.push({ id: nextBombId.current++, x, z, timer: 3.0, radius, exploded: false, isMonsterBomb: true })
    setBombs([...bombsRef.current])
  }, [])

  const handlePortalEnter = useCallback((portal: PortalInstance) => {
    const store = useGameStore.getState()
    if (store.isTransitioning) return
    const portalLine = getHeroDialogue(store.selectedHeroId, 'portal')
    store.addNotification(portalLine || ('绌胯秺铏礊 -> ' + (DIMENSIONS[portal.targetDimension]?.name || portal.targetDimension)), 'info')
    store.addNotification(portalLine || ('绌胯秺铏礊 -> ' + (DIMENSIONS[portal.targetDimension]?.name || portal.targetDimension)), 'info')
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.02; store.setTransitionProgress(progress)
      if (progress >= 1) {
        clearInterval(interval)
        store.setDimension(portal.targetDimension); store.unlockDimension(portal.targetDimension)
        if (store.activeQuestId) store.updateQuestProgress(store.activeQuestId, 'q2_reach', 1)
        if (playerRef.current) {
          playerRef.current.setTranslation({ x: WORLD_WIDTH / 2 * TILE_SIZE, y: 0.5, z: WORLD_HEIGHT / 2 * TILE_SIZE }, true)
          playerRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
        bombsRef.current = []; explosionsRef.current = []; setBombs([]); setExplosions([])
        let fadeOut = 1
        const fadeInterval = setInterval(() => {
          fadeOut -= 0.03; store.setTransitionProgress(Math.max(0, fadeOut))
          if (fadeOut <= 0) { clearInterval(fadeInterval); store.setTransitioning(false); store.addNotification('到达 ' + (DIMENSIONS[portal.targetDimension]?.name || '新维度') + '!', 'info') }
        }, 16)
      }
    }, 16)
  }, [])

  const handleBombExplode = useCallback((bomb: BombInstance) => {
    const toExplode: BombInstance[] = [bomb]; const checked = new Set<number>([bomb.id])
    for (let idx = 0; idx < toExplode.length; idx++) {
      const b = toExplode[idx]; const bx = Math.round(b.x / TILE_SIZE), bz = Math.round(b.z / TILE_SIZE)
      for (const other of bombsRef.current) {
        if (checked.has(other.id) || other.exploded) continue
        const ox = Math.round(other.x / TILE_SIZE), oz = Math.round(other.z / TILE_SIZE)
        const inH = bz === oz && Math.abs(bx - ox) <= b.radius; const inV = bx === ox && Math.abs(bz - oz) <= b.radius
        if (inH || inV) {
          let blocked = false
          if (inH) { const step = ox > bx ? 1 : -1; for (let i = bx + step; i !== ox; i += step) { if (i >= 0 && i < WORLD_WIDTH && map[bz] && map[bz][i] === TILE_WALL) { blocked = true; break } } }
          else { const step = oz > bz ? 1 : -1; for (let i = bz + step; i !== oz; i += step) { if (i >= 0 && i < WORLD_HEIGHT && map[i] && map[i][bx] === TILE_WALL) { blocked = true; break } } }
          if (!blocked) { checked.add(other.id); other.exploded = true; toExplode.push(other) }
        }
      }
    }
    const chainedIds = new Set(toExplode.map(b => b.id)); bombsRef.current = bombsRef.current.filter(b => !chainedIds.has(b.id)); setBombs([...bombsRef.current])
    for (const b of toExplode) {
      explosionsRef.current.push({ id: nextExplosionId.current++, x: b.x, z: b.z, radius: b.radius })
      for (let i = -b.radius; i <= b.radius; i++) {
        const hx = Math.round(b.x / TILE_SIZE) + i, hz = Math.round(b.z / TILE_SIZE)
        const vx = Math.round(b.x / TILE_SIZE), vz = Math.round(b.z / TILE_SIZE) + i
        if (hx >= 0 && hx < WORLD_WIDTH && hz >= 0 && hz < WORLD_HEIGHT && map[hz] && map[hz][hx] === TILE_DESTRUCTIBLE) { map[hz][hx] = TILE_EMPTY; useGameStore.getState().addPowerup(hx * TILE_SIZE, hz * TILE_SIZE, POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]) }
        if (i !== 0 && vx >= 0 && vx < WORLD_WIDTH && vz >= 0 && vz < WORLD_HEIGHT && map[vz] && map[vz][vx] === TILE_DESTRUCTIBLE) { map[vz][vx] = TILE_EMPTY; useGameStore.getState().addPowerup(vx * TILE_SIZE, vz * TILE_SIZE, POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]) }
      }
      if (!b.isMonsterBomb) {
        for (const m of monstersRef.current) {
          if (!m.alive) continue
          const bx2 = Math.round(b.x / TILE_SIZE), bz2 = Math.round(b.z / TILE_SIZE), mx = Math.round(m.x / TILE_SIZE), mz = Math.round(m.z / TILE_SIZE)
          if (bx2 === mx || bz2 === mz) {
            const dist = Math.abs(bx2 - mx) + Math.abs(bz2 - mz)
            if (dist <= b.radius) {
              let blocked = false
              if (bx2 === mx) { const step = mz > bz2 ? 1 : -1; for (let i = bz2 + step; i !== mz; i += step) { if (i >= 0 && i < WORLD_HEIGHT && map[i] && map[i][bx2] === TILE_WALL) { blocked = true; break } } }
              else { const step = mx > bx2 ? 1 : -1; for (let i = bx2 + step; i !== mx; i += step) { if (i >= 0 && i < WORLD_WIDTH && map[bz2] && map[bz2][i] === TILE_WALL) { blocked = true; break } } }
              if (!blocked) { const dmg = 25 + useGameStore.getState().player.attack; m.hp -= dmg; useGameStore.getState().addDamageDealt(dmg); useGameStore.getState().addFloatingDamage(m.x, 2, m.z, '-' + dmg, '#ff9800'); audio.play('monster_hit'); if (m.hp <= 0) { m.alive = false; m.respawnTimer = 10 + Math.random() * 10; m.state = 'dead'; const st = useGameStore.getState(); st.addXp(m.xpReward); st.killMonster(); st.waveMonsterKilled(); st.addFloatingDamage(m.x, 3, m.z, '+' + m.xpReward + ' XP', '#ffd54f'); if (st.activeQuestId) st.updateQuestProgress(st.activeQuestId, st.activeQuestId + '_kill', 1)
              const killLine = getHeroDialogue(st.selectedHeroId, 'kill')
              if (killLine) st.addNotification(killLine, 'info')
            } }
            }
          }
        }
      }
      if (playerRef.current) {
        const pos = playerRef.current.translation(); const bx3 = Math.round(b.x / TILE_SIZE), bz3 = Math.round(b.z / TILE_SIZE); const px = Math.round(pos.x / TILE_SIZE), pz = Math.round(pos.z / TILE_SIZE)
        if (bx3 === px || bz3 === pz) {
          const dist = Math.abs(bx3 - px) + Math.abs(bz3 - pz)
          if (dist <= b.radius) {
            let blocked = false
            if (bx3 === px) { const step = pz > bz3 ? 1 : -1; for (let i = bz3 + step; i !== pz; i += step) { if (i >= 0 && i < WORLD_HEIGHT && map[i] && map[i][bx3] === TILE_WALL) { blocked = true; break } } }
            else { const step = px > bx3 ? 1 : -1; for (let i = bx3 + step; i !== px; i += step) { if (i >= 0 && i < WORLD_WIDTH && map[bz3] && map[bz3][i] === TILE_WALL) { blocked = true; break } } }
            if (!blocked) useGameStore.getState().takeDamage(8)
          }
        }
      }
    }
    if (emitParticlesRef.current) { for (const b of toExplode) { emitParticlesRef.current([b.x, 0.5, b.z], 'explosion_sparks'); emitParticlesRef.current([b.x, 0.3, b.z], 'explosion_smoke'); emitParticlesRef.current([b.x, 0.2, b.z], 'explosion_shockwave') } }
    setExplosions([...explosionsRef.current])
  }, [map])

  const handleExplosionDone = useCallback((id: number) => { explosionsRef.current = explosionsRef.current.filter(e => e.id !== id); setExplosions([...explosionsRef.current]) }, [])

  if (phase !== 'playing' && phase !== 'paused') return null

  return (
    <>
      <ambientLight intensity={dim.ambientIntensity} />
      <directionalLight position={[50, 80, 30]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={120} shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={50} shadow-camera-bottom={-50} />
      <fog attach="fog" args={[dim.fogColor, dim.fogNear, dim.fogFar]} />
      <Physics gravity={[0, 0, 0]} timeStep={1/60}>
        <Ground dimensionId={currentDimension} /><WallColliders map={map} /><BombColliders bombs={bombs} />
        <Player map={map} monsters={monstersRef.current} onBombPlace={handleBombPlace} playerRef={playerRef} portals={portalsData} onPortalEnter={handlePortalEnter} />
      </Physics>
      <InstancedTiles map={map} dimensionId={currentDimension} />
      {bombs.map(b => <Bomb key={b.id} bomb={b} onExplode={handleBombExplode} />)}
      {explosions.map(e => <Explosion key={e.id} x={e.x} z={e.z} radius={e.radius} onDone={handleExplosionDone} explosionId={e.id} />)}
      <MonsterRenderer monsters={monsterState} dimensionId={currentDimension} />
      <PowerupRenderer powerups={powerups} /><PortalSystem portals={portalsData} />
      <SceneProps map={map} seed={worldSeed} dimensionId={currentDimension} />
      <GameLoop map={map} monstersRef={monstersRef} bombsRef={bombsRef} explosionsRef={explosionsRef} playerRef={playerRef} onMonsterBombPlace={handleMonsterBombPlace} />
      <WaveController monstersRef={monstersRef} map={map} seed={worldSeed} dimensionId={currentDimension} />
      <GlobalParticleSystem onReady={(emit) => { emitParticlesRef.current = emit }} />
      <FloatingDamageRenderer /><CameraController playerRef={playerRef} /><FogOfWar playerRef={playerRef} /><TransitionOverlay />
    </>
  )
}

const _deviceProfile = detectDevice()

export function GameScene() {
  const [assetsReady, setAssetsReady] = useState(false)
  useEffect(() => { audio.init(); try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl'); if (gl) { const dbg = gl.getExtension('WEBGL_debug_renderer_info'); if (dbg) console.log('[GPU]', gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) } } catch {} }, [])
  return (
    <Canvas camera={{ position: [0, 20, 15], fov: 50, near: 0.5, far: 200 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true, failIfMajorPerformanceCaveat: false }}
      dpr={[1, 1.25]} frameloop="always" performance={{ min: 0.5 }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#1a1a2e')
        gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); console.warn('WebGL context lost') })
        gl.domElement.addEventListener('webglcontextrestored', () => { console.log('WebGL context restored') })
      }}>
      <Suspense fallback={null}>
        {!assetsReady && <AssetPreloader onReady={() => setAssetsReady(true)} />}
        {assetsReady && <SceneContent />}
      </Suspense>
    </Canvas>
  )
}










