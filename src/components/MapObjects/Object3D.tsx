import { forwardRef, useRef, useState, useEffect, useMemo } from 'react'
import { Group, Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import type { Group as GroupType } from 'three'
import * as THREE from 'three'
import { MapObject, Note } from '../../types'
import { useMapStore } from '../../store/mapStore'
import { useNoteStore } from '../../store/noteStore'

interface Object3DProps {
  object: MapObject
  isSelected: boolean
  onSelect: () => void
}

// Paper particle component - persistent version
function PaperParticle({ 
  delay = 0, 
  isPersistent = true,
  id,
  onRemove
}: { 
  delay?: number
  isPersistent?: boolean
  id: number
  onRemove?: (id: number) => void
}) {
  const meshRef = useRef<Mesh>(null)
  const [visible, setVisible] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  
  // Random initial values
  const initialPos = useMemo<[number, number, number]>(() => [
    (Math.random() - 0.5) * 0.6, // x: -0.3 to 0.3
    0.5 + Math.random() * 0.2,    // y: start just above chest
    (Math.random() - 0.5) * 0.6,  // z: -0.3 to 0.3
  ], [])
  
  const velocity = useMemo(() => [
    (Math.random() - 0.5) * 0.02,  // x velocity (slower for persistence)
    0.01 + Math.random() * 0.02,   // y velocity (upward, slower)
    (Math.random() - 0.5) * 0.02,  // z velocity
  ], [])
  
  const rotationSpeed = useMemo(() => [
    (Math.random() - 0.5) * 0.03,
    (Math.random() - 0.5) * 0.03,
    (Math.random() - 0.5) * 0.03,
  ], [])
  
  // Maximum height before resetting
  const maxHeight = useMemo(() => 2.5 + Math.random() * 1.5, [])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
      setStartTime(Date.now())
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])
  
  useFrame((_state, delta) => {
    if (!meshRef.current || !visible) return
    
    // Animate position
    meshRef.current.position.x += velocity[0] * delta * 60
    meshRef.current.position.y += velocity[1] * delta * 60
    meshRef.current.position.z += velocity[2] * delta * 60
    
    // Animate rotation
    meshRef.current.rotation.x += rotationSpeed[0] * delta * 60
    meshRef.current.rotation.y += rotationSpeed[1] * delta * 60
    meshRef.current.rotation.z += rotationSpeed[2] * delta * 60
    
    // If persistent, reset position when too high, else fade out
    if (isPersistent) {
      // Reset to initial position if too high (continuous loop)
      if (meshRef.current.position.y > maxHeight) {
        meshRef.current.position.set(initialPos[0], initialPos[1], initialPos[2])
        // Slight random offset for variety
        meshRef.current.position.x += (Math.random() - 0.5) * 0.3
        meshRef.current.position.z += (Math.random() - 0.5) * 0.3
      }
    } else {
      // Fade out after 3 seconds (for typing effects)
      if (startTime) {
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed > 3 && meshRef.current.material) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial
          material.opacity = Math.max(0, 1 - (elapsed - 3))
          if (material.opacity <= 0) {
            setVisible(false)
            onRemove?.(id)
          }
        }
      }
    }
  })
  
  if (!visible) return null
  
  return (
    <mesh
      ref={meshRef}
      position={initialPos}
      scale={[0.15, 0.2, 0.01]}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#f5f5dc"
        transparent
        opacity={isPersistent ? 0.9 : 1}
        emissive="#fff8dc"
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

// Sparkle effect component
function Sparkle({ 
  delay = 0, 
  position,
  isPersistent = false,
  id,
  onRemove
}: { 
  delay?: number
  position: [number, number, number]
  isPersistent?: boolean
  id?: number
  onRemove?: (id: number) => void
}) {
  const meshRef = useRef<Mesh>(null)
  const [visible, setVisible] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  
  const scale = useMemo(() => 0.1 + Math.random() * 0.15, [])
  const rotationSpeed = useMemo(() => (Math.random() - 0.5) * 0.1, [])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
      setStartTime(Date.now())
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])
  
  useFrame((state, delta) => {
    if (!meshRef.current || !visible) return
    
    // Rotate
    meshRef.current.rotation.z += rotationSpeed * delta * 60
    
    // Pulse scale
    const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.2 + 1
    meshRef.current.scale.setScalar(scale * pulse)
    
    // Fade out logic
    if (!isPersistent && startTime && meshRef.current.material) {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed > 1.5) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial
        material.opacity = Math.max(0, 1 - (elapsed - 1.5) * 2)
        if (material.opacity <= 0) {
          setVisible(false)
          if (id !== undefined) {
            onRemove?.(id)
          }
        }
      }
    }
  })
  
  if (!visible) return null
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial
        color="#ffd700"
        transparent
        opacity={isPersistent ? 0.8 : 1}
        emissive="#ffd700"
        emissiveIntensity={1}
      />
    </mesh>
  )
}

// Chest component with animations
function Chest({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  const lidGroupRef = useRef<GroupType>(null)
  const glowRef = useRef<Mesh>(null)
  const [lidRotation, setLidRotation] = useState(-0.3) // Closed position
  const [isOpening, setIsOpening] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const [persistentPaperIds, setPersistentPaperIds] = useState<number[]>([])
  const [typingPaperIds, setTypingPaperIds] = useState<number[]>([])
  const [typingSparkleIds, setTypingSparkleIds] = useState<number[]>([])
  const nextPaperIdRef = useRef(0)
  const nextSparkleIdRef = useRef(0)
  const lastContentLengthRef = useRef(0)
  
  // Monitor note content changes for typing effect
  useEffect(() => {
    if (!isSelected) return
    
    const checkNoteContent = () => {
      const noteStore = useNoteStore.getState()
      const linkedNotes = noteStore.notes.filter((note: Note) => 
        object.linkedNotes.includes(note.id)
      )
      
      if (linkedNotes.length > 0) {
        // Check if content length increased (typing)
        const totalLength = linkedNotes.reduce((sum: number, note: Note) => sum + note.content.length, 0)
        if (totalLength > lastContentLengthRef.current) {
          // User is typing - add temporary paper and sparkle
          const paperId = nextPaperIdRef.current++
          const sparkleId = nextSparkleIdRef.current++
          setTypingPaperIds(prev => [...prev, paperId])
          setTypingSparkleIds(prev => [...prev, sparkleId])
          
          // Remove typing effects after they fade
          setTimeout(() => {
            setTypingPaperIds(prev => prev.filter(id => id !== paperId))
            setTypingSparkleIds(prev => prev.filter(id => id !== sparkleId))
          }, 3500)
        }
        lastContentLengthRef.current = totalLength
      }
    }
    
    const interval = setInterval(checkNoteContent, 200) // Check every 200ms
    return () => clearInterval(interval)
  }, [isSelected, object.linkedNotes])
  
  // Animate lid when selected
  useEffect(() => {
    if (isSelected && !isOpening) {
      setIsOpening(true)
      setShowParticles(true)
      setShowSparkles(true)
      // Initialize persistent papers
      const initialPapers = Array.from({ length: 4 }, () => nextPaperIdRef.current++)
      setPersistentPaperIds(initialPapers)
      lastContentLengthRef.current = 0 // Reset for typing detection
    } else if (!isSelected && isOpening) {
      // Close lid when deselected
      setIsOpening(false)
      setShowParticles(false)
      setShowSparkles(false)
      setPersistentPaperIds([])
      setTypingPaperIds([])
      setTypingSparkleIds([])
    }
  }, [isSelected, isOpening])
  
  // Animate lid rotation
  useFrame((state, delta) => {
    if (!lidGroupRef.current) return
    
    const targetRotation = isSelected ? -1.2 : -0.3 // Open: -1.2, Closed: -0.3
    const currentRotation = lidGroupRef.current.rotation.x
    
    // Smooth interpolation
    const diff = targetRotation - currentRotation
    if (Math.abs(diff) > 0.01) {
      lidGroupRef.current.rotation.x += diff * delta * 4 // Smooth opening/closing
      setLidRotation(lidGroupRef.current.rotation.x)
    } else {
      lidGroupRef.current.rotation.x = targetRotation
      setLidRotation(targetRotation)
    }
    
    // Animate glow when open
    if (glowRef.current && isSelected) {
      const glow = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7
      const material = glowRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = glow
      material.opacity = glow * 0.4
    }
  })
  
  // Sparkle positions for initial opening
  const sparklePositions = useMemo(() => [
    [0, 1.5, 0] as [number, number, number],
    [-0.5, 1.6, 0.3] as [number, number, number],
    [0.5, 1.6, -0.3] as [number, number, number],
    [0.3, 1.7, 0.5] as [number, number, number],
    [-0.3, 1.7, -0.5] as [number, number, number],
  ], [])
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Chest base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.2]} />
        <meshStandardMaterial color={object.color} />
      </mesh>
      
      {/* Chest lid - positioned to pivot around back edge */}
      <group ref={lidGroupRef} position={[0, 1.0, -0.6]} rotation={[lidRotation, 0, 0]}>
        <mesh
          position={[0, 0.1, 0.6]} // Offset so rotation happens at back edge
          castShadow
        >
          <boxGeometry args={[1.5, 0.2, 1.2]} />
          <meshStandardMaterial color={object.color} />
        </mesh>
      </group>
      
      {/* Chest lock */}
      <mesh position={[0, 0.5, 0.6]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      
      {/* Glowing effect when open */}
      {isSelected && (
        <>
          <mesh ref={glowRef} position={[0, 0.5, 0]}>
            <boxGeometry args={[1.8, 1.3, 1.5]} />
            <meshStandardMaterial
              color="#ffd700"
              transparent
              opacity={0.4}
              emissive="#ffd700"
              emissiveIntensity={0.7}
            />
          </mesh>
          
          {/* Selection highlight */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.8, 1.3, 1.5]} />
            <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
          </mesh>
        </>
      )}
      
      {/* Persistent floating paper particles */}
      {showParticles &&
        persistentPaperIds.map((id, index) => (
          <PaperParticle 
            key={`persistent-${id}`} 
            delay={index * 0.1} 
            isPersistent={true}
            id={id}
          />
        ))}
      
      {/* Temporary typing effect papers */}
      {typingPaperIds.map((id) => (
        <PaperParticle 
          key={`typing-${id}`} 
          delay={0} 
          isPersistent={false}
          id={id}
          onRemove={(removedId) => {
            setTypingPaperIds(prev => prev.filter(pid => pid !== removedId))
          }}
        />
      ))}
      
      {/* Persistent sparkles around chest when opening */}
      {showSparkles &&
        sparklePositions.map((pos, i) => (
          <Sparkle key={`persistent-sparkle-${i}`} delay={i * 0.1} position={pos} isPersistent={true} />
        ))}
      
      {/* Temporary typing effect sparkles */}
      {typingSparkleIds.map((id) => {
        const sparklePos: [number, number, number] = [
          (Math.random() - 0.5) * 1.5,
          1.5 + Math.random() * 0.5,
          (Math.random() - 0.5) * 1.5,
        ]
        return (
          <Sparkle 
            key={`typing-sparkle-${id}`} 
            delay={0} 
            position={sparklePos}
            isPersistent={false}
            id={id}
            onRemove={(removedId) => {
              setTypingSparkleIds(prev => prev.filter(sid => sid !== removedId))
            }}
          />
        )
      })}
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