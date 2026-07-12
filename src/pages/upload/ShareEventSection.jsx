import styles from '../UploadPage.module.css'

export default function ShareEventSection({ eventLink, eventQrDataUrl, copyStatus, onCopy }) {
  if (!eventLink) {
    return null
  }

  return (
    <section className={styles.shareSection}>
      <h2 className={styles.shareTitle}>Share This Event</h2>
      <p className={styles.shareSubtitle}>Guests can scan this QR code to upload photos.</p>
      {eventQrDataUrl && (
        <img
          src={eventQrDataUrl}
          alt="QR code linking to this event page"
          className={styles.qrImage}
        />
      )}
      <a href={eventLink} className={styles.eventLink}>
        {eventLink}
      </a>
      <button
        type="button"
        className={styles.secondaryButton}
        onClick={onCopy}
      >
        Copy Event Link
      </button>
      {copyStatus === 'copied' && <p className={styles.copyStatus}>Event link copied.</p>}
      {copyStatus === 'error' && (
        <p className={styles.copyStatus}>Could not copy automatically. Please copy the URL manually.</p>
      )}
    </section>
  )
}
