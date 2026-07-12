import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  const [eventIDInput, setEventIDInput] = useState('')
  const [activeEventID, setActiveEventID] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [eventQrDataUrl, setEventQrDataUrl] = useState('')
  const [copyStatus, setCopyStatus] = useState('idle')

  const eventLink = useMemo(() => {
    if (!activeEventID) {
      return ''
    }

    return `${window.location.origin}/e/${encodeURIComponent(activeEventID)}`
  }, [activeEventID])

  useEffect(() => {
    if (!eventLink) {
      setEventQrDataUrl('')
      return
    }

    let isCancelled = false

    QRCode.toDataURL(eventLink, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!isCancelled) {
          setEventQrDataUrl(dataUrl)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setEventQrDataUrl('')
        }
      })

    return () => {
      isCancelled = true
    }
  }, [eventLink])

  function handleCreateLink(e) {
    e.preventDefault()

    const normalizedEventID = eventIDInput.trim()
    if (!normalizedEventID) {
      setErrorMessage('Please enter an event ID first.')
      return
    }

    setErrorMessage('')
    setCopyStatus('idle')
    setActiveEventID(normalizedEventID)
  }

  function handleGenerateEventID() {
    const randomText = Math.random().toString(36).slice(2, 8)
    const generatedEventID = `evt-${Date.now().toString(36)}-${randomText}`

    setEventIDInput(generatedEventID)
    setActiveEventID(generatedEventID)
    setErrorMessage('')
    setCopyStatus('idle')
  }

  async function handleCopyLink() {
    if (!eventLink || !navigator.clipboard) {
      setCopyStatus('error')
      return
    }

    try {
      await navigator.clipboard.writeText(eventLink)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>📸</div>
        <h1 className={styles.title}>Event Photo Booth</h1>
        <p className={styles.description}>
          Scan the QR code at your event to upload photos and browse the live
          event gallery.
        </p>
        <p className={styles.hint}>
          If you have a direct event link, open it on your phone to get started.
        </p>

        <form className={styles.form} onSubmit={handleCreateLink}>
          <label className={styles.label} htmlFor="event-id">
            Event ID
          </label>
          <input
            id="event-id"
            className={styles.input}
            type="text"
            value={eventIDInput}
            onChange={(e) => setEventIDInput(e.target.value)}
            placeholder="evt-summer-party-2026"
            maxLength={120}
          />

          <div className={styles.formActions}>
            <button type="submit" className={styles.button}>
              Make Event Link
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleGenerateEventID}
            >
              Generate ID
            </button>
          </div>
        </form>

        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}

        {activeEventID && (
          <section className={styles.resultSection}>
            <h2 className={styles.resultTitle}>Event Ready</h2>
            <p className={styles.eventCode}>Event ID: {activeEventID}</p>
            <a className={styles.eventLink} href={eventLink}>
              {eventLink}
            </a>

            {eventQrDataUrl && (
              <img
                src={eventQrDataUrl}
                alt="QR code linking to this event upload page"
                className={styles.qrImage}
              />
            )}

            <div className={styles.resultActions}>
              <button type="button" className={styles.secondaryButton} onClick={handleCopyLink}>
                Copy Link
              </button>
              <a href={eventLink} className={styles.secondaryButton}>
                Open Event Page
              </a>
            </div>

            {copyStatus === 'copied' && <p className={styles.copyStatus}>Link copied to clipboard.</p>}
            {copyStatus === 'error' && (
              <p className={styles.copyStatus}>Unable to copy automatically. Please copy the link manually.</p>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
