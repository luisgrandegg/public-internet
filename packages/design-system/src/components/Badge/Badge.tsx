import * as React from "react";
import styles from "./Badge.module.css";

export interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={[styles.root, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

Badge.displayName = "Badge";
