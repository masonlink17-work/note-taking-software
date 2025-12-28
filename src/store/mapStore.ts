import { create } from 'zustand'
import { MapObject, MapObjectType } from '../types'

interface MapStore {
  objects: MapObject[]
  selectedObjectId: string | null
  placementMode: MapObjectType | null
  draggingObjectId: string | null

  // Object management
  addObject: (type: MapObjectType, position: [number, number, number]) => void
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<MapObject>) => void
  moveObject: (id: string, position: [number, number, number]) => void

  // Selection
  selectObject: (id: string | null) => void
  clearSelection: () => void

  // Placement mode
  setPlacementMode: (type: MapObjectType | null) => void

  // Dragging
  setDraggingObject: (id: string | null) => void
}

// Default colors for each object type
const defaultColors: Record<MapObjectType, string> = {
  chest: '#d4a574',
  castle: '#8b7355',
  house: '#c9a961',
  tree: '#228b22',
  mountain: '#696969',
}

// Default scales for each object type
const defaultScales: Record<MapObjectType, number> = {
  chest: 1,
  castle: 2,
  house: 1.5,
  tree: 1.2,
  mountain: 3,
}

const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useMapStore = create<MapStore>((set) => ({
  objects: [],
  selectedObjectId: null,
  placementMode: null,
  draggingObjectId: null,

  addObject: (type, position) => {
    const newObject: MapObject = {
      id: generateId(),
      type,
      position,
      rotation: 0,
      color: defaultColors[type],
      scale: defaultScales[type],
      linkedNotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set((state) => ({
      objects: [...state.objects, newObject],
      selectedObjectId: newObject.id,
      placementMode: null, // Clear placement mode after placing
    }))
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      draggingObjectId: state.draggingObjectId === id ? null : state.draggingObjectId,
    }))
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id
          ? { ...obj, ...updates, updatedAt: new Date() }
          : obj
      ),
    }))
  },

  moveObject: (id, position) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id
          ? { ...obj, position, updatedAt: new Date() }
          : obj
      ),
    }))
  },

  selectObject: (id) => {
    set({ selectedObjectId: id })
  },

  clearSelection: () => {
    set({ selectedObjectId: null })
  },

  setPlacementMode: (type) => {
    set({ placementMode: type, selectedObjectId: null })
  },

  setDraggingObject: (id) => {
    set({ draggingObjectId: id })
  },
}))
