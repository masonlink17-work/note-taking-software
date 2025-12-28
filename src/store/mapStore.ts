import { create } from 'zustand'
import { MapObject, MapObjectType } from '../types'
import { useFolderStore } from './folderStore'

interface MapStore {
  objects: MapObject[]
  selectedObjectId: string | null
  placementMode: MapObjectType | null
  draggingObjectId: string | null

  // Object management
  addObject: (type: MapObjectType, position: [number, number, number], folderId?: string | null) => void
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<MapObject>) => void
  moveObject: (id: string, position: [number, number, number]) => void
  moveObjectToFolder: (id: string, folderId: string | null) => void

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

export const useMapStore = create<MapStore>((set, get) => ({
  objects: [],
  selectedObjectId: null,
  placementMode: null,
  draggingObjectId: null,

  addObject: (type, position, folderId = null) => {
    // If no folderId provided, create a new folder for this object
    let objectFolderId = folderId
    if (!folderId) {
      const folderStore = useFolderStore.getState()
      const rootFolderId = folderStore.rootFolderId
      // Create folder with object type and timestamp as name
      const folderName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now()}`
      const newFolder = folderStore.createFolder(folderName, rootFolderId)
      objectFolderId = newFolder.id
    }

    const newObject: MapObject = {
      id: generateId(),
      type,
      position,
      rotation: 0,
      color: defaultColors[type],
      scale: defaultScales[type],
      linkedNotes: [],
      folderId: objectFolderId,
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
    const obj = get().objects.find((o: any) => o.id === id)
    const folderId = obj?.folderId
    
    // Remove object from state first
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      draggingObjectId: state.draggingObjectId === id ? null : state.draggingObjectId,
    }))
    
    // Then delete the associated folder (after object is removed to prevent recursion)
    if (folderId) {
      const folderStore = useFolderStore.getState()
      // Delete the folder, skipping the object check to prevent recursion
      folderStore.deleteFolder(folderId, true)
    }
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

  moveObjectToFolder: (id, folderId) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id
          ? { ...obj, folderId, updatedAt: new Date() }
          : obj
      ),
    }))
  },
}))
