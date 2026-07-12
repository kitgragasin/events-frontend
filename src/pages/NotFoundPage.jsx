import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page you are looking for does not exist. If you have an event
          link, make sure it is complete and correct.
        </p>
        <Link to="/" className={styles.link}>
          Go to Home
        </Link>
      </div>
    </main>
  )
}
