'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Center, Environment, Float, Sparkles, Text3D, useTexture } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

export const MENU_ITEMS = ['News', 'Contact', 'Business', 'Exhibition Online', 'Directory'] as const

const RING_RADIUS = 3.3
const ACCENT = '#c9ccd6'
const LIGHT = '#e8e6e3'
const CHROME = '#c9ccd6'

const STAR_COUNT = 5000
const GALAXY_RADIUS = 16
const ARMS = 3
const PALETTE = {
  core: new THREE.Color('#ffe2a8'),
  mid: new THREE.Color('#ff4fd8'),
  outer: new THREE.Color('#c9ccd6'),
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

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.z += delta * 0.03
    // Mid layer follows the pointer a little, so it moves against the far field.
    const { pointer } = state
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pointer.x * 0.6, 0.05)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -1.2 + pointer.y * 0.4, 0.05)
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

const FAR_STARS = 9000
const DUST_CLOUDS = 14
const FAR_COLORS = ['#37d7ff', '#c9ccd6', '#ff4fd8', '#ff7a3d', '#ffe2a8'].map(
  (hex) => new THREE.Color(hex),
)

// Far background: a dense star field plus soft nebula dust, filling the screen.
// It sits deepest in the scene and moves least with the pointer, giving depth.
function DepthField() {
  const group = useRef<THREE.Group>(null)

  const { positions, colors, glow, dust } = useMemo(() => {
    const positions = new Float32Array(FAR_STARS * 3)
    const colors = new Float32Array(FAR_STARS * 3)
    const c = new THREE.Color()

    for (let i = 0; i < FAR_STARS; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60
      positions[i * 3 + 2] = -30 - Math.random() * 35

      c.copy(FAR_COLORS[Math.floor(Math.random() * FAR_COLORS.length)])
      const brightness = 0.4 + Math.random() * 0.6
      colors[i * 3] = c.r * brightness
      colors[i * 3 + 1] = c.g * brightness
      colors[i * 3 + 2] = c.b * brightness
    }

    const dust = Array.from({ length: DUST_CLOUDS }, () => ({
      position: [(Math.random() - 0.5) * 90, (Math.random() - 0.5) * 50, -40 - Math.random() * 20] as [
        number,
        number,
        number,
      ],
      scale: 14 + Math.random() * 18,
      color: FAR_COLORS[Math.floor(Math.random() * FAR_COLORS.length)],
    }))

    return { positions, colors, glow: makeGlowTexture(), dust }
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return
    const { pointer } = state
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pointer.x * 0.4, 0.05)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, pointer.y * 0.25, 0.05)
    group.current.rotation.z += delta * 0.01
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={glow}
          vertexColors
          size={0.35}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>
      {dust.map((d, i) => (
        <sprite key={i} position={d.position} scale={d.scale}>
          <spriteMaterial
            map={glow}
            color={d.color}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  )
}

// Nebula photo used as the environment that chromium surfaces reflect.
function useNebulaEnv() {
  const env = useTexture('/textures/nebula-env.jpg')
  env.mapping = THREE.EquirectangularReflectionMapping
  env.colorSpace = THREE.SRGBColorSpace
  return env
}

function Globe() {
  const group = useRef<THREE.Group>(null)
  const wire = useRef<THREE.Mesh>(null)
  const texture = useTexture('/textures/world.jpg')
  const env = useNebulaEnv()
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

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
            map={texture}
            color="#ffffff"
            metalness={0.35}
            roughness={0.25}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
            envMap={env}
            envMapIntensity={0.5}
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
            envMap={env}
            envMapIntensity={1.4}
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </Float>
  )
}

const STL_SCALE = 0.36

// Menu labels that are drawn from a 3D model instead of live text.
const STL_MODELS: Record<string, string | undefined> = {
  'Exhibition Online': '/models/exhibition-online.stl',
  Business: '/models/business.stl',
}

// Menu labels drawn from an FBX model.
const FBX_MODELS: Record<string, string | undefined> = {
  Contact: '/models/contact.fbx',
  News: '/models/news.fbx',
  Directory: '/models/directory.fbx',
}
// The text FBX models are 70 units tall in their own axes; scale to match the other labels.
const FBX_SCALE = 0.25 / 70

// Extruded 3D label loaded from an STL file, shaded as chromium.
function StlLabel({
  url,
  env,
  highlighted,
}: {
  url: string
  env: THREE.Texture
  highlighted: boolean
}) {
  const geometry = useLoader(STLLoader, url)

  useEffect(() => {
    geometry.center()
  }, [geometry])

  return (
    <mesh geometry={geometry} scale={STL_SCALE}>
      <meshStandardMaterial
        color={CHROME}
        metalness={1}
        roughness={0.12}
        envMap={env}
        envMapIntensity={1.8}
        emissive={ACCENT}
        emissiveIntensity={highlighted ? 0.6 : 0}
      />
    </mesh>
  )
}

// FBX label: the model's text lies in its Z axis, so it is rotated into the
// label plane. The negative Z scale is needed to keep the letters readable.
function FbxLabel({
  url,
  env,
  highlighted,
}: {
  url: string
  env: THREE.Texture
  highlighted: boolean
}) {
  const fbx = useLoader(FBXLoader, url)

  const root = useMemo(() => {
    const copy = fbx.clone(true)
    const material = new THREE.MeshStandardMaterial({
      color: CHROME,
      metalness: 1,
      roughness: 0.12,
      envMap: env,
      envMapIntensity: 1.8,
      emissive: new THREE.Color(ACCENT),
      emissiveIntensity: highlighted ? 0.6 : 0,
    })
    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = material
    })
    const box = new THREE.Box3().setFromObject(copy)
    copy.position.sub(box.getCenter(new THREE.Vector3()))
    return copy
  }, [fbx, env, highlighted])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} scale={[FBX_SCALE, FBX_SCALE, -FBX_SCALE]}>
      <primitive object={root} />
    </group>
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
  const env = useNebulaEnv()

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
              color={CHROME}
              emissive={ACCENT}
              emissiveIntensity={highlighted ? 1.5 : 0.2}
              metalness={1}
              roughness={0.12}
              envMap={env}
              envMapIntensity={1.6}
            />
          </mesh>
          {FBX_MODELS[label] ? (
            <FbxLabel url={FBX_MODELS[label]} env={env} highlighted={highlighted} />
          ) : STL_MODELS[label] ? (
            <StlLabel url={STL_MODELS[label]} env={env} highlighted={highlighted} />
          ) : (
          <Center>
            <Text3D
              font="/fonts/geist-bold.typeface.json"
              size={0.3}
              height={0.06}
              letterSpacing={-0.01}
              curveSegments={18}
              bevelEnabled
              bevelThickness={0.012}
              bevelSize={0.008}
              bevelSegments={6}
              smooth={0.02}
            >
              {label.toUpperCase()}
              <meshStandardMaterial
                color={CHROME}
                metalness={1}
                roughness={0.12}
                envMap={env}
                envMapIntensity={1.8}
                emissive={ACCENT}
                emissiveIntensity={highlighted ? 0.6 : 0}
              />
            </Text3D>
          </Center>
          )}
          <mesh position={[0, 0.1, -0.02]}>
            <planeGeometry args={[label.length * 0.24 + 0.4, 1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      </Billboard>
    </group>
  )
}

const ORBIT_DUST = 1400
const ORBIT_COLORS = ['#37d7ff', '#ff4fd8', '#ffe2a8', '#c9ccd6'].map((hex) => new THREE.Color(hex))

// Stardust scattered along the menu orbit, tilted with the ring.
function OrbitDust() {
  const { positions, colors, glow } = useMemo(() => {
    const positions = new Float32Array(ORBIT_DUST * 3)
    const colors = new Float32Array(ORBIT_DUST * 3)
    const c = new THREE.Color()

    for (let i = 0; i < ORBIT_DUST; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = RING_RADIUS + gauss() * 0.12
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = gauss() * 0.18
      positions[i * 3 + 2] = Math.sin(angle) * r

      c.copy(ORBIT_COLORS[Math.floor(Math.random() * ORBIT_COLORS.length)])
      const brightness = 0.5 + Math.random() * 0.5
      colors[i * 3] = c.r * brightness
      colors[i * 3 + 1] = c.g * brightness
      colors[i * 3 + 2] = c.b * brightness
    }

    return { positions, colors, glow: makeGlowTexture() }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glow}
        vertexColors
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
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
  const env = useNebulaEnv()
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
      <OrbitDust />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.006, 16, 256]} />
        <meshStandardMaterial
          color={CHROME}
          metalness={1}
          roughness={0.12}
          envMap={env}
          envMapIntensity={1.6}
          transparent
          opacity={0.6}
        />
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

// Shrinks the whole scene on narrow (portrait or mobile) viewports so the
// globe and orbit menu stay fully on screen. Eases between sizes on resize.
function SceneRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!ref.current) return
    const { width, height } = state.size
    const aspect = width / Math.max(height, 1)
    const target = THREE.MathUtils.clamp(aspect / 1.5, 0.5, 1.05)
    const k = 1 - Math.exp(-delta * 6)
    const next = THREE.MathUtils.lerp(ref.current.scale.x, target, k)
    ref.current.scale.setScalar(next)
  })

  return <group ref={ref}>{children}</group>
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
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      aria-hidden="true"
      onPointerMissed={() => onSelect(-1)}
    >
      <color attach="background" args={['#0b0b0f']} />
      <fog attach="fog" args={['#0b0b0f', 8, 15]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} />
      <pointLight position={[-4, -2, 2]} intensity={10} color={ACCENT} />

      <SceneRoot>
        <DepthField />
        <Galaxy />
        <Globe />
        <MenuRing activeIndex={activeIndex} onSelect={onSelect} />
        <Sparkles count={120} scale={[12, 8, 6]} size={2} speed={0.3} color={LIGHT} opacity={0.5} />
      </SceneRoot>
      <Environment preset="city" />
      <CameraRig />
    </Canvas>
  )
}
