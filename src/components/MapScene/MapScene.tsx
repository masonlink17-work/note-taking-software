import { useRef } from 'react'
import { Grid } from '@react-three/drei'
import * as THREE from 'three'

function MapScene() {
  const gridRef = useRef<THREE.GridHelper>(null)

  return (
    <>
      {/* Lighting - optimized for top-down view */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Grid for visual reference - horizontal grid on XZ plane */}
      {/* The grid serves as both the floor and visual reference */}
      <Grid
        ref={gridRef}
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        followCamera={false}
        infiniteGrid={true}
        fadeDistance={80}
        fadeStrength={3}
      />

      {/* Test cube to verify 3D rendering and lighting */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial color="#4a9eff" />
      </mesh>

      {/* Additional test objects for reference */}
      <mesh position={[10, 2, 0]} castShadow>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>

      <mesh position={[-10, 2, 0]} castShadow>
        <coneGeometry args={[2, 4, 8]} />
        <meshStandardMaterial color="#51cf66" />
      </mesh>
    </>
  )
}

export default MapScene
