export function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function dateBr(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
