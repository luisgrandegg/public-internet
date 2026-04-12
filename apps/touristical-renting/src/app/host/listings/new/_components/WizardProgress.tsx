import styles from './WizardProgress.module.css'

interface WizardProgressProps {
  steps: string[]
  currentStep: number
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <ol className={styles.root} aria-label="Progress">
      {steps.map((label, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <li
            key={label}
            className={[styles.step, isCompleted ? styles.stepCompleted : ''].filter(Boolean).join(' ')}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className={styles.stepContent}>
              <div className={styles.stepIndicator} aria-hidden="true">
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
