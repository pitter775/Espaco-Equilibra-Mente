"use client";

import { useState } from "react";

export function ConfirmReservationButton() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function confirmReservation() {
    if (!accepted) {
      setMessage("Voce precisa aceitar os termos do regulamento para continuar.");
      return;
    }

    setLoading(true);
    setMessage("");

    const paymentWindow = window.open("", "_blank");
    try {
      paymentWindow?.document.write("<p style=\"font-family:sans-serif;padding:16px\">Abrindo checkout...</p>");

      const formData = new FormData();
      formData.set("metodo_pagamento", "mercadopago");
      const response = await fetch("/api/reserva/confirmar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.redirect) {
        paymentWindow?.close();
        setMessage(data.message || "Erro ao confirmar a reserva.");
        return;
      }

      const redirectUrl = /^https?:\/\//i.test(data.redirect)
        ? data.redirect
        : new URL(data.redirect, window.location.origin).href;
      paymentWindow?.location.replace(redirectUrl);
      setMessage("Reserva criada. Finalize o pagamento na aba aberta.");
    } catch {
      paymentWindow?.close();
      setMessage("Erro ao confirmar a reserva.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="aceitoRegras"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <label className="form-check-label" htmlFor="aceitoRegras">
          Li e aceito os termos do regulamento de uso das salas.
        </label>
      </div>
      <button className="eq-btn" type="button" disabled={loading} onClick={confirmReservation}>
        {loading ? "Confirmando..." : "Confirmar Reserva"}
      </button>
      {message && <p className="mt-3 mb-0">{message}</p>}
    </div>
  );
}
