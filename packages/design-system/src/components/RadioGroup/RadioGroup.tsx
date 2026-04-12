import * as React from "react";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  layout?: "vertical" | "grid";
}

function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  layout = "vertical",
}: RadioGroupProps) {
  const groupId = React.useId();
  const isGrid = layout === "grid";

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={error ? `${groupId}-error` : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={isGrid ? styles.listGrid : styles.listVertical}>
        {options.map((option) => (
          <div key={option.value} className={styles.optionWrapper}>
            <input
              type="radio"
              id={`${groupId}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.nativeInput}
            />
            <label
              htmlFor={`${groupId}-${option.value}`}
              className={isGrid ? styles.cardLabel : styles.inlineLabel}
            >
              {isGrid ? (
                <>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description && (
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className={styles.radioIndicator} aria-hidden="true" />
                  <span>
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.description && (
                      <span className={styles.optionDescription}>
                        {option.description}
                      </span>
                    )}
                  </span>
                </>
              )}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <span
          id={`${groupId}-error`}
          className={styles.errorMessage}
          role="alert"
        >
          {error}
        </span>
      )}
    </fieldset>
  );
}

RadioGroup.displayName = "RadioGroup";

export { RadioGroup };
