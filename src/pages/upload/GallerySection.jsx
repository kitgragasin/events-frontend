import { formatPhotoDetail } from './useUploadPageHooks'
import styles from '../UploadPage.module.css'

export default function GallerySection({
  eventID,
  galleryStatus,
  galleryError,
  galleryPhotos,
  galleryCount,
  onRefresh,
  apiStatus,
}) {
  return (
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
          onClick={onRefresh}
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
                <span className={styles.galleryDetail}>{formatPhotoDetail(photo)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
