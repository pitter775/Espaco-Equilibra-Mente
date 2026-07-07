# Deploy na Vercel

1. Crie o projeto na Vercel apontando para este repositorio.
2. Configure as variaveis de ambiente de `.env.example`.
3. Use Node.js 20.9 ou superior.
4. Build command: `npm run build`.
5. Output: padrao do Next.js.
6. Configure os callbacks do Mercado Pago para:
   - `/pagamento/sucesso`
   - `/pagamento/erro`
   - `/pagamento/pendente`
   - `/api/mercadopago/webhook`

O banco deve ser Supabase Postgres. A carga do schema/dados deve ser feita depois que o ambiente Supabase estiver pronto.
