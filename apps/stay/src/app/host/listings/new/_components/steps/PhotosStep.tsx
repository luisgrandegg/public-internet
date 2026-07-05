import { Input } from '@public-internet/design-system'
import styles from './PhotosStep.module.css'

interface PhotosStepProps {
  photoUrls: string[]
  onChange: (index: number, value: string) => void
}

// GAP: Requires <FileUpload> component from design system
export function PhotosStep({ photoUrls, onChange }: PhotosStepProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Add photos</h2>
      <p className={styles.description}>
        Paste direct image URLs for your property photos. Good photos help guests understand your space.
      </p>
      <div className={styles.fields}>
        {[0, 1, 2].map((index) => (
          <Input
            key={index}
            name={`photoUrl${index}`}
            type="url"
            label={`Photo URL ${index + 1}${index === 0 ? ' (main photo)' : ' (optional)'}`}
            placeholder="https://example.com/photo.jpg"
            value={photoUrls[index] ?? ''}
            onChange={(e) => onChange(index, e.target.value)}
          />
        ))}
      </div>
    </div>
  )
}
