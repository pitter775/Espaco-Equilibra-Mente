export function getMercadoPagoAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";
}
