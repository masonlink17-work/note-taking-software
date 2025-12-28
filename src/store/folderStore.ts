import { create } from 'zustand'
import { Folder } from '../types'
import { useMapStore } from './mapStore'
import { useNoteStore } from './noteStore'

interface FolderStore {
  folders: Folder[]
  rootFolderId: string | null

  // Folder management
  createFolder: (name: string, parentId: string | null) => Folder
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string, skipObjectCheck?: boolean) => void
  moveItem: (itemId: string, itemType: 'note' | 'folder', newParentId: string | null) => void

  // Tree structure helpers
  getFolderById: (id: string | null) => Folder | null
  getPathToFolder: (folderId: string) => Folder[]
}

const generateFolderId = () => `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useFolderStore = create<FolderStore>((set, get) => {
  // Initialize with a root folder
  const rootFolder: Folder = {
    id: 'root',
    name: 'Root',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return {
    folders: [rootFolder],
    rootFolderId: 'root',

    createFolder: (name, parentId) => {
      const newFolder: Folder = {
        id: generateFolderId(),
        name,
        parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      set((state) => ({
        folders: [...state.folders, newFolder],
      }))

      return newFolder
    },

    updateFolder: (id, updates) => {
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === id
            ? { ...folder, ...updates, updatedAt: new Date() }
            : folder
        ),
      }))
    },

    deleteFolder: (id, skipObjectCheck = false) => {
      if (id === 'root') return // Can't delete root folder

      // Check if this folder belongs to an object, and delete the object too
      // Skip this check if we're being called from removeObject to prevent recursion
      if (!skipObjectCheck) {
        const mapStore = useMapStore.getState() // Get state at runtime to avoid circular dependency
        const associatedObject = mapStore.objects.find((obj) => obj.folderId === id)
        if (associatedObject) {
          // Delete the object (which will also delete this folder, so we return early)
          mapStore.removeObject(associatedObject.id)
          return
        }
      }

      // Delete folder and move its children to parent
      const folderToDelete = get().folders.find((f) => f.id === id)
      if (folderToDelete) {
        set((state) => ({
          folders: state.folders
            .filter((folder) => folder.id !== id)
            .map((folder) =>
              folder.parentId === id
                ? { ...folder, parentId: folderToDelete.parentId, updatedAt: new Date() }
                : folder
            ),
        }))

        // Also move notes in this folder to the parent
        const noteStore = useNoteStore.getState()
        noteStore.notes.forEach((note: any) => {
          if (note.folderId === id) {
            noteStore.moveNoteToFolder(note.id, folderToDelete.parentId)
          }
        })
      }
    },

    moveItem: (itemId, itemType, newParentId) => {
      // This will be implemented when we integrate with note store
      // For now, just update folder references
      set((state) => ({
        folders: state.folders.map((folder) => {
          if (itemType === 'folder' && folder.id === itemId) {
            return { ...folder, parentId: newParentId, updatedAt: new Date() }
          }
          return folder
        }),
      }))
    },

    getFolderById: (id) => {
      if (!id) return get().folders.find((f) => f.id === get().rootFolderId) || null
      return get().folders.find((f) => f.id === id) || null
    },

    getPathToFolder: (folderId) => {
      const path: Folder[] = []
      const { folders } = get()
      let currentId: string | null = folderId

      while (currentId) {
        const folder = folders.find((f) => f.id === currentId)
        if (!folder) break
        path.unshift(folder)
        currentId = folder.parentId
      }

      return path
    },
  }
})
