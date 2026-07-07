<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Handoff EquilibraMente

- Projeto Next.js App Router em `C:\Projetos\Equilibra-Mente`; Laravel fonte da verdade em `C:\xampp81\htdocs\EquilibraMente`.
- Nao alterar o projeto Laravel original.
- Home publica deve manter visual/ordem da Blade `resources/views/site/index.blade.php` e usar assets copiados em `public/assets`.
- Supabase ja recebeu o dump `dump-railway-202607071253.sql` via `scripts/import-mysql-dump.js`.
- Contagens validadas no Supabase: `salas=3`, `imagens_salas=14`, `conveniencias=33`, `sala_conveniencias=42`, `users=41`, `reservas=202`, `transacoes=383`, `bloqueios_salas=31`, `debug_logs=1319`.
- `supabase/schema.sql` foi ajustado para IDs de usuario como `text`, por compatibilidade com IDs numericos herdados do Laravel/Railway e UUIDs futuros do Supabase Auth.
- Grants do Supabase foram adicionados no schema para leitura publica de salas/imagens/conveniencias/enderecos e uso do `service_role`.
- Home publica foi expandida em `src/app/page.tsx` com: funcionamento, atendimento, profissionais, FAQ, galeria, depoimentos, especialistas e contatos.
- CSS principal da home esta em `src/app/globals.css`; scroll suave foi refeito com `html { scroll-behavior: smooth; }`.
- Scripts jQuery legados foram removidos de `src/app/layout.tsx` porque `public/assets/js/main.js` quebrava no Next com `counterUp is not a function`.
- Admin de salas em `src/app/admin/salas/page.tsx` tem listagem, criacao e edicao basica por Server Actions.
- Ainda falta validar build depois da ultima alteracao no admin de salas, reiniciar servidor local, verificar home/admin visualmente e commitar/pushar.
- Ainda falta evoluir admin de salas para gerir imagens e conveniencias.
- Nao commitar `.env.local`, `backup.sql`, nem `dump-railway-*.sql`.
