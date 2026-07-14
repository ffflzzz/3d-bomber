import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DIMENSIONS } from './configs'

interface PortalInstance {
  id: string
  x: number
  z: number
  targetDimension: string
}

// Single portal mesh with rotating energy vortex
function PortalMesh({ portal }: { portal: PortalInstance }) {
  const groupRef = useRef<THREE.Group>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)
  const particlesRef = useRef<THREE.Points>(null!)

  const targetDim = DIMENSIONS[portal.targetDimension] || DIMENSIONS.baroque
  const color = new THREE.Color(targetDim.themeColor)
  const accentColor = new THREE.Color(targetDim.accentColor)

  // Particle system for portal effect
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const count = 32
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 0.8 + Math.random() * 0.4
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = Math.sin(angle) * r
      sizes[i] = 0.1 + Math.random() * 0.15
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Rotate the portal ring
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 1.5
      ringRef.current.rotation.z = Math.sin(t * 0.5) * 0.1
    }

    // Pulse inner glow
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(t * 3) * 0.15
      innerRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08)
    }

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 2
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i)
        pos.setY(i, y + Math.sin(t * 3 + i) * 0.005)
      }
      pos.needsUpdate = true
    }

    // Gentle hover
    groupRef.current.position.y = 0.5 + Math.sin(t * 1.5) * 0.15
  })

  return (
    <group ref={groupRef} position={[portal.x, 0.5, portal.z]}>
      {/* Outer ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.0, 0.12, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner glowing disk */}
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical light column */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.3, 3, 8]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Particles */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          color={accentColor}
          size={0.15}
          transparent
          opacity={0.7}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Label above portal */}
      <mesh position={[0, 2.8, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color={color} transparent opacity={0.0} depthWrite={false} />
      </mesh>
    </group>
  )
}

interface PortalSystemProps {
  portals: PortalInstance[]
}

export function PortalSystem({ portals }: PortalSystemProps) {
  return (
    <group>
      {portals.map((p) => (
        <PortalMesh key={p.id} portal={p} />
      ))}
    </group>
  )
}

