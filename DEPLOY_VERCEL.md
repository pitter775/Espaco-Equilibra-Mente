# Deploy na Vercel

1. Crie o projeto na Vercel apontando para este repositorio.
2. Configure as variaveis de ambiente de `.env.example`.
   - Projeto Supabase atual: `dhghpvkxtaunqqtjwait`.
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable key do projeto.
   - `SUPABASE_SERVICE_ROLE_KEY`: secret/service-role key do mesmo projeto. Sem ela, rotas admin e fluxos server-side de reserva podem falhar.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`: usar as credenciais OAuth do Google, como no Laravel. O callback deve ser `https://www.espacoequilibramente.com.br/login/google/callback`.
   - O Supabase deve ser usado apenas como banco/Postgres. Nao habilitar nem usar OAuth/Google Provider do Supabase neste projeto.
   - `ADMIN_TEST_PAYMENT_AMOUNT`: opcional. Quando definido, apenas usuarios admin geram checkout Mercado Pago nesse valor para teste, por exemplo `1`. Clientes continuam pagando o valor real da sala.
   - `DATABASE_URL` e senha do banco ficam apenas para importacao/manutencao local; nao precisam ser expostas no front.
3. Use Node.js 20.9 ou superior.
4. Build command: `npm run build`.
5. Output: padrao do Next.js.
6. Configure os callbacks do Mercado Pago para:
   - `/pagamento/sucesso`
   - `/pagamento/erro`
   - `/pagamento/pendente`
   - `/api/mercadopago/webhook`

O banco deve ser Supabase Postgres. A carga do schema/dados pode ser refeita localmente com `node scripts/import-mysql-dump.js` depois de atualizar `DATABASE_URL` no `.env.local`.
