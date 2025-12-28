import { forwardRef, useRef } from 'react'
import { Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { MapObject } from '../../types'
import { useMapStore } from '../../store/mapStore'

interface Object3DProps {
  object: MapObject
  isSelected: boolean
  onSelect: () => void
}

// Chest component
function Chest({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Chest base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.2]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Chest lid */}
      <mesh position={[0, 1.3, -0.6]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 1.2]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Chest lock */}
      <mesh position={[0, 0.5, 0.6]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.8, 1.3, 1.5]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// Castle component
function Castle({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Main tower */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 3, 8]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Castle base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.5, 1, 2.5]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Battlements */}
      <mesh position={[-0.6, 2.8, -0.6]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      <mesh position={[0.6, 2.8, -0.6]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      <mesh position={[-0.6, 2.8, 0.6]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      <mesh position={[0.6, 2.8, 0.6]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Flag */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.05]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 4, 8]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// House component
function House({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* House base */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2, 1.6, 2]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.8, 1.2, 4]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.4, 1.01]} castShadow>
        <boxGeometry args={[0.6, 1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Window 1 */}
      <mesh position={[-0.7, 1.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
      {/* Window 2 */}
      <mesh position={[0.7, 1.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#87ceeb" />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2.3, 2.5, 2.3]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// Tree component
function Tree({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 4, 8]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// Mountain component
function Mountain({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Main peak */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[2, 3, 8]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Secondary peak */}
      <mesh position={[-1, 1, -0.5]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      <mesh position={[1, 1, -0.5]} castShadow>
        <coneGeometry args={[1.2, 2, 8]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 1.5, 0]}>
          <coneGeometry args={[2.3, 3.5, 8]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

const Object3D = forwardRef<Group, Object3DProps>(
  ({ object, isSelected, onSelect }, forwardedRef) => {
    const groupRef = useRef<Group | null>(null)
    const { setDraggingObject } = useMapStore()

    // Rotate object based on rotation property
    useFrame(() => {
      if (groupRef.current) {
        groupRef.current.rotation.y = object.rotation
      }
    })

    const renderObject = () => {
      switch (object.type) {
        case 'chest':
          return <Chest object={object} isSelected={isSelected} />
        case 'castle':
          return <Castle object={object} isSelected={isSelected} />
        case 'house':
          return <House object={object} isSelected={isSelected} />
        case 'tree':
          return <Tree object={object} isSelected={isSelected} />
        case 'mountain':
          return <Mountain object={object} isSelected={isSelected} />
        default:
          return null
      }
    }

    return (
      <group
        ref={(node) => {
          groupRef.current = node
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
          }
        }}
        position={object.position}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (isSelected && e.button === 0) {
            // Left mouse button - start dragging
            setDraggingObject(object.id)
          }
        }}
        onPointerUp={(e) => {
          e.stopPropagation()
          setDraggingObject(null)
        }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          document.body.style.cursor = isSelected ? 'move' : 'pointer'
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'default'
        }}
      >
        {renderObject()}
      </group>
    )
  }
)

Object3D.displayName = 'Object3D'

export default Object3D