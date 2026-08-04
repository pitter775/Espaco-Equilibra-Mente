"use client";

import { useState } from "react";

type PasswordFieldProps = {
  name?: string;
  className?: string;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordField({ name = "password", className = "", autoComplete = "current-password", required = true }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`password-field ${className}`}>
      <input type={showPassword ? "text" : "password"} name={name} autoComplete={autoComplete} required={required} />
      <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>
        <i className={showPassword ? "fa fa-eye-slash" : "fa fa-eye"} aria-hidden="true" />
      </button>
    </div>
  );
}
