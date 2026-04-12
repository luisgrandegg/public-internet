import { CreateListingWizard } from './_components/CreateListingWizard'
import styles from './page.module.css'

export default function NewListingPage() {
  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>List your property</h1>
      <CreateListingWizard />
    </div>
  )
}
