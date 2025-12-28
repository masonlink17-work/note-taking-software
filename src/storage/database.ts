import Dexie, { Table } from 'dexie'
import { MapObject, Note, Folder } from '../types'

// Database schema version - increment when schema changes
const DB_VERSION = 1

export interface StoredMapObject extends Omit<MapObject, 'createdAt' | 'updatedAt'> {
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface StoredNote extends Omit<Note, 'createdAt' | 'updatedAt'> {
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface StoredFolder extends Omit<Folder, 'createdAt' | 'updatedAt'> {
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

class NoteTakingDatabase extends Dexie {
  mapObjects!: Table<StoredMapObject>
  notes!: Table<StoredNote>
  folders!: Table<StoredFolder>
  metadata!: Table<{ key: string; value: any }>

  constructor() {
    super('NoteTakingDB')
    
    this.version(DB_VERSION).stores({
      mapObjects: 'id',
      notes: 'id, folderId, *linkedObjectIds',
      folders: 'id, parentId',
      metadata: 'key',
    })
  }
}

export const db = new NoteTakingDatabase()

// Helper functions to convert between Date and ISO string
export function mapObjectToStored(obj: MapObject): StoredMapObject {
  return {
    ...obj,
    createdAt: obj.createdAt.toISOString(),
    updatedAt: obj.updatedAt.toISOString(),
  }
}

export function storedToMapObject(stored: StoredMapObject): MapObject {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  }
}

export function noteToStored(note: Note): StoredNote {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

export function storedToNote(stored: StoredNote): Note {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  }
}

export function folderToStored(folder: Folder): StoredFolder {
  return {
    ...folder,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  }
}

export function storedToFolder(stored: StoredFolder): Folder {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  }
}

// Save all data
export async function saveAllData(
  mapObjects: MapObject[],
  notes: Note[],
  folders: Folder[]
): Promise<void> {
  await db.transaction('rw', db.mapObjects, db.notes, db.folders, async () => {
    // Clear existing data
    await db.mapObjects.clear()
    await db.notes.clear()
    await db.folders.clear()
    
    // Save new data
    await db.mapObjects.bulkAdd(mapObjects.map(mapObjectToStored))
    await db.notes.bulkAdd(notes.map(noteToStored))
    await db.folders.bulkAdd(folders.map(folderToStored))
    
    // Save metadata (version, last save time)
    await db.metadata.put({ key: 'version', value: DB_VERSION })
    await db.metadata.put({ key: 'lastSave', value: new Date().toISOString() })
  })
}

// Load all data
export async function loadAllData(): Promise<{
  mapObjects: MapObject[]
  notes: Note[]
  folders: Folder[]
}> {
  const [storedObjects, storedNotes, storedFolders] = await Promise.all([
    db.mapObjects.toArray(),
    db.notes.toArray(),
    db.folders.toArray(),
  ])
  
  return {
    mapObjects: storedObjects.map(storedToMapObject),
    notes: storedNotes.map(storedToNote),
    folders: storedFolders.map(storedToFolder),
  }
}

// Export all data as JSON
export async function exportAllData(): Promise<string> {
  const data = await loadAllData()
  
  return JSON.stringify(
    {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2
  )
}

// Import data from JSON
export async function importAllData(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString)
  
  // Handle migration if needed (version check)
  if (parsed.version && parsed.version !== DB_VERSION) {
    console.warn(`Data version ${parsed.version} differs from current ${DB_VERSION}. Migration may be needed.`)
    // TODO: Implement migration logic here
  }
  
  const { mapObjects, notes, folders } = parsed.data
  
  if (!mapObjects || !notes || !folders) {
    throw new Error('Invalid import data format')
  }
  
  // Convert ISO strings back to Date objects
  const convertedMapObjects: MapObject[] = mapObjects.map((obj: StoredMapObject) => storedToMapObject(obj))
  const convertedNotes: Note[] = notes.map((note: StoredNote) => storedToNote(note))
  const convertedFolders: Folder[] = folders.map((folder: StoredFolder) => storedToFolder(folder))
  
  await saveAllData(convertedMapObjects, convertedNotes, convertedFolders)
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.mapObjects, db.notes, db.folders, db.metadata, async () => {
    await db.mapObjects.clear()
    await db.notes.clear()
    await db.folders.clear()
    await db.metadata.clear()
  })
}

