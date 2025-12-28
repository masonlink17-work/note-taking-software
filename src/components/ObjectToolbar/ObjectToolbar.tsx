import { useMapStore } from '../../store/mapStore'
import { MapObjectType } from '../../types'
import './ObjectToolbar.css'

interface ObjectButton {
  type: MapObjectType
  label: string
  icon: string
}

const objectButtons: ObjectButton[] = [
  { type: 'chest', label: 'Chest', icon: '📦' },
  { type: 'castle', label: 'Castle', icon: '🏰' },
  { type: 'house', label: 'House', icon: '🏠' },
  { type: 'tree', label: 'Tree', icon: '🌳' },
  { type: 'mountain', label: 'Mountain', icon: '⛰️' },
]

export default function ObjectToolbar() {
  const { placementMode, setPlacementMode, selectedObjectId, removeObject } = useMapStore()

  const handleObjectClick = (type: MapObjectType) => {
    if (placementMode === type) {
      // Clicking the same button cancels placement mode
      setPlacementMode(null)
    } else {
      setPlacementMode(type)
    }
  }

  const handleDelete = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedObjectId) {
        e.preventDefault()
        handleDelete()
      }
    } else if (e.key === 'Escape') {
      setPlacementMode(null)
    }
  }

  return (
    <div className="object-toolbar" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="toolbar-section">
        <h3>Place Objects</h3>
        <div className="object-buttons">
          {objectButtons.map((button) => (
            <button
              key={button.type}
              className={`object-button ${placementMode === button.type ? 'active' : ''}`}
              onClick={() => handleObjectClick(button.type)}
              title={button.label}
            >
              <span className="object-icon">{button.icon}</span>
              <span className="object-label">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedObjectId && (
        <div className="toolbar-section">
          <div className="selection-info">
            <p>Object Selected</p>
            <button className="delete-button" onClick={handleDelete}>
              Delete (Del)
            </button>
          </div>
        </div>
      )}

      {placementMode && (
        <div className="toolbar-section">
          <div className="placement-hint">
            <p>Click on the map to place {placementMode}</p>
            <button className="cancel-button" onClick={() => setPlacementMode(null)}>
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
