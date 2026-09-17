# Mendonça Fit

Painel privado para acompanhar corrida e emagrecimento de várias pessoas em um único espaço compartilhado.

## Funcionalidades

- login único e sem cadastro público;
- cadastro e seleção de diferentes pessoas;
- corrida com tempo e frequência cardíaca por quilômetro;
- métricas de ritmo, distância, tempo total e frequência cardíaca;
- registro diário de peso, meta e evolução;
- histórico e gráficos separados por pessoa;
- banco, autenticação e regras de acesso no Supabase;
- layout responsivo para computador e celular.

## Stack

- Next.js/Vinext, React e TypeScript;
- Tailwind CSS e componentes Shadcn;
- Recharts;
- Supabase Auth + PostgreSQL + Row Level Security.

## Configuração

1. Crie um projeto no Supabase.
2. Execute o SQL de `supabase/migrations/20260917103000_initial_schema.sql` no SQL Editor.
3. Em Authentication, mantenha o cadastro público desativado e crie manualmente o usuário compartilhado.
4. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública (`anon`/`publishable`) do projeto.
5. Instale e execute:

```bash
npm install
npm run dev
```

## Segurança

As tabelas usam Row Level Security. Visitantes anônimos não têm acesso; usuários autenticados compartilham a visualização e o cadastro de todos os membros, conforme o objetivo deste projeto. A service role key nunca deve ser incluída no frontend.
