import { useState } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { useFolderStore } from '../../store/folderStore'
import { useMapStore } from '../../store/mapStore'
import { Note, Folder } from '../../types'
import './FileTreeSidebar.css'

interface TreeNodeProps {
  item: Note | Folder
  level: number
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
}

function TreeNode({ item, level, expandedFolders, onToggleFolder }: TreeNodeProps) {
  const { selectNote, notes, updateNote, deleteNote, moveNoteToFolder } = useNoteStore()
  const { folders, updateFolder, deleteFolder, rootFolderId } = useFolderStore()
  const { selectObject } = useMapStore()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(
    'parentId' in item && 'name' in item && !('title' in item)
      ? (item as Folder).name
      : (item as Note).title
  )
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const isFolder = 'parentId' in item && 'name' in item && !('title' in item)
  const note = !isFolder ? (item as Note) : null
  const folder = isFolder ? (item as Folder) : null

  const isExpanded = isFolder && folder ? expandedFolders.has(folder.id) : false

  const handleClick = () => {
    if (isFolder && folder) {
      onToggleFolder(folder.id)
      // Navigate to associated object if folder has one
      const mapStore = useMapStore.getState()
      const associatedObject = mapStore.objects.find((obj) => obj.folderId === folder.id)
      if (associatedObject) {
        selectObject(associatedObject.id)
      }
    } else if (note) {
      selectNote(note.id)
      // If note is linked to objects, select the first one
      if (note.linkedObjectIds.length > 0) {
        selectObject(note.linkedObjectIds[0])
      }
    }
  }

  const handleRename = () => {
    if (isRenaming) {
      if (isFolder && folder) {
        updateFolder(folder.id, { name: renameValue })
      } else if (note) {
        updateNote(note.id, { title: renameValue })
      }
      setIsRenaming(false)
    } else {
      setIsRenaming(true)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const name = isFolder && folder ? folder.name : note ? note.title : ''
    if (window.confirm(`Delete ${isFolder ? 'folder' : 'note'} "${name}"?`)) {
      if (isFolder && folder) {
        deleteFolder(folder.id)
      } else if (note) {
        deleteNote(note.id)
      }
    }
  }

  const handleMoveToFolder = (targetFolderId: string | null) => {
    if (note) {
      moveNoteToFolder(note.id, targetFolderId)
      setShowMoveMenu(false)
    }
  }

  // Drag handlers for notes
  const handleDragStart = (e: React.DragEvent) => {
    if (note) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', note.id)
      e.dataTransfer.setData('application/x-note-id', note.id)
      // Add visual feedback
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5'
      }
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Restore opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  // Drop handlers for folders
  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder && folder) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = () => {
    if (isFolder && folder) {
      setIsDraggingOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isFolder && folder) {
      e.preventDefault()
      setIsDraggingOver(false)
      const noteId = e.dataTransfer.getData('application/x-note-id') || e.dataTransfer.getData('text/plain')
      if (noteId) {
        const draggedNote = notes.find((n) => n.id === noteId)
        // Don't move if note is already in this folder
        if (draggedNote && draggedNote.folderId !== folder.id) {
          moveNoteToFolder(noteId, folder.id)
        }
      }
    }
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setRenameValue(isFolder && folder ? folder.name : note ? note.title : '')
    }
  }

  // Get child items for folders
  const childItems: (Note | Folder)[] = []
  if (isFolder && folder) {
    // Get folders with this parent (sorted by name)
    const childFolders = folders
      .filter((f) => f.parentId === folder.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    childFolders.forEach((f) => childItems.push(f))
    
    // Get notes in this folder (sorted by title)
    const childNotes = notes
      .filter((n) => n.folderId === folder.id)
      .sort((a, b) => a.title.localeCompare(b.title))
    childNotes.forEach((n) => childItems.push(n))
  }

  const displayName = isFolder && folder ? folder.name : note ? note.title : ''

  return (
    <div className="tree-node" style={{ position: 'relative' }}>
      <div
        className={`tree-item ${isFolder ? 'folder' : 'note'} ${isDraggingOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleClick}
        draggable={!isFolder && note ? true : false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isFolder && (
          <span className="tree-icon">{isExpanded ? '📂' : '📁'}</span>
        )}
        {!isFolder && <span className="tree-icon">📄</span>}

        {isRenaming ? (
          <input
            type="text"
            className="tree-rename-input"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="tree-label">{displayName}</span>
        )}

        <div className="tree-actions" onMouseDown={(e) => e.stopPropagation()}>
          {!isFolder && note && (
            <button
              className="tree-action-button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMoveMenu(!showMoveMenu)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Move to folder"
            >
              📁
            </button>
          )}
          <button
            className="tree-action-button"
            onClick={(e) => {
              e.stopPropagation()
              handleRename()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Rename"
          >
            ✏️
          </button>
          <button
            className="tree-action-button"
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            title="Delete"
          >
            🗑️
          </button>
        </div>
        
        {!isFolder && note && showMoveMenu && (
          <div className="move-menu" onClick={(e) => e.stopPropagation()}>
            <div className="move-menu-header">Move to folder:</div>
            <button
              className="move-menu-item"
              onClick={() => handleMoveToFolder(null)}
            >
              Root
            </button>
            {folders
              .filter((f) => f.id !== rootFolderId)
              .map((f) => (
                <button
                  key={f.id}
                  className="move-menu-item"
                  onClick={() => handleMoveToFolder(f.id)}
                >
                  {f.name}
                </button>
              ))}
            <button
              className="move-menu-item cancel"
              onClick={() => setShowMoveMenu(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {isFolder && folder && isExpanded && (
        <div className="tree-children">
          {childItems.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileTreeSidebar() {
  const { folders, rootFolderId } = useFolderStore()
  const { notes } = useNoteStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  // Manual folder creation removed - folders are now only created automatically with objects

  // Build tree structure for root level
  const rootItems: (Note | Folder)[] = []
  
  if (!searchQuery) {
    // Show hierarchical tree structure when not searching
    // Folders first (sorted)
    const rootLevelFolders = folders
      .filter((f) => f.parentId === rootFolderId)
      .sort((a, b) => a.name.localeCompare(b.name))
    rootLevelFolders.forEach((f) => rootItems.push(f))
    
    // Then notes at root level (sorted)
    const rootLevelNotes = notes
      .filter((n) => n.folderId === rootFolderId || n.folderId === null)
      .sort((a, b) => a.title.localeCompare(b.title))
    rootLevelNotes.forEach((n) => rootItems.push(n))
  } else {
    // Show flat filtered list when searching
    const query = searchQuery.toLowerCase()
    
    // Filter folders
    folders
      .filter((f) => f.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((f) => rootItems.push(f))
    
    // Filter notes
    notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))
      )
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((n) => rootItems.push(n))
  }

  return (
    <div className="file-tree-sidebar">
      <div className="sidebar-header">
        <h3>File Tree</h3>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          className="sidebar-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
        />
      </div>

      <div className="tree-container">
        {rootItems.length === 0 ? (
          <div className="empty-tree">No items</div>
        ) : (
          rootItems.map((item) => (
            <TreeNode
              key={item.id}
              item={item}
              level={0}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
            />
          ))
        )}
      </div>
    </div>
  )
}