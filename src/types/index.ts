// Type definitions for the note-taking software

// Map object types that will be implemented in Phase 2
export type MapObjectType = 'chest' | 'castle' | 'house' | 'tree' | 'mountain'

// Placeholder for future note types
export interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

// Placeholder for future map object types
export interface MapObject {
  id: string
  type: MapObjectType
  position: [number, number, number] // [x, y, z]
  rotation: number
  linkedNotes: string[] // Note IDs
}
