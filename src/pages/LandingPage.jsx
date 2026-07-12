import styles from './LandingPage.module.css'

export default function LandingPage() {
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
      </div>
    </main>
  )
}
