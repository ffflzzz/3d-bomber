import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PowerupType } from './store'

const POWERUP_COLORS: Record<PowerupType, string> = {
  bomb_up: '#ff6f00',
  fire_up: '#f44336',
  speed_up: '#2196f3',
  shield: '#9c27b0',
  kick: '#4caf50',
  remote: '#ffeb3b',
}

interface PowerupMeshProps {
  x: number
  z: number
  type: PowerupType
}

function PowerupMesh({ x, z, type }: PowerupMeshProps) {
  const ref = useRef<THREE.Mesh>(null)
  const color = POWERUP_COLORS[type]

  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += 0.03
    ref.current.position.y = 0.6 + Math.sin(Date.now() * 0.003) * 0.15
  })

  return (
    <mesh ref={ref} position={[x, 0.6, z]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  )
}

interface PowerupRendererProps {
  powerups: Array<{ id: number; x: number; z: number; type: PowerupType; collected: boolean }>
}

export function PowerupRenderer({ powerups }: PowerupRendererProps) {
  return (
    <>
      {powerups.filter(p => !p.collected).map(p => (
        <PowerupMesh key={p.id} x={p.x} z={p.z} type={p.type} />
      ))}
    </>
  )
}
