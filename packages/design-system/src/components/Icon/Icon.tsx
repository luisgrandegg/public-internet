import * as React from "react";
import styles from "./Icon.module.css";

const icons = {
  home: (
    <path
      d="M3 9.5L12 3l9 6.5V21h-6v-6H9v6H3V9.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </>
  ),
  menu: (
    <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
  ),
  check: (
    <path d="M4 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  star: (
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      strokeLinejoin="round"
    />
  ),
  "map-pin": (
    <>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "chevron-right": (
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chevron-down": (
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "arrow-right": (
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "alert-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: "sm" | "md" | "lg";
  /** Accessible label. Omit for decorative icons. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = "md", label, className }: IconProps) {
  return (
    <span
      className={[styles.root, styles[size], className].filter(Boolean).join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
      >
        {icons[name]}
      </svg>
    </span>
  );
}

Icon.displayName = "Icon";
