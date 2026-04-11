import * as React from "react";
import styles from "./Stack.module.css";

export interface StackProps {
  direction?: "vertical" | "horizontal";
  gap?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;
  align?: "start" | "center" | "end" | "stretch";
  children: React.ReactNode;
  className?: string;
}

const alignClass: Record<NonNullable<StackProps["align"]>, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

export function Stack({
  direction = "vertical",
  gap = 4,
  align = "stretch",
  children,
  className,
}: StackProps) {
  return (
    <div
      className={[
        styles.root,
        styles[direction],
        styles[`gap${gap}`],
        alignClass[align],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

Stack.displayName = "Stack";
