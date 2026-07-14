import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TILE_EMPTY, TILE_WALL, TILE_DESTRUCTIBLE, TILE_GRASS } from '../../utils/constants'
import type { DimensionConfig } from './configs'
import { DIMENSIONS } from './configs'

// Seeded RNG (mulberry32)
function mulberry32(a: number) {
  return () => {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export interface ChunkData {
  key: string
  cx: number
  cz: number
  tiles: number[][]
  portals: Array<{ x: number; z: number; targetDimension: string }>
  monsters: Array<{ x: number; z: number; type: number }>
}

/**
 * Generate a chunk of terrain for a given dimension.
 * Each chunk is WORLD_WIDTH x WORLD_HEIGHT tiles.
 * The chunk key includes dimension and chunk coordinates for caching.
 */
export function generateChunk(
  dimensionId: string,
  cx: number,
  cz: number,
  seed: number
): ChunkData {
  const dim = DIMENSIONS[dimensionId] || DIMENSIONS.verdant
  const chunkSeed = seed + cx * 1000 + cz * 7777 + hashString(dimensionId)
  const rng = mulberry32(chunkSeed)

  const tiles: number[][] = []
  for (let z = 0; z < WORLD_HEIGHT; z++) {
    tiles[z] = []
    for (let x = 0; x < WORLD_WIDTH; x++) {
      // Border walls
      if (x === 0 || x === WORLD_WIDTH - 1 || z === 0 || z === WORLD_HEIGHT - 1) {
        tiles[z][x] = TILE_WALL
      }
      // Pillar pattern (every other cell)
      else if (x % 2 === 0 && z % 2 === 0) {
        tiles[z][x] = TILE_WALL
      }
      // Destructible blocks
      else if (rng() < dim.destructibleDensity) {
        tiles[z][x] = TILE_DESTRUCTIBLE
      }
      // Grass/decoration
      else if (rng() < dim.grassDensity) {
        tiles[z][x] = TILE_GRASS
      }
      // Empty
      else {
        tiles[z][x] = TILE_EMPTY
      }
    }
  }

  // Clear spawn area (center)
  const halfW = Math.floor(WORLD_WIDTH / 2)
  const halfH = Math.floor(WORLD_HEIGHT / 2)
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = halfW + dx
      const gz = halfH + dz
      if (gx >= 0 && gx < WORLD_WIDTH && gz >= 0 && gz < WORLD_HEIGHT) {
        tiles[gz][gx] = TILE_EMPTY
      }
    }
  }

  // Generate portals (2-3 per chunk)
  const portalCount = 2 + Math.floor(rng() * 2)
  const portals: ChunkData['portals'] = []
  const targets = dim.portalTargets
  for (let i = 0; i < portalCount; i++) {
    let px: number, pz: number, attempts = 0
    do {
      px = Math.floor(rng() * (WORLD_WIDTH - 6)) + 3
      pz = Math.floor(rng() * (WORLD_HEIGHT - 6)) + 3
      attempts++
    } while (tiles[pz][px] !== TILE_EMPTY && attempts < 50)
    if (attempts < 50) {
      // Clear area around portal
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, nz = pz + dz
          if (nx > 0 && nx < WORLD_WIDTH - 1 && nz > 0 && nz < WORLD_HEIGHT - 1) {
            tiles[nz][nx] = TILE_EMPTY
          }
        }
      }
      const targetIdx = i % targets.length
      portals.push({
        x: px * TILE_SIZE,
        z: pz * TILE_SIZE,
        targetDimension: targets[targetIdx],
      })
    }
  }

  // Spawn positions for monsters
  const monsterPositions: ChunkData['monsters'] = []
  const monsterCount = dim.monsterCount
  for (let i = 0; i < monsterCount; i++) {
    let mx: number, mz: number, attempts = 0
    do {
      mx = Math.floor(rng() * (WORLD_WIDTH - 4)) + 2
      mz = Math.floor(rng() * (WORLD_HEIGHT - 4)) + 2
      attempts++
    } while (tiles[mz][mx] !== TILE_EMPTY && attempts < 50)
    if (attempts < 50) {
      monsterPositions.push({ x: mx * TILE_SIZE, z: mz * TILE_SIZE, type: i % 3 })
    }
  }

  return {
    key: `${dimensionId}_${cx}_${cz}`,
    cx,
    cz,
    tiles,
    portals,
    monsters: monsterPositions,
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}
