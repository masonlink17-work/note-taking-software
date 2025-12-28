import { create } from 'zustand'
import { Note } from '../types'

interface NoteStore {
  notes: Note[]
  selectedNoteId: string | null
  searchQuery: string

  // Note management
  createNote: (title?: string) => Note
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void

  // Note-object linking
  linkNoteToObject: (noteId: string, objectId: string) => void
  unlinkNoteFromObject: (noteId: string, objectId: string) => void

  // Selection
  selectNote: (id: string | null) => void
  clearNoteSelection: () => void

  // Search
  setSearchQuery: (query: string) => void
  getFilteredNotes: () => Note[]
}

const generateNoteId = () => `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  selectedNoteId: null,
  searchQuery: '',

  createNote: (title = 'Untitled Note') => {
    const newNote: Note = {
      id: generateNoteId(),
      title,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      linkedObjectIds: [],
    }
    set((state) => ({
      notes: [...state.notes, newNote],
      selectedNoteId: newNote.id,
    }))
    return newNote
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }))
  },

  deleteNote: (id) => {
    const note = get().notes.find((n) => n.id === id)
    if (note) {
      // Unlink from all objects - import at runtime to avoid circular dependency
      note.linkedObjectIds.forEach((objectId) => {
        // We'll handle this in the component that calls deleteNote
      })
    }

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
    }))
  },

  linkNoteToObject: (noteId, objectId) => {
    // Add object to note's linkedObjectIds
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              linkedObjectIds: note.linkedObjectIds.includes(objectId)
                ? note.linkedObjectIds
                : [...note.linkedObjectIds, objectId],
            }
          : note
      ),
    }))
  },

  unlinkNoteFromObject: (noteId, objectId) => {
    // Remove object from note's linkedObjectIds
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              linkedObjectIds: note.linkedObjectIds.filter((id) => id !== objectId),
            }
          : note
      ),
    }))
  },

  selectNote: (id) => {
    set({ selectedNoteId: id })
  },

  clearNoteSelection: () => {
    set({ selectedNoteId: null })
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  getFilteredNotes: () => {
    const { notes, searchQuery } = get()
    if (!searchQuery.trim()) {
      return notes
    }

    const query = searchQuery.toLowerCase()
    return notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(query)
      const contentMatch = note.content.toLowerCase().includes(query)
      const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(query))
      return titleMatch || contentMatch || tagMatch
    })
  },
}))