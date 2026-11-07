"use client";

import type { MouseEventHandler, ReactNode } from "react";

type ButtonVariant = "ink" | "paper" | "nav";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  target?: string;
  rel?: string;
};

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="M4 16 16 4M7 4h9v9" />
    </svg>
  );
}

/** Shared precision-editorial CTA with stationary outer geometry. */
export function Button({
  children,
  href,
  variant = "ink",
  className = "",
  disabled = false,
  onClick,
  title,
  target,
  rel,
}: ButtonProps) {
  const classes = `button button-${variant} ${className}`.trim();
  const content = (
    <>
      <span className="button-label">{children}</span>
      <span className="button-action" aria-hidden="true">
        <ArrowIcon className="button-arrow" />
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <a className={classes} href={href} title={title} target={target} rel={rel}>
        {content}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {content}
    </button>
  );
}
