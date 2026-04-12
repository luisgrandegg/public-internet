import * as React from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export interface CheckboxGroupOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps {
  legend: string;
  options: CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, error, className: _className, id, ...props }, ref) {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    return (
      <div className={styles.wrapper}>
        <label className={styles.checkboxWrapper} htmlFor={checkboxId}>
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={styles.nativeInput}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            {...props}
          />
          <span className={styles.customBox} aria-hidden="true" />
          <span className={styles.labelText}>{label}</span>
        </label>
        {error && (
          <span
            id={`${checkboxId}-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

function CheckboxGroup({
  legend,
  options,
  value,
  onChange,
  error,
}: CheckboxGroupProps) {
  const groupId = React.useId();

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={error ? `${groupId}-error` : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.optionsList}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={value.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
          />
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

CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, CheckboxGroup };
