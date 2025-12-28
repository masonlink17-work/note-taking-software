import { useMapStore } from '../store/mapStore'
import { useNoteStore } from '../store/noteStore'
import { useFolderStore } from '../store/folderStore'
import { saveAllData, loadAllData } from './database'
import { Folder } from '../types'

// Auto-save debounce delay (milliseconds)
const AUTO_SAVE_DELAY = 2000 // 2 seconds

let autoSaveTimer: number | null = null
let isInitialized = false

// Save all store data to IndexedDB
export async function saveData(): Promise<void> {
  const mapStore = useMapStore.getState()
  const noteStore = useNoteStore.getState()
  const folderStore = useFolderStore.getState()
  
  try {
    await saveAllData(
      mapStore.objects,
      noteStore.notes,
      folderStore.folders
    )
    console.log('Data saved successfully')
  } catch (error) {
    console.error('Error saving data:', error)
    throw error
  }
}

// Load all store data from IndexedDB
export async function loadData(): Promise<void> {
  try {
    const { mapObjects, notes, folders } = await loadAllData()
    
    // Ensure root folder exists
    let foldersToSet = folders
    let rootFolderId = 'root'
    if (folders.length === 0 || !folders.find(f => f.id === 'root')) {
      const rootFolder: Folder = {
        id: 'root',
        name: 'Root',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      foldersToSet = [rootFolder, ...folders]
    }
    
    // Update all stores
    useMapStore.setState({ objects: mapObjects })
    useNoteStore.setState({ notes })
    useFolderStore.setState({ folders: foldersToSet, rootFolderId })
    
    console.log('Data loaded successfully')
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
}

// Debounced auto-save
export function autoSave(): void {
  if (autoSaveTimer !== null) {
    clearTimeout(autoSaveTimer)
  }
  
  autoSaveTimer = window.setTimeout(() => {
    saveData().catch((error) => {
      console.error('Auto-save failed:', error)
    })
  }, AUTO_SAVE_DELAY)
}

// Initialize persistence - load data on app start
export async function initializePersistence(): Promise<void> {
  if (isInitialized) {
    return
  }
  
  try {
    await loadData()
    isInitialized = true
    
    // Set up auto-save listeners
    setupAutoSaveListeners()
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      // Save synchronously if possible, or at least try
      saveData().catch(() => {
        // Ignore errors on unload
      })
    })
  } catch (error) {
    console.error('Failed to initialize persistence:', error)
    // Continue without persistence if load fails
  }
}

// Set up listeners for auto-save on store changes
function setupAutoSaveListeners(): void {
  // Subscribe to map store changes
  useMapStore.subscribe((state, prevState) => {
    if (state.objects !== prevState.objects) {
      autoSave()
    }
  })
  
  // Subscribe to note store changes
  useNoteStore.subscribe((state, prevState) => {
    if (state.notes !== prevState.notes) {
      autoSave()
    }
  })
  
  // Subscribe to folder store changes
  useFolderStore.subscribe((state, prevState) => {
    if (state.folders !== prevState.folders) {
      autoSave()
    }
  })
}

