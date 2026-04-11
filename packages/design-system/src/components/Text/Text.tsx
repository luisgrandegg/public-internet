import * as React from "react";
import styles from "./Text.module.css";

export interface TextProps {
  variant?: "heading" | "body" | "caption" | "label";
  /** Heading level — only applies when variant="heading". Defaults to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Associates a label with a form control — only applies when variant="label". */
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Text({
  variant = "body",
  level = 2,
  htmlFor,
  children,
  className,
}: TextProps) {
  const cls = [styles.root, styles[variant], className].filter(Boolean).join(" ");

  if (variant === "heading") {
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return <Tag className={cls}>{children}</Tag>;
  }

  if (variant === "label") {
    return (
      <label htmlFor={htmlFor} className={cls}>
        {children}
      </label>
    );
  }

  if (variant === "caption") {
    return <span className={cls}>{children}</span>;
  }

  return <p className={cls}>{children}</p>;
}

Text.displayName = "Text";
