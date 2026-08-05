"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export function LoadingButton({
  loading = false,
  loadingLabel,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      className={`${className ?? ""} ${loading ? "is-loading" : ""}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span className="btn-label">{loading ? loadingLabel ?? children : children}</span>
    </button>
  );
}

export function SubmitButton({
  loadingLabel,
  children,
  disabled,
  className,
  ...props
}: Omit<LoadingButtonProps, "loading">) {
  const { pending } = useFormStatus();

  return (
    <LoadingButton
      {...props}
      className={className}
      disabled={disabled}
      loading={pending}
      loadingLabel={loadingLabel}
      type="submit"
    >
      {children}
    </LoadingButton>
  );
}
