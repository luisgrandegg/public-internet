'use client' // FileUpload uses state and event handlers

import * as React from 'react'
import styles from './FileUpload.module.css'

export interface FileUploadProps {
  label: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  onFilesChange: (files: File[]) => void
  error?: string
}

export function FileUpload({
  label,
  accept,
  multiple,
  maxFiles,
  onFilesChange,
  error,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const componentId = React.useId()
  const liveRegionId = `${componentId}-live`
  const errorId = `${componentId}-error`

  const handleFiles = (newFiles: File[]) => {
    const limited = maxFiles ? newFiles.slice(0, maxFiles) : newFiles
    setSelectedFiles(limited)
    onFilesChange(limited)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    handleFiles(files)
  }

  const openFilePicker = () => inputRef.current?.click()

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div
        className={[
          styles.dropZone,
          isDragging ? styles.dragging : '',
          error ? styles.errorZone : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={
          [error ? errorId : '', liveRegionId].filter(Boolean).join(' ') ||
          undefined
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.hiddenInput}
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <p className={styles.dropText}>
          Drag and drop files here, or{' '}
          <button
            type="button"
            className={styles.browseButton}
            onClick={openFilePicker}
          >
            browse
          </button>
        </p>
        {accept && <p className={styles.hint}>Accepted: {accept}</p>}
        {maxFiles && (
          <p className={styles.hint}>
            Max {maxFiles} file{maxFiles !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Accessible live region — announces file selection to screen readers */}
      <div
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {selectedFiles.length > 0
          ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected: ${selectedFiles.map((f) => f.name).join(', ')}`
          : ''}
      </div>

      {selectedFiles.length > 0 && (
        <ul className={styles.fileList} aria-label="Selected files">
          {selectedFiles.map((file, i) => (
            <li key={i} className={styles.fileItem}>
              {file.name}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

FileUpload.displayName = 'FileUpload'
