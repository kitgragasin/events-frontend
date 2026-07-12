import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { uploadPhoto } from '../services/api'
import styles from './UploadPage.module.css'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

export default function UploadPage() {
  const { eventCode } = useParams()
  const [status, setStatus] = useState('idle') // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Please select a valid image file.')
      setStatus('error')
      setSelectedFile(null)
      setPreview(null)
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      setStatus('error')
      setSelectedFile(null)
      setPreview(null)
      return
    }

    setSelectedFile(file)
    setStatus('idle')
    setErrorMessage('')

    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!selectedFile) {
      setErrorMessage('Please choose a photo first.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setErrorMessage('')

    try {
      await uploadPhoto(eventCode, selectedFile)
      setStatus('success')
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  function handleReset() {
    setStatus('idle')
    setErrorMessage('')
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (status === 'success') {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.title}>Photo Uploaded!</h2>
          <p className={styles.description}>
            Your photo has been added to the event. Thank you!
          </p>
          <button className={styles.button} onClick={handleReset}>
            Upload Another
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>📷</div>
          <h1 className={styles.title}>Upload a Photo</h1>
          <p className={styles.eventCode}>Event: {eventCode}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.fileLabel} htmlFor="photo-input">
            {preview ? (
              <img src={preview} alt="Preview" className={styles.preview} />
            ) : (
              <div className={styles.filePlaceholder}>
                <span className={styles.filePlaceholderIcon}>🖼️</span>
                <span>Tap to select or take a photo</span>
              </div>
            )}
          </label>

          <input
            id="photo-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={status === 'uploading'}
          />

          {status === 'error' && errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className={styles.button}
            disabled={!selectedFile || status === 'uploading'}
          >
            {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
          </button>
        </form>

        <p className={styles.hint}>
          Accepted: images up to {MAX_FILE_SIZE_MB} MB
        </p>
      </div>
    </main>
  )
}
