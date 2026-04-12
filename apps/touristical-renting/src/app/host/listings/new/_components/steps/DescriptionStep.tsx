import { Input } from '@public-internet/design-system'
import styles from './DescriptionStep.module.css'

interface DescriptionStepProps {
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

// GAP: Requires <Textarea> component from design system (Textarea exists — use it here once wired)
export function DescriptionStep({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: DescriptionStepProps) {
  return (
    <div className={styles.root}>
      <h2 className={styles.heading}>Describe your property</h2>

      <Input
        name="title"
        label="Listing title"
        placeholder="e.g. Bright flat in the Eixample"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        required
      />

      <div className={styles.textareaWrapper}>
        <label htmlFor="description" className={styles.textareaLabel}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className={styles.textarea}
          placeholder="Describe what makes your property special — location, features, surroundings…"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={6}
          required
        />
      </div>
    </div>
  )
}
