'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Environment, Float, Sparkles, Text } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export const MENU_ITEMS = ['News', 'Contact', 'Business', 'Exhibition Online', 'Directory'] as const

const RING_RADIUS = 3.3
const ACCENT = '#7c5cff'
const LIGHT = '#e8e6e3'

function Globe() {
  const group = useRef<THREE.Group>(null)
  const wire = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.2
    if (wire.current) wire.current.rotation.y -= delta * 0.08
  })

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={group} rotation={[0.35, 0, 0.15]} scale={0.9}>
        <mesh>
          <sphereGeometry args={[1.5, 128, 128]} />
          <meshPhysicalMaterial
            color="#c9ccd6"
            metalness={1}
            roughness={0.04}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.6}
          />
        </mesh>
        <mesh ref={wire}>
          <sphereGeometry args={[1.56, 36, 18]} />
          <meshStandardMaterial
            color={LIGHT}
            emissive={ACCENT}
            emissiveIntensity={0.45}
            metalness={1}
            roughness={0.1}
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </Float>
  )
}

function MenuItem({
  label,
  angle,
  active,
  onSelect,
}: {
  label: string
  angle: number
  active: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const item = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Mesh>(null)
  const highlighted = hovered || active

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((_, delta) => {
    if (item.current) {
      const s = highlighted ? 1.2 : 1
      item.current.scale.lerp(new THREE.Vector3(s, s, s), 0.12)
    }
    if (marker.current) {
      marker.current.rotation.y += delta * 1.2
      marker.current.rotation.x += delta * 0.6
    }
  })

  return (
    <group position={[Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS]}>
      <Billboard>
        <group
          ref={item}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <mesh ref={marker} position={[0, 0.42, 0]}>
            <octahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial
              color={highlighted ? ACCENT : LIGHT}
              emissive={ACCENT}
              emissiveIntensity={highlighted ? 1.5 : 0.2}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <Text
            font="/fonts/Geist-Bold.ttf"
            fontSize={0.3}
            letterSpacing={-0.02}
            anchorX="center"
            anchorY="middle"
            color={highlighted ? ACCENT : LIGHT}
            outlineWidth={highlighted ? 0.004 : 0}
            outlineColor={ACCENT}
          >
            {label.toUpperCase()}
          </Text>
          <mesh position={[0, 0.1, -0.02]}>
            <planeGeometry args={[label.length * 0.24 + 0.4, 1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      </Billboard>
    </group>
  )
}

function MenuRing({
  activeIndex,
  onSelect,
}: {
  activeIndex: number | null
  onSelect: (index: number) => void
}) {
  const ring = useRef<THREE.Group>(null)
  const step = (Math.PI * 2) / MENU_ITEMS.length

  useFrame((_, delta) => {
    if (!ring.current) return
    if (activeIndex === null) {
      ring.current.rotation.y += delta * 0.12
      return
    }
    const current = ring.current.rotation.y
    const target = -activeIndex * step
    const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current))
    ring.current.rotation.y = current + diff * Math.min(1, delta * 4)
  })

  return (
    <group rotation={[0.22, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.006, 16, 256]} />
        <meshStandardMaterial color={LIGHT} metalness={1} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      <group ref={ring}>
        {MENU_ITEMS.map((label, i) => (
          <MenuItem
            key={label}
            label={label}
            angle={i * step}
            active={activeIndex === i}
            onSelect={() => onSelect(i)}
          />
        ))}
      </group>
    </group>
  )
}

function CameraRig() {
  useFrame((state) => {
    const { pointer, camera } = state
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.8, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1 + pointer.y * 0.5, 0.04)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function HeroScene({
  activeIndex,
  onSelect,
}: {
  activeIndex: number | null
  onSelect: (index: number) => void
}) {
  return (
    <Canvas
      camera={{ position: [0, 1, 8], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      aria-hidden="true"
      onPointerMissed={() => onSelect(-1)}
    >
      <color attach="background" args={['#0b0b0f']} />
      <fog attach="fog" args={['#0b0b0f', 8, 15]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <pointLight position={[-4, -2, 2]} intensity={30} color={ACCENT} />

      <Globe />
      <MenuRing activeIndex={activeIndex} onSelect={onSelect} />

      <Sparkles count={120} scale={[12, 8, 6]} size={2} speed={0.3} color={LIGHT} opacity={0.5} />
      <Environment preset="city" />
      <CameraRig />
    </Canvas>
  )
}
