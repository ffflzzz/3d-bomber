import React, { useRef, useEffect } from 'react'
import { useGameStore } from '../../game/store'
import { DIMENSIONS } from '../../game/dimensions/configs'
import {
  TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT,
  TILE_EMPTY, TILE_WALL, TILE_DESTRUCTIBLE, TILE_GRASS,
} from '../../utils/constants'

interface MinimapProps {
  map: number[][]
  monsters: Array<{ x: number; z: number; type: number; alive: boolean }>
  playerPos: { x: number; z: number }
}

export function Minimap({ map, monsters, playerPos }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const showMinimap = useGameStore(s => s.showMinimap)
  const fogOfWarEnabled = useGameStore(s => s.fogOfWarEnabled)
  const currentDimension = useGameStore(s => s.currentDimension)
  const portals = useGameStore(s => s.minimapPortals)
  const dim = DIMENSIONS[currentDimension] || DIMENSIONS.verdant
  const mapImageData = useRef<ImageData | null>(null)

  // Pre-render static map base
  useEffect(() => {
    if (!map || map.length === 0) return
    const offscreen = document.createElement('canvas')
    offscreen.width = WORLD_WIDTH
    offscreen.height = WORLD_HEIGHT
    const ctx = offscreen.getContext('2d')!
    const imgData = ctx.createImageData(WORLD_WIDTH, WORLD_HEIGHT)

    // Parse dimension colors
    const dimGround = hexToRgb(dim.groundColor) || { r: 35, g: 40, b: 50 }
    const dimWall = hexToRgb(dim.wallColor) || { r: 75, g: 85, b: 100 }
    const dimDest = hexToRgb(dim.destructibleColor) || { r: 110, g: 85, b: 50 }
    const dimGrass = hexToRgb(dim.grassColor) || { r: 40, g: 75, b: 45 }

    for (let z = 0; z < WORLD_HEIGHT; z++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const idx = (z * WORLD_WIDTH + x) * 4
        let r = dimGround.r, g = dimGround.g, b = dimGround.b
        switch (map[z][x]) {
          case TILE_EMPTY: break
          case TILE_WALL: r = dimWall.r; g = dimWall.g; b = dimWall.b; break
          case TILE_DESTRUCTIBLE: r = dimDest.r; g = dimDest.g; b = dimDest.b; break
          case TILE_GRASS: r = dimGrass.r; g = dimGrass.g; b = dimGrass.b; break
        }
        imgData.data[idx] = r
        imgData.data[idx + 1] = g
        imgData.data[idx + 2] = b
        imgData.data[idx + 3] = 255
      }
    }
    mapImageData.current = imgData
  }, [map, currentDimension])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showMinimap) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    const w = canvas.width
    const h = canvas.height
    const scaleX = w / (WORLD_WIDTH * TILE_SIZE)
    const scaleZ = h / (WORLD_HEIGHT * TILE_SIZE)

    const render = () => {
      ctx.clearRect(0, 0, w, h)

      // Draw base map
      if (mapImageData.current) {
        const tmp = document.createElement('canvas')
        tmp.width = WORLD_WIDTH; tmp.height = WORLD_HEIGHT
        tmp.getContext('2d')!.putImageData(mapImageData.current, 0, 0)
        ctx.drawImage(tmp, 0, 0, w, h)
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= WORLD_WIDTH; i += 4) {
        const x = i / WORLD_WIDTH * w
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let i = 0; i <= WORLD_HEIGHT; i += 4) {
        const y = i / WORLD_HEIGHT * h
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      // Fog of war
      if (fogOfWarEnabled) {
        ctx.fillStyle = 'rgba(0, 0, 8, 0.8)'
        ctx.fillRect(0, 0, w, h)
        const px = playerPos.x * scaleX
        const pz = playerPos.z * scaleZ
        const visRadius = 22 * scaleX
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        const grad = ctx.createRadialGradient(px, pz, visRadius * 0.5, px, pz, visRadius)
        grad.addColorStop(0, 'rgba(0,0,0,1)')
        grad.addColorStop(0.7, 'rgba(0,0,0,0.8)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath(); ctx.arc(px, pz, visRadius, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      // Draw portals (pulsing markers)
      const now = Date.now()
      for (const portal of portals) {
        const ppx = portal.x * scaleX
        const ppz = portal.z * scaleZ
        const targetDim = DIMENSIONS[portal.targetDimension]
        const color = targetDim?.accentColor || '#ffd54f'
        const pulse = 3 + Math.sin(now * 0.005) * 1.5

        // Outer glow
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.fillStyle = color
        ctx.beginPath()
        // Diamond shape for portals
        ctx.moveTo(ppx, ppz - pulse)
        ctx.lineTo(ppx + pulse, ppz)
        ctx.lineTo(ppx, ppz + pulse)
        ctx.lineTo(ppx - pulse, ppz)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Draw monsters
      for (const m of monsters) {
        if (!m.alive) continue
        if (fogOfWarEnabled) {
          const dx = m.x - playerPos.x, dz = m.z - playerPos.z
          if (Math.sqrt(dx * dx + dz * dz) > 22) continue
        }
        const mx = m.x * scaleX
        const mz = m.z * scaleZ
        if (m.type >= 2 && m.type % 3 === 2) {
          // Boss: diamond
          ctx.fillStyle = '#c23c2a'
          ctx.beginPath()
          ctx.moveTo(mx, mz - 4); ctx.lineTo(mx + 3, mz); ctx.lineTo(mx, mz + 4); ctx.lineTo(mx - 3, mz)
          ctx.closePath(); ctx.fill()
        } else {
          ctx.fillStyle = m.type === 0 || m.type % 3 === 0 ? '#92a525' : '#8d6e63'
          ctx.beginPath(); ctx.arc(mx, mz, 2.5, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Draw player (Dota hero marker with glow)
      const px = playerPos.x * scaleX
      const pz = playerPos.z * scaleZ
      ctx.save()
      ctx.shadowColor = '#4fc3f7'
      ctx.shadowBlur = 8
      ctx.fillStyle = '#4fc3f7'
      ctx.beginPath(); ctx.arc(px, pz, 4, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(px, pz, 4, 0, Math.PI * 2); ctx.stroke()

      // Border
      ctx.strokeStyle = 'rgba(200, 168, 78, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1)

      animId = requestAnimationFrame(render)
    }
    render()
    return () => cancelAnimationFrame(animId)
  }, [showMinimap, fogOfWarEnabled, playerPos, monsters, portals])

  if (!showMinimap) return null

  return (
    <div className="minimap-container">
      <div className="minimap-header">
        <span className="minimap-label">{dim.name}</span>
        <span className="minimap-coords">
          ({Math.round(playerPos.x)}, {Math.round(playerPos.z)})
        </span>
      </div>
      <canvas ref={canvasRef} width={210} height={210} className="minimap-canvas" />
      <div className="minimap-legend">
        <span className="legend-player">● 玩家</span>
        <span className="legend-enemy">● 敌人</span>
        <span className="legend-boss">◆ BOSS</span>
        <span className="legend-portal">◆ 虫洞</span>
      </div>
    </div>
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null
}
