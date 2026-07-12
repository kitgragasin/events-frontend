import styles from '../UploadPage.module.css'

export default function UploadFormSection({
  eventID,
  status,
  errorMessage,
  preview,
  selectedFile,
  fileInputRef,
  onFileChange,
  onSubmit,
  apiStatus,
}) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
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
        onChange={onFileChange}
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
  )
}
