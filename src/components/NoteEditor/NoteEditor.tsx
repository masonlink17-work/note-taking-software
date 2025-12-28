import { useState, useEffect } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useMapStore } from '../../store/mapStore'
import './NoteEditor.css'

interface NoteEditorProps {
  noteId: string | null
  onClose?: () => void
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { notes, updateNote, deleteNote, selectedNoteId } = useNoteStore()
  const note = noteId ? notes.find((n) => n.id === noteId) : null

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTagsInput(note.tags.join(', '))
    } else {
      setTitle('')
      setContent('')
      setTagsInput('')
    }
  }, [note])

  const handleSave = () => {
    if (!noteId) return

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    updateNote(noteId, {
      title: title.trim() || 'Untitled Note',
      content,
      tags,
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Auto-save on content change (debounced would be better, but simple for now)
    if (noteId) {
      updateNote(noteId, { content: e.target.value })
    }
  }

  const handleTitleBlur = () => {
    handleSave()
  }

  const handleTagsBlur = () => {
    handleSave()
  }

  const handleDelete = () => {
    if (noteId && window.confirm('Are you sure you want to delete this note?')) {
      const note = notes.find((n) => n.id === noteId)
      if (note) {
        // Unlink from all objects
        const mapStore = useMapStore.getState()
        note.linkedObjectIds.forEach((objectId) => {
          const obj = mapStore.objects.find((o) => o.id === objectId)
          if (obj) {
            mapStore.updateObject(objectId, {
              linkedNotes: obj.linkedNotes.filter((id) => id !== noteId),
            })
          }
        })
      }
      deleteNote(noteId)
      onClose?.()
    }
  }

  if (!note) {
    return (
      <div className="note-editor empty">
        <p>No note selected</p>
      </div>
    )
  }

  return (
    <div className="note-editor">
      <div className="note-header">
        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Note title..."
        />
        {onClose && (
          <button className="close-button" onClick={onClose} title="Close">
            ×
          </button>
        )}
      </div>

      <div className="note-meta">
        <div className="note-dates">
          <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
        <button className="delete-button" onClick={handleDelete} title="Delete note">
          🗑️
        </button>
      </div>

      <div className="note-tags-section">
        <label>
          Tags (comma-separated):
          <input
            type="text"
            className="tags-input"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={handleTagsBlur}
            placeholder="tag1, tag2, tag3"
          />
        </label>
        {note.tags.length > 0 && (
          <div className="tags-display">
            {note.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <textarea
        className="note-content"
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing your note..."
      />
    </div>
  )
}
