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
  const [showSparkles, setShowSparkles] = useState(false)
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
      setShowSparkles(true)
      // Only show sparkles on open, not papers
      // Papers will appear when typing is detected
      lastContentLengthRef.current = 0 // Reset for typing detection
      // Initialize content length for typing detection
      const noteStore = useNoteStore.getState()
      const linkedNotes = noteStore.notes.filter((note: Note) => 
        object.linkedNotes.includes(note.id)
      )
      if (linkedNotes.length > 0) {
        const totalLength = linkedNotes.reduce((sum: number, note: Note) => sum + note.content.length, 0)
        lastContentLengthRef.current = totalLength
      }
    } else if (!isSelected && isOpening) {
      // Close lid when deselected
      setIsOpening(false)
      setShowSparkles(false)
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
  
  // Medieval wood color variations
  const woodColor = object.color
  const metalColor = '#6a6358'
  const rustColor = '#8b6914'
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Chest base - detailed wooden box */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.2]} />
        <meshStandardMaterial 
          color={woodColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Decorative metal bands - horizontal */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.55, 0.08, 1.25]} />
        <meshStandardMaterial 
          color={metalColor}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.55, 0.08, 1.25]} />
        <meshStandardMaterial 
          color={metalColor}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      
      {/* Metal corner reinforcements */}
      {[[-0.75, -0.5], [0.75, -0.5], [-0.75, 0.5], [0.75, 0.5]].map(([x, y], i) => (
        <mesh key={i} position={[x, 0.5, y]} castShadow>
          <boxGeometry args={[0.12, 1.05, 0.12]} />
          <meshStandardMaterial 
            color={rustColor}
            roughness={0.6}
            metalness={0.7}
          />
        </mesh>
      ))}
      
      {/* Chest lid - detailed with metal trim */}
      <group ref={lidGroupRef} position={[0, 1.0, -0.6]} rotation={[lidRotation, 0, 0]}>
        <mesh
          position={[0, 0.1, 0.6]}
          castShadow
        >
          <boxGeometry args={[1.5, 0.2, 1.2]} />
          <meshStandardMaterial 
            color={woodColor}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Lid metal edge trim */}
        <mesh position={[0, 0.2, 0.6]} castShadow>
          <boxGeometry args={[1.55, 0.05, 1.25]} />
          <meshStandardMaterial 
            color={metalColor}
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>
      </group>
      
      {/* Ornate medieval lock */}
      <group position={[0, 0.5, 0.61]}>
        {/* Lock plate */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.3, 0.05]} />
          <meshStandardMaterial 
            color={metalColor}
            roughness={0.3}
            metalness={0.9}
          />
        </mesh>
        {/* Lock cylinder */}
        <mesh position={[0, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 16]} />
          <meshStandardMaterial 
            color={rustColor}
            roughness={0.5}
            metalness={0.8}
          />
        </mesh>
        {/* Keyhole */}
        <mesh position={[0, 0, 0.12]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
          <meshStandardMaterial 
            color="#2a2a2a"
            roughness={1}
            metalness={0}
          />
        </mesh>
      </group>
      
      {/* Decorative metal studs */}
      {[[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]].map(([x, y], i) => (
        <mesh key={`stud-${i}`} position={[x, 0.5, y]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
          <meshStandardMaterial 
            color={metalColor}
            roughness={0.3}
            metalness={0.9}
          />
        </mesh>
      ))}
      
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
      
      {/* Paper particles - only appear when typing */}
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

// Castle component - detailed medieval castle
function Castle({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  const stoneColor = object.color
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Main base - large square foundation */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.8, 1, 2.8]} />
        <meshStandardMaterial 
          color={stoneColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Main central tower - taller and more detailed */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.2, 4, 12]} />
        <meshStandardMaterial 
          color={stoneColor}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      
      {/* Tower windows */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={i} position={[Math.cos(angle) * 1.15, 2.5, Math.sin(angle) * 1.15]}>
          <mesh rotation={[0, angle + Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[0.25, 0.4, 0.15]} />
            <meshStandardMaterial 
              color="#1a1a2e"
              roughness={0.2}
              metalness={0}
            />
          </mesh>
        </group>
      ))}
      
      {/* Detailed battlements on main tower */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 1.15, 4.3, Math.sin(angle) * 1.15]} 
            castShadow
          >
            <boxGeometry args={[0.25, 0.4, 0.25]} />
            <meshStandardMaterial 
              color={stoneColor}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        )
      })}
      
      {/* Corner towers */}
      {[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 1.5, z]} castShadow>
            <cylinderGeometry args={[0.4, 0.45, 2.5, 8]} />
            <meshStandardMaterial 
              color={stoneColor}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
          {/* Corner tower battlements */}
          {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, j) => (
            <mesh 
              key={j}
              position={[x + Math.cos(angle) * 0.42, 2.9, z + Math.sin(angle) * 0.42]} 
              castShadow
            >
              <boxGeometry args={[0.15, 0.25, 0.15]} />
              <meshStandardMaterial 
                color={stoneColor}
                roughness={0.9}
                metalness={0}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Castle walls connecting towers */}
      {[
        [-1.1, 0, 0, 1.5, 0.15], [1.1, 0, 0, 1.5, 0.15],
        [0, -1.1, Math.PI / 2, 1.5, 0.15], [0, 1.1, Math.PI / 2, 1.5, 0.15]
      ].map(([x, z, rot, height, width], i) => (
        <mesh key={i} position={[x, height, z]} rotation={[0, rot, 0]} castShadow>
          <boxGeometry args={[2.2, height * 2, width]} />
          <meshStandardMaterial 
            color={stoneColor}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}
      
      {/* Drawbridge/gate */}
      <mesh position={[0, 0.8, 1.475]} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.15]} />
        <meshStandardMaterial 
          color="#654321"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {/* Gate metal bands */}
      {[0.3, -0.3].map((y, i) => (
        <mesh key={i} position={[0, 0.8 + y, 1.52]} castShadow>
          <boxGeometry args={[0.85, 0.08, 0.12]} />
          <meshStandardMaterial 
            color="#4a4a4a"
            roughness={0.4}
            metalness={0.8}
          />
        </mesh>
      ))}
      
      {/* Flag pole */}
      <mesh position={[0, 4.7, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial 
          color="#8b4513"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Flag */}
      <mesh position={[0.35, 5.3, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.02]} />
        <meshStandardMaterial 
          color="#c41e3a"
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 5, 12]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// House component - beautiful medieval cottage
function House({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  const wallColor = object.color
  const roofColor = '#5a3520'
  const darkWood = '#3d2817'
  const stoneColor = '#8b8782'
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Stone foundation - wider base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.4, 0.4, 2.4]} />
        <meshStandardMaterial 
          color={stoneColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Main house structure - better proportions */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.2, 2.2, 2.2]} />
        <meshStandardMaterial 
          color={wallColor}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      
      {/* Roof - proper pyramid roof */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[1.8, 1.5, 4]} />
        <meshStandardMaterial 
          color={roofColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Roof overhang/eaves */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <cylinderGeometry args={[1.85, 1.85, 0.1, 4]} />
        <meshStandardMaterial 
          color={roofColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Chimney - better positioned */}
      <group position={[0.85, 2.2, -0.85]}>
        <mesh castShadow>
          <boxGeometry args={[0.25, 1.2, 0.25]} />
          <meshStandardMaterial 
            color={stoneColor}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
        {/* Chimney top */}
        <mesh position={[0, 0.725, 0]} castShadow>
          <boxGeometry args={[0.3, 0.15, 0.3]} />
          <meshStandardMaterial 
            color="#5a5a5a"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
      </group>
      
      {/* Door - centered and proportional */}
      <group position={[0, 0.8, 1.12]}>
        {/* Door frame */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.6, 0.08]} />
          <meshStandardMaterial 
            color={darkWood}
            roughness={0.85}
            metalness={0}
          />
        </mesh>
        {/* Door panel */}
        <mesh position={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[0.75, 1.5, 0.05]} />
          <meshStandardMaterial 
            color="#4a2c17"
            roughness={0.9}
            metalness={0}
          />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.3, 0, 0.06]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
          <meshStandardMaterial 
            color="#6a6a6a"
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
      </group>
      
      {/* Windows - better sized and positioned */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 1.4, 1.12]}>
          {/* Window frame */}
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.6, 0.08]} />
            <meshStandardMaterial 
              color={darkWood}
              roughness={0.85}
              metalness={0}
            />
          </mesh>
          {/* Window glass */}
          <mesh position={[0, 0, 0.02]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.03]} />
            <meshStandardMaterial 
              color="#7aa7c7"
              roughness={0.1}
              metalness={0}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Window cross - vertical */}
          <mesh position={[0, 0, 0.045]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.02]} />
            <meshStandardMaterial 
              color={darkWood}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
          {/* Window cross - horizontal */}
          <mesh position={[0, 0, 0.045]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.05, 0.5, 0.02]} />
            <meshStandardMaterial 
              color={darkWood}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        </group>
      ))}
      
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2.5, 3.5, 2.5]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// Tree component - beautiful natural tree
function Tree({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  const barkColor = '#7d5a3f'
  const darkBark = '#5a4030'
  const foliageColor = object.color
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Main trunk - natural taper */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 3, 10]} />
        <meshStandardMaterial 
          color={barkColor}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Foliage - main canopy sphere */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.1, 12, 12]} />
        <meshStandardMaterial 
          color={foliageColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Secondary foliage clusters for natural look */}
      {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos(angle) * 0.6, 
            3.0 + i * 0.3, 
            Math.sin(angle) * 0.6
          ]} 
          castShadow
        >
          <sphereGeometry args={[0.7, 10, 10]} />
          <meshStandardMaterial 
            color={foliageColor}
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}
      
      {/* Upper foliage accent */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <sphereGeometry args={[0.6, 10, 10]} />
        <meshStandardMaterial 
          color={foliageColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Root flare - natural base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.6, 10]} />
        <meshStandardMaterial 
          color={darkBark}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 5, 12]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.3} wireframe />
        </mesh>
      )}
    </group>
  )
}

// Mountain component - majestic mountain range
function Mountain({ object, isSelected }: { object: MapObject; isSelected: boolean }) {
  const rockColor = object.color
  const darkRock = '#5a5a5a'
  
  return (
    <group position={[0, 0, 0]} scale={object.scale}>
      {/* Main peak - tall and majestic */}
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.8, 4, 12]} />
        <meshStandardMaterial 
          color={rockColor}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Secondary peak - left side */}
      <mesh position={[-1.1, 1.4, -0.4]} castShadow>
        <coneGeometry args={[1.1, 2.8, 10]} />
        <meshStandardMaterial 
          color={rockColor}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Secondary peak - right side */}
      <mesh position={[1.1, 1.4, -0.4]} castShadow>
        <coneGeometry args={[1.1, 2.8, 10]} />
        <meshStandardMaterial 
          color={rockColor}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Base - solid foundation */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.6, 14]} />
        <meshStandardMaterial 
          color={darkRock}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      
      {/* Snow cap - clean and simple */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <coneGeometry args={[1.0, 1.0, 12]} />
        <meshStandardMaterial 
          color="#ffffff"
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      
      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 2, 0]}>
          <coneGeometry args={[2.2, 4.5, 12]} />
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