import { useMapStore } from '../../store/mapStore'
import './ObjectProperties.css'

export default function ObjectProperties() {
  const { objects, selectedObjectId, updateObject } = useMapStore()

  if (!selectedObjectId) {
    return null
  }

  const selectedObject = objects.find((obj) => obj.id === selectedObjectId)
  if (!selectedObject) {
    return null
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedObjectId, { color: e.target.value })
  }

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedObjectId, { rotation: parseFloat(e.target.value) })
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedObjectId, { scale: parseFloat(e.target.value) })
  }

  return (
    <div className="object-properties">
      <h3>Object Properties</h3>
      <div className="property-group">
        <label>
          <span>Type:</span>
          <span className="property-value">{selectedObject.type}</span>
        </label>
      </div>

      <div className="property-group">
        <label>
          <span>Color:</span>
          <input
            type="color"
            value={selectedObject.color}
            onChange={handleColorChange}
            className="color-input"
          />
        </label>
      </div>

      <div className="property-group">
        <label>
          <span>Rotation:</span>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.1"
            value={selectedObject.rotation}
            onChange={handleRotationChange}
            className="slider-input"
          />
          <span className="property-value">
            {Math.round((selectedObject.rotation * 180) / Math.PI)}°
          </span>
        </label>
      </div>

      <div className="property-group">
        <label>
          <span>Scale:</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={selectedObject.scale}
            onChange={handleScaleChange}
            className="slider-input"
          />
          <span className="property-value">{selectedObject.scale.toFixed(1)}x</span>
        </label>
      </div>

      <div className="property-group">
        <label>
          <span>Position:</span>
          <span className="property-value">
            X: {selectedObject.position[0].toFixed(1)}, Z: {selectedObject.position[2].toFixed(1)}
          </span>
        </label>
      </div>
    </div>
  )
}
