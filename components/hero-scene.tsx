'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Float,
  MeshDistortMaterial,
  Sparkles,
} from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function Blob() {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y += delta * 0.15
    mesh.current.rotation.x += delta * 0.05
    const target = hovered ? 1.12 : 1
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.08)
  })

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh
        ref={mesh}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[1.6, 64]} />
        <MeshDistortMaterial
          color="#ff5a1f"
          roughness={0.12}
          metalness={0.65}
          distort={hovered ? 0.55 : 0.38}
          speed={2.2}
          envMapIntensity={1.2}
        />
      </mesh>
    </Float>
  )
}

function Satellite({
  position,
  geometry,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  geometry: 'torus' | 'octa' | 'sphere'
  color: string
  scale?: number
}) {
  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={2}>
      <mesh position={position} scale={scale}>
        {geometry === 'torus' && <torusGeometry args={[0.45, 0.16, 32, 96]} />}
        {geometry === 'octa' && <octahedronGeometry args={[0.45, 0]} />}
        {geometry === 'sphere' && <sphereGeometry args={[0.3, 48, 48]} />}
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
      </mesh>
    </Float>
  )
}

function CameraRig() {
  useFrame((state) => {
    const { pointer, camera } = state
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.2, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.8, 0.04)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      aria-hidden="true"
    >
      <color attach="background" args={['#0b0b0f']} />
      <fog attach="fog" args={['#0b0b0f', 7, 14]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <pointLight position={[-4, -2, 2]} intensity={30} color="#7c5cff" />

      <Blob />
      <Satellite position={[-3, 1.4, -1]} geometry="torus" color="#e8e6e3" />
      <Satellite position={[3.2, -1.2, -0.5]} geometry="octa" color="#7c5cff" />
      <Satellite position={[2.6, 1.8, -2]} geometry="sphere" color="#e8e6e3" scale={0.9} />
      <Satellite position={[-2.4, -1.8, 0]} geometry="sphere" color="#ff5a1f" scale={0.6} />

      <Sparkles count={120} scale={[12, 8, 6]} size={2} speed={0.3} color="#e8e6e3" opacity={0.5} />
      <Environment preset="city" />
      <CameraRig />
    </Canvas>
  )
}
