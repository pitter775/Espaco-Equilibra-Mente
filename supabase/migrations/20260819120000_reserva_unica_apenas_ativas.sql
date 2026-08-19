alter table public.reservas
  drop constraint if exists reserva_unica;

drop index if exists public.reserva_unica;

create unique index reserva_unica
  on public.reservas (sala_id, data_reserva, hora_inicio, hora_fim)
  where lower(status) in ('pendente', 'confirmada');
