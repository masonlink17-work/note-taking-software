import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../../store/mapStore'
import Object3D from '../MapObjects/Object3D'

function MapScene() {
  const gridRef = useRef<THREE.GridHelper>(null)
  const groundRef = useRef<THREE.Mesh>(null)
  const objectRefs = useRef<Map<string, THREE.Group>>(new Map())
  
  const { camera, raycaster, pointer } = useThree()
  const {
    objects,
    selectedObjectId,
    placementMode,
    addObject,
    selectObject,
    clearSelection,
    moveObject,
    draggingObjectId,
  } = useMapStore()

  // Handle clicks on the ground plane
  const handleGroundClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()

    // Only place objects if in placement mode
    if (placementMode && groundRef.current) {
      raycaster.setFromCamera(pointer, camera)
      const groundIntersects = raycaster.intersectObject(groundRef.current)
      
      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point
        const position: [number, number, number] = [
          Math.round(point.x * 2) / 2, // Snap to grid (0.5 units)
          0,
          Math.round(point.z * 2) / 2,
        ]
        addObject(placementMode, position)
      }
    } else {
      // Clear selection if clicking empty space (not in placement mode)
      clearSelection()
    }
  }

  // Handle dragging objects
  useFrame(() => {
    if (draggingObjectId && groundRef.current) {
      raycaster.setFromCamera(pointer, camera)
      const groundIntersects = raycaster.intersectObject(groundRef.current)
      
      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point
        const position: [number, number, number] = [
          Math.round(point.x * 2) / 2,
          0,
          Math.round(point.z * 2) / 2,
        ]
        moveObject(draggingObjectId, position)
      }
    }
  })

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

      {/* Ground plane for click detection and object placement */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={handleGroundClick}
        onPointerMissed={clearSelection}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0} />
      </mesh>

      {/* Render all map objects */}
      {objects.map((obj) => (
        <Object3D
          key={obj.id}
          ref={(ref) => {
            if (ref) {
              objectRefs.current.set(obj.id, ref)
            } else {
              objectRefs.current.delete(obj.id)
            }
          }}
          object={obj}
          isSelected={selectedObjectId === obj.id}
          onSelect={() => selectObject(obj.id)}
        />
      ))}
    </>
  )
}

export default MapScene