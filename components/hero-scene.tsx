'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Environment, Float, Sparkles, Text } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export const MENU_ITEMS = ['News', 'Contact', 'Business', 'Exhibition Online', 'Directory'] as const

const RING_RADIUS = 3.3
const ACCENT = '#7c5cff'
const LIGHT = '#e8e6e3'

const STAR_COUNT = 5000
const GALAXY_RADIUS = 16
const ARMS = 3
const PALETTE = {
  core: new THREE.Color('#ffe2a8'),
  mid: new THREE.Color('#ff4fd8'),
  outer: new THREE.Color('#7c5cff'),
  edge: new THREE.Color('#37d7ff'),
}

// Soft round glow sprite, generated in JS so it works during SSR too.
function makeGlowTexture() {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2)
      const a = Math.pow(1 - d, 2.2)
      const i = (y * size + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.round(a * 255)
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.needsUpdate = true
  return tex
}

// Approximate gaussian noise centred on 0.
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

function Galaxy() {
  const group = useRef<THREE.Group>(null)

  const { positions, colors, sprite } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    const c = new THREE.Color()

    for (let i = 0; i < STAR_COUNT; i++) {
      // Dense core, sparse outskirts.
      const t = Math.pow(Math.random(), 1.6)
      const r = 1.5 + t * GALAXY_RADIUS
      // Spiral arms: angle grows with radius, plus scatter.
      const arm = (i % ARMS) * ((Math.PI * 2) / ARMS)
      const theta = arm + r * 0.45 + gauss() * (0.25 + t * 0.35)

      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = gauss() * 0.35 * (1 - t * 0.6)
      positions[i * 3 + 2] = Math.sin(theta) * r

      // Colour ramp: gold core -> magenta -> violet -> cyan edge.
      const k = t
      if (k < 0.3) c.copy(PALETTE.core).lerp(PALETTE.mid, k / 0.3)
      else if (k < 0.7) c.copy(PALETTE.mid).lerp(PALETTE.outer, (k - 0.3) / 0.4)
      else c.copy(PALETTE.outer).lerp(PALETTE.edge, (k - 0.7) / 0.3)

      const brightness = 0.55 + Math.random() * 0.45
      colors[i * 3] = c.r * brightness
      colors[i * 3 + 1] = c.g * brightness
      colors[i * 3 + 2] = c.b * brightness
    }

    return { positions, colors, sprite: makeGlowTexture() }
  }, [])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.03
  })

  return (
    <group ref={group} position={[0, -1.2, -13]} rotation={[-1.1, 0, 0.3]} scale={1.5}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={sprite}
          vertexColors
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>
    </group>
  )
}

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

      <Galaxy />
      <Globe />
      <MenuRing activeIndex={activeIndex} onSelect={onSelect} />

      <Sparkles count={120} scale={[12, 8, 6]} size={2} speed={0.3} color={LIGHT} opacity={0.5} />
      <Environment preset="city" />
      <CameraRig />
    </Canvas>
  )
}
