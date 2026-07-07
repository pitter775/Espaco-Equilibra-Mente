insert into public.enderecos (id, rua, numero, bairro, cidade, estado, cep)
values
  (1, 'Rua Dona Antonia de Queiros', '504', 'Consolacao', 'Sao Paulo', 'SP', '01307-013')
on conflict (id) do nothing;

insert into public.salas (id, nome, metragem, descricao, endereco_id, valor, status)
values
  (1, 'Sala 1', '45', '<p>Sala aconchegante para atendimentos presenciais, com ambiente silencioso e estrutura profissional.</p>', 1, 35.00, 'disponivel'),
  (2, 'Sala 2', '35', '<p>Sala planejada para psicologos, terapeutas e profissionais da saude.</p>', 1, 35.00, 'disponivel'),
  (3, 'Sala 3', '54', '<p>Espaco amplo, confortavel e bem localizado para atendimentos por hora.</p>', 1, 34.00, 'disponivel'),
  (4, 'Sala 4', '45', '<p>Ambiente moderno e reservado, ideal para consultas e sessoes terapeuticas.</p>', 1, 35.00, 'disponivel')
on conflict (id) do nothing;

insert into public.imagens_salas (sala_id, imagem_base64, principal)
values
  (1, '/assets/img/salas/sala1.jfif', true),
  (2, '/assets/img/salas/sala2.jfif', true),
  (3, '/assets/img/salas/sala3.jfif', true),
  (4, '/assets/img/salas/sala4.jfif', true);

insert into public.conveniencias (id, nome, icone)
values
  (1, 'Ambiente acolhedor', 'fa-solid fa-check'),
  (2, 'Conforto e privacidade', 'fa-solid fa-lock'),
  (3, 'Excelente localizacao', 'fa-solid fa-location-dot'),
  (4, 'Ambiente equipado', 'fa-solid fa-couch')
on conflict (id) do nothing;

insert into public.sala_conveniencias (sala_id, conveniencia_id)
values
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 4)
on conflict do nothing;

select setval(pg_get_serial_sequence('public.enderecos', 'id'), 1, true);
select setval(pg_get_serial_sequence('public.salas', 'id'), 4, true);
select setval(pg_get_serial_sequence('public.conveniencias', 'id'), 4, true);
