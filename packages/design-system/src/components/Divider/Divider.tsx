import * as React from "react";
import styles from "./Divider.module.css";

export interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return (
    <hr className={[styles.root, className].filter(Boolean).join(" ")} />
  );
}

Divider.displayName = "Divider";
