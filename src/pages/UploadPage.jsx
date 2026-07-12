import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPhotoBlob, getApiClientStatus, listEventPhotos, uploadPhoto } from '../services/api'
import styles from './UploadPage.module.css'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

export default function UploadPage() {
  const { eventID } = useParams()
  const apiStatus = getApiClientStatus()
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [galleryStatus, setGalleryStatus] = useState('idle')
  const [galleryError, setGalleryError] = useState('')
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [galleryCount, setGalleryCount] = useState(0)
  const fileInputRef = useRef(null)
  const galleryBlobUrlsRef = useRef([])

  function revokeGalleryBlobUrls() {
    galleryBlobUrlsRef.current.forEach((blobUrl) => URL.revokeObjectURL(blobUrl))
    galleryBlobUrlsRef.current = []
  }

  async function loadGallery() {
    if (!eventID) {
      setGalleryStatus('error')
      setGalleryError('Missing event identifier in the URL.')
      return
    }

    setGalleryStatus('loading')
    setGalleryError('')

    try {
      const data = await listEventPhotos(eventID)
      const photos = Array.isArray(data.photos) ? data.photos : []

      const photosWithBlobUrls = await Promise.all(
        photos.map(async (photo) => {
          const blob = await fetchPhotoBlob(photo.photoID)
          return {
            ...photo,
            blobUrl: URL.createObjectURL(blob),
          }
        }),
      )

      revokeGalleryBlobUrls()
      galleryBlobUrlsRef.current = photosWithBlobUrls.map((photo) => photo.blobUrl)
      setGalleryPhotos(photosWithBlobUrls)
      setGalleryCount(typeof data.count === 'number' ? data.count : photosWithBlobUrls.length)
      setGalleryStatus('ready')
    } catch (err) {
      revokeGalleryBlobUrls()
      setGalleryPhotos([])
      setGalleryCount(0)
      setGalleryError(err.message || 'Something went wrong while loading the gallery.')
      setGalleryStatus('error')
    }
  }

  useEffect(() => {
    loadGallery()

    return () => {
      revokeGalleryBlobUrls()
    }
  }, [eventID])

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
      await uploadPhoto(eventID, selectedFile)
      setStatus('success')
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadGallery()
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

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>📷</div>
          <h1 className={styles.title}>Upload a Photo</h1>
          <p className={styles.eventCode}>Event: {eventID || 'Unknown event'}</p>
          {import.meta.env.DEV && (
            <p className={styles.apiStatus}>
              API base: {apiStatus.baseUrl} | API key: {apiStatus.apiKey}
            </p>
          )}
        </div>

        {status === 'success' && (
          <div className={styles.successMessage} role="status">
            <div className={styles.successIcon}>✅</div>
            <div>
              <strong>Photo uploaded.</strong> It is now visible in the event gallery below.
            </div>
            <button className={styles.secondaryButton} onClick={handleReset} type="button">
              Upload Another
            </button>
          </div>
        )}

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
            disabled={status === 'uploading' || !eventID}
          />

          {status === 'error' && errorMessage && (
            <div className={styles.errorBlock} role="alert">
              <p className={styles.errorMessage}>{errorMessage}</p>
              {import.meta.env.DEV && (
                <p className={styles.errorDebug}>API key used: {apiStatus.apiKey}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className={styles.button}
            disabled={!selectedFile || status === 'uploading' || !eventID}
          >
            {status === 'uploading' ? 'Uploading…' : 'Upload Photo'}
          </button>
        </form>

        <p className={styles.hint}>
          Accepted: images up to {MAX_FILE_SIZE_MB} MB
        </p>

        <section className={styles.gallerySection}>
          <div className={styles.galleryHeader}>
            <div>
              <h2 className={styles.galleryTitle}>Event Gallery</h2>
              <p className={styles.gallerySubtitle}>
                {galleryStatus === 'loading'
                  ? 'Loading uploaded photos...'
                  : `${galleryCount} photo${galleryCount === 1 ? '' : 's'} in this event`}
              </p>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={loadGallery}
              disabled={galleryStatus === 'loading' || !eventID}
            >
              Refresh
            </button>
          </div>

          {galleryStatus === 'error' && galleryError && (
            <div className={styles.errorBlock} role="alert">
              <p className={styles.errorMessage}>{galleryError}</p>
              {import.meta.env.DEV && (
                <p className={styles.errorDebug}>API key used: {apiStatus.apiKey}</p>
              )}
            </div>
          )}

          {galleryStatus === 'loading' && (
            <div className={styles.galleryEmptyState}>Loading photos...</div>
          )}

          {galleryStatus === 'ready' && galleryPhotos.length === 0 && (
            <div className={styles.galleryEmptyState}>
              No photos have been uploaded to this event yet.
            </div>
          )}

          {galleryStatus === 'ready' && galleryPhotos.length > 0 && (
            <div className={styles.galleryGrid}>
              {galleryPhotos.map((photo) => (
                <article key={photo.photoID} className={styles.galleryCard}>
                  <img
                    src={photo.blobUrl}
                    alt={photo.originalName || 'Event photo'}
                    className={styles.galleryImage}
                    loading="lazy"
                  />
                  <div className={styles.galleryMeta}>
                    <span className={styles.galleryName}>{photo.originalName || photo.photoID}</span>
                    <span className={styles.galleryDetail}>
                      {photo.createdAt ? new Date(photo.createdAt).toLocaleString() : photo.mimeType || 'Photo'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
