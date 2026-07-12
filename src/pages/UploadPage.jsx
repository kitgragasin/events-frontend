import { useParams } from 'react-router-dom'
import { getApiClientStatus } from '../services/api'
import {
  MAX_FILE_SIZE_MB,
  useEventGallery,
  useEventShare,
  usePhotoUpload,
} from './upload/useUploadPageHooks'
import GallerySection from './upload/GallerySection'
import ShareEventSection from './upload/ShareEventSection'
import UploadFormSection from './upload/UploadFormSection'
import styles from './UploadPage.module.css'

export default function UploadPage() {
  const { eventID } = useParams()
  const apiStatus = getApiClientStatus()
  const { eventLink, eventQrDataUrl, copyStatus, handleCopyEventLink } = useEventShare(eventID)
  const {
    galleryStatus,
    galleryError,
    galleryPhotos,
    galleryCount,
    loadGallery,
  } = useEventGallery(eventID)
  const {
    status,
    errorMessage,
    selectedFile,
    preview,
    fileInputRef,
    handleFileChange,
    handleSubmit,
    handleReset,
  } = usePhotoUpload(eventID, loadGallery)

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

        <ShareEventSection
          eventLink={eventLink}
          eventQrDataUrl={eventQrDataUrl}
          copyStatus={copyStatus}
          onCopy={handleCopyEventLink}
        />

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

        <UploadFormSection
          eventID={eventID}
          status={status}
          errorMessage={errorMessage}
          preview={preview}
          selectedFile={selectedFile}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          apiStatus={apiStatus}
        />

        <p className={styles.hint}>
          Accepted: images up to {MAX_FILE_SIZE_MB} MB
        </p>

        <GallerySection
          eventID={eventID}
          galleryStatus={galleryStatus}
          galleryError={galleryError}
          galleryPhotos={galleryPhotos}
          galleryCount={galleryCount}
          onRefresh={loadGallery}
          apiStatus={apiStatus}
        />
      </div>
    </main>
  )
}
