import styles from './LandingPage.module.css'

export default function LandingPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>📸</div>
        <h1 className={styles.title}>Event Photos</h1>
        <p className={styles.description}>
          Scan the QR code at your event to upload photos and share your
          memories with everyone.
        </p>
        <p className={styles.hint}>
          If you have a direct event link, open it on your mobile device to get
          started.
        </p>
      </div>
    </main>
  )
}
