import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import MapScene from './components/MapScene/MapScene'
import './App.css'

function App() {
  return (
    <div className="app-container">
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
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}

export default App
