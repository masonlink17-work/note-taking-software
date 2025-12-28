import { useEffect, useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useMapStore } from '../../store/mapStore'
import NoteEditor from '../NoteEditor/NoteEditor'
import './NotePanel.css'

export default function NotePanel() {
  const { selectedObjectId } = useMapStore()
  const { notes, createNote, linkNoteToObject, unlinkNoteFromObject, selectedNoteId, selectNote } = useNoteStore()
  const [isOpen, setIsOpen] = useState(false)

  const selectedObject = selectedObjectId
    ? useMapStore.getState().objects.find((obj) => obj.id === selectedObjectId)
    : null

  const linkedNotes = selectedObject
    ? notes.filter((note) => selectedObject.linkedNotes.includes(note.id))
    : []

  // Open panel when object is selected
  useEffect(() => {
    setIsOpen(selectedObjectId !== null)
  }, [selectedObjectId])

  // Select first linked note when object changes
  useEffect(() => {
    if (linkedNotes.length > 0 && !selectedNoteId) {
      selectNote(linkedNotes[0].id)
    } else if (linkedNotes.length === 0) {
      selectNote(null)
    }
  }, [selectedObjectId, linkedNotes.length])

  const handleCreateNote = () => {
    const newNote = createNote()
    if (selectedObjectId) {
      // Link note to object (update both stores)
      linkNoteToObject(newNote.id, selectedObjectId)
      // Update map object's linkedNotes
      const mapStore = useMapStore.getState()
      const obj = mapStore.objects.find((o) => o.id === selectedObjectId)
      if (obj && !obj.linkedNotes.includes(newNote.id)) {
        mapStore.updateObject(selectedObjectId, {
          linkedNotes: [...obj.linkedNotes, newNote.id],
        })
      }
    }
  }

  const handleLinkNote = (noteId: string) => {
    if (selectedObjectId) {
      linkNoteToObject(noteId, selectedObjectId)
    }
  }

  const handleUnlinkNote = (noteId: string) => {
    if (selectedObjectId) {
      // Unlink note from object (update both stores)
      unlinkNoteFromObject(noteId, selectedObjectId)
      // Update map object's linkedNotes
      const mapStore = useMapStore.getState()
      const obj = mapStore.objects.find((o) => o.id === selectedObjectId)
      if (obj) {
        mapStore.updateObject(selectedObjectId, {
          linkedNotes: obj.linkedNotes.filter((id) => id !== noteId),
        })
      }
    }
  }

  if (!isOpen || !selectedObject) {
    return null
  }

  return (
    <div className="note-panel">
      <div className="note-panel-header" style={{ gridColumn: '1 / -1' }}>
        <h3>Notes for {selectedObject.type}</h3>
        <button className="close-button" onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>

      <div className="note-list-section">
        <div className="note-list-header">
          <span>Linked Notes ({linkedNotes.length})</span>
          <button className="create-note-button" onClick={handleCreateNote}>
            + New Note
          </button>
        </div>

        {linkedNotes.length === 0 ? (
          <div className="empty-notes">
            <p>No notes linked to this object</p>
            <button className="create-note-button-small" onClick={handleCreateNote}>
              Create First Note
            </button>
          </div>
        ) : (
          <div className="note-list">
            {linkedNotes.map((note) => (
              <div
                key={note.id}
                className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                onClick={() => selectNote(note.id)}
              >
                <div className="note-item-header">
                  <span className="note-item-title">{note.title}</span>
                  <button
                    className="unlink-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlinkNote(note.id)
                    }}
                    title="Unlink note"
                  >
                    ×
                  </button>
                </div>
                {note.tags.length > 0 && (
                  <div className="note-item-tags">
                    {note.tags.map((tag, index) => (
                      <span key={index} className="note-item-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="note-item-preview">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 ? '...' : ''}
                </div>
                <div className="note-item-date">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNoteId && (
        <div className="note-editor-section">
          <NoteEditor noteId={selectedNoteId} />
        </div>
      )}
    </div>
  )
}
