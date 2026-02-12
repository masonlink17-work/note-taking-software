import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MapScene from './components/MapScene/MapScene'
import ObjectToolbar from './components/ObjectToolbar/ObjectToolbar'
import ObjectProperties from './components/ObjectProperties/ObjectProperties'
import NotePanel from './components/NotePanel/NotePanel'
import NoteSearch from './components/NoteSearch/NoteSearch'
import FileTreeSidebar from './components/FileTreeSidebar/FileTreeSidebar'
import DataManagement from './components/DataManagement/DataManagement'
import { useMapStore } from './store/mapStore'
import { initializePersistence } from './storage/persistence'
import './App.css'

function App() {
  const { selectedObjectId, removeObject, setPlacementMode, draggingObjectId } = useMapStore()

  // Initialize persistence on app start
  useEffect(() => {
    initializePersistence().catch((error) => {
      console.error('Failed to initialize persistence:', error)
    })
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete when user is editing text (e.g. renaming in file tree)
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Delete selected object
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectId) {
        e.preventDefault()
        removeObject(selectedObjectId)
      }
      // Escape to cancel placement mode
      if (e.key === 'Escape') {
        setPlacementMode(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectId, removeObject, setPlacementMode])

  // Disable camera controls when dragging an object
  const isDragging = draggingObjectId !== null

  return (
    <div className="app-container">
      <FileTreeSidebar />
      <ObjectToolbar />
      <ObjectProperties />
      <NoteSearch />
      <NotePanel />
      <DataManagement />
      <Canvas
        camera={{
          position: [0, 25, 0],
          fov: 50,
        }}
        shadows
        gl={{ antialias: true }}
      >
        <MapScene />
        <OrbitControls
          minDistance={10}
          maxDistance={100}
          minPolarAngle={Math.PI / 2 - 0.1} // Almost top-down (89 degrees)
          maxPolarAngle={Math.PI / 2} // Exactly top-down (90 degrees)
          enablePan={!isDragging}
          enableZoom={!isDragging}
          enableRotate={!isDragging}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}

export default App
