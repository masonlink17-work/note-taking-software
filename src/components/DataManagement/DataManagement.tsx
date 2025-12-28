import { useState } from 'react'
import { exportAllData, importAllData, clearAllData } from '../../storage/database'
import { saveData, loadData } from '../../storage/persistence'
import { useMapStore } from '../../store/mapStore'
import { useNoteStore } from '../../store/noteStore'
import { useFolderStore } from '../../store/folderStore'
import { Folder } from '../../types'
import './DataManagement.css'

export default function DataManagement() {
  const [isOpen, setIsOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const handleExport = async () => {
    try {
      const jsonData = await exportAllData()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `note-taking-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please check the console for details.')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    try {
      const text = await file.text()
      
      if (!window.confirm('Importing data will replace all current data. Are you sure?')) {
        return
      }
      
      await importAllData(text)
      
      // Reload data into stores
      await loadData()
      
      setImportSuccess(true)
      setTimeout(() => {
        setImportSuccess(false)
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      console.error('Import failed:', error)
      setImportError(error instanceof Error ? error.message : 'Import failed')
    }
    
    // Reset file input
    event.target.value = ''
  }

  const handleSave = async () => {
    try {
      await saveData()
      alert('Data saved successfully!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Save failed. Please check the console for details.')
    }
  }

  const handleLoad = async () => {
    try {
      if (!window.confirm('Loading data will replace all current data. Are you sure?')) {
        return
      }
      await loadData()
      alert('Data loaded successfully!')
    } catch (error) {
      console.error('Load failed:', error)
      alert('Load failed. Please check the console for details.')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('This will permanently delete all data. Are you absolutely sure?')) {
      return
    }
    
    if (!window.confirm('Last chance! This action cannot be undone. Continue?')) {
      return
    }
    
    try {
      await clearAllData()
      // Clear stores and recreate root folder
      useMapStore.setState({ objects: [], selectedObjectId: null })
      useNoteStore.setState({ notes: [], selectedNoteId: null })
      // Recreate root folder structure
      const rootFolder: Folder = {
        id: 'root',
        name: 'Root',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      useFolderStore.setState({ folders: [rootFolder], rootFolderId: 'root' })
      alert('All data cleared successfully!')
    } catch (error) {
      console.error('Clear failed:', error)
      alert('Clear failed. Please check the console for details.')
    }
  }

  if (!isOpen) {
    return (
      <button className="data-management-toggle" onClick={() => setIsOpen(true)} title="Data Management">
        💾
      </button>
    )
  }

  return (
    <div className="data-management-panel">
      <div className="data-management-header">
        <h3>Data Management</h3>
        <button className="close-button" onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>

      <div className="data-management-content">
        <div className="data-management-section">
          <h4>Export & Import</h4>
          <div className="data-management-buttons">
            <button onClick={handleExport} className="data-management-button">
              Export to JSON
            </button>
            <label className="data-management-button data-management-button-import">
              Import from JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {importError && (
            <div className="data-management-error">
              Error: {importError}
            </div>
          )}
          {importSuccess && (
            <div className="data-management-success">
              Data imported successfully!
            </div>
          )}
        </div>

        <div className="data-management-section">
          <h4>Manual Save/Load</h4>
          <div className="data-management-buttons">
            <button onClick={handleSave} className="data-management-button">
              Save Now
            </button>
            <button onClick={handleLoad} className="data-management-button">
              Load from Storage
            </button>
          </div>
          <p className="data-management-hint">
            Note: Data is automatically saved 2 seconds after changes. Manual save is usually not needed.
          </p>
        </div>

        <div className="data-management-section">
          <h4>Danger Zone</h4>
          <button onClick={handleClear} className="data-management-button data-management-button-danger">
            Clear All Data
          </button>
          <p className="data-management-warning">
            ⚠️ This will permanently delete all notes, objects, and folders. This cannot be undone!
          </p>
        </div>
      </div>
    </div>
  )
}

