# Migracao Laravel para Next.js

Fonte da verdade: `C:\xampp81\htdocs\EquilibraMente`.

## Migrado

- Projeto Next.js App Router em TypeScript.
- Assets publicos do Laravel copiados para `public/`.
- Pagina inicial, detalhes da sala, login, cadastro, cliente/reservas e painel admin base.
- Controllers principais convertidos para API routes: newsletter, CEP, horarios disponiveis, revisao/confirmacao de reserva, reservas por sala, atividades, salas, usuarios e Mercado Pago.
- Autenticacao preparada para Supabase Auth com cookies HTTP-only.
- Acesso ao banco preparado via Supabase Postgres.
- `.env.example` e instrucoes de deploy na Vercel.

## Banco Railway x migrations

Pelo print do Railway, as tabelas visiveis batem com o estado final esperado das migrations do Laravel:
`atividades`, `bloqueios_salas`, `contracts`, `contratos_usuarios`, `conveniencias`, `debug_logs`, `enderecos`, `failed_jobs`, `faturas`, `fechaduras`, `imagens_salas`, `migrations`, `newsletters`, `notas_fiscais`, `password_reset_tokens`, `personal_access_tokens`, `reservas`, `sala_conveniencias`, `salas`, `transacoes`, `users`.

A tabela `disponibilidades` nao aparece no print e isso esta correto para o estado final, porque a migration `2026_03_17_130000_replace_disponibilidades_with_bloqueios_salas_table.php` remove `disponibilidades` e cria `bloqueios_salas`.

Observacao: o dump local `dump-railway-202603171411.sql` ainda contem `disponibilidades` e nao contem `bloqueios_salas`, entao esse dump esta mais antigo que o banco exibido no print.

## Nao migrado automaticamente

- Conteudo juridico completo das paginas de politica e termos.
- Templates de e-mail Laravel/Mailable.
- Upload/redimensionamento de imagens equivalente ao GD do PHP.
- Assinatura de links Laravel (`signedRoute`) para aprovacao/documentos.
- Google OAuth Socialite. Deve ser configurado via Supabase Auth provider.
- PagBank antigo. Mantive Mercado Pago como fluxo principal.
- Conversao visual pixel-perfect de todas as telas Blade administrativas; a base esta pronta, mas alguns modais/DataTables precisam refinamento apos Supabase.
