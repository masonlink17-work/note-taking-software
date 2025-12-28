// Type definitions for the note-taking software

// Map object types
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

// Map object interface with all properties
export interface MapObject {
  id: string
  type: MapObjectType
  position: [number, number, number] // [x, y, z]
  rotation: number // Rotation around Y axis (in radians)
  color: string // Hex color string
  scale: number // Scale factor (default: 1)
  linkedNotes: string[] // Note IDs (for Phase 3)
  createdAt: Date
  updatedAt: Date
}

// Object configuration for each object type
export interface ObjectTypeConfig {
  defaultColor: string
  defaultScale: number
  icon?: string
}
