import styles from './SkipLink.module.css'

export function SkipLink({ href }: { href: string }) {
  return (
    <a href={href} className={styles.root}>
      Skip to main content
    </a>
  )
}
