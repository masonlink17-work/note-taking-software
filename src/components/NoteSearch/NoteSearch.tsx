import { useNoteStore } from '../../store/noteStore'
import './NoteSearch.css'

export default function NoteSearch() {
  const { searchQuery, setSearchQuery, getFilteredNotes, notes, selectNote } = useNoteStore()
  const filteredNotes = getFilteredNotes()

  return (
    <div className="note-search">
      <div className="search-header">
        <h3>Search Notes</h3>
        <span className="note-count">
          {filteredNotes.length} / {notes.length}
        </span>
      </div>
      <input
        type="text"
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by title, content, or tags..."
      />
      {filteredNotes.length > 0 && (
        <div className="search-results">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="search-result-item"
              onClick={() => selectNote(note.id)}
            >
              <div className="result-title">{note.title}</div>
              {note.tags.length > 0 && (
                <div className="result-tags">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="result-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="result-preview">
                {note.content.substring(0, 80)}
                {note.content.length > 80 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      {searchQuery && filteredNotes.length === 0 && (
        <div className="no-results">No notes found</div>
      )}
    </div>
  )
}
