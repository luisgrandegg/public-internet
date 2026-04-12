import * as React from 'react'
import styles from './Stepper.module.css'

export interface StepperStep {
  label: string
  description?: string
}

export interface StepperProps {
  steps: StepperStep[]
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
}

export function Stepper({ steps, currentStep, orientation = 'horizontal' }: StepperProps) {
  return (
    <ol
      className={[
        styles.list,
        orientation === 'vertical' ? styles.vertical : styles.horizontal,
      ].join(' ')}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep
        const isActive = index === currentStep
        const isPending = index > currentStep

        return (
          <li
            key={index}
            className={[
              styles.step,
              isComplete ? styles.complete : '',
              isActive ? styles.active : '',
              isPending ? styles.pending : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className={styles.stepIndicator}>
              {isComplete ? (
                <span className={styles.checkmark} aria-hidden="true">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              ) : (
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
              )}
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepLabel}>{step.label}</span>
              {step.description && (
                <span className={styles.stepDescription}>{step.description}</span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

Stepper.displayName = 'Stepper'
