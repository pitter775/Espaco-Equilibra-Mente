"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { PasswordField } from "./PasswordField";

type AuthModalTriggerProps = {
  label: string;
  className?: string;
  salaId?: number | string;
};

export function AuthModalTrigger({ label, className, salaId }: AuthModalTriggerProps) {
  const [open, setOpen] = useState(false);
  const [authError, setAuthError] = useState(false);
  const titleId = useId();
  const redirectTo = salaId ? `/sala/${salaId}#agenda` : "/";
  const googleHref = salaId ? `/login/google?sala_id=${salaId}&anchor=agenda` : "/login/google";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error") === "1") {
      window.setTimeout(() => {
        setOpen(true);
        setAuthError(true);
      }, 0);
      params.delete("auth_error");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.classList.add("auth-modal-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("auth-modal-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" className={className ?? "auth-nav-trigger"} onClick={() => setOpen(true)}>
        {className === "auth-nav-trigger" ? <i className="fa-solid fa-right-to-bracket" aria-hidden="true" /> : null}
        {label}
      </button>

      {open && (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="auth-modal-close" aria-label="Fechar login" onClick={() => setOpen(false)}>
              x
            </button>
            <div className="auth-modal-brand">
              <img src="/assets/img/logoescuro.png" alt="Equilibra Mente" />
              <h2 id={titleId}>Entre na sua conta</h2>
              <p>Acesse suas reservas ou continue para reservar uma sala.</p>
            </div>

            <form method="post" action="/api/auth/login" className="auth-modal-form">
              {authError && (
                <div className="auth-modal-error">
                  Login nao realizado. Confira o e-mail e a senha.
                </div>
              )}
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <label>
                <span>E-mail</span>
                <input type="email" name="email" autoComplete="email" required />
              </label>
              <label>
                <span>Senha</span>
                <PasswordField />
              </label>
              <button type="submit" className="eq-btn w-100">Entrar</button>
            </form>

            <a href={googleHref} className="auth-google">
              <img src="/assets/img/icons/google.png" alt="" />
              <span>Login com Google</span>
            </a>

            <div className="auth-modal-links">
              <Link href="/completar-cadastro">Fazer cadastro</Link>
              <Link href="/login">Abrir página de login</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
