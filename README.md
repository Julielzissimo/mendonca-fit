# Mendonça Fit

Painel privado para acompanhar corrida e emagrecimento, com dados isolados por login.

## Site publicado

<https://julielzissimo.github.io/mendonca-fit/>

O workflow `.github/workflows/deploy-pages.yml` recompila e publica automaticamente o frontend no GitHub Pages a cada atualização da branch `main`.

## Funcionalidades

- login sem cadastro público;
- cadastro e seleção de perfis pertencentes ao usuário autenticado;
- corrida com tempo por quilômetro;
- métricas de ritmo, distância e tempo total;
- registro diário de peso, meta e evolução;
- histórico e gráficos separados por pessoa;
- banco e autenticação no Appwrite;
- layout responsivo para computador e celular.

## Stack

- Next.js/Vinext, React e TypeScript;
- Tailwind CSS e componentes Shadcn;
- Recharts;
- Appwrite Auth + TablesDB.

## Appwrite

O projeto usa os recursos públicos de configuração definidos em `lib/appwrite.ts`:

- projeto: `6aabf0f3003c88993bba`;
- banco TablesDB: `6aabf1350013c770ea82`;
- tabelas: `athletes`, `runs`, `run_splits` e `weight_entries`;
- endpoint: `https://fra.cloud.appwrite.io/v1`.

Os domínios `localhost`, `mendonca-fit.juliel-mendonca.chatgpt.site` e `julielzissimo.github.io` estão registrados como aplicativos Web. As tabelas permitem que pessoas autenticadas criem linhas, mas leitura, alteração e exclusão ficam restritas ao proprietário de cada linha. Todas as consultas também exigem que `created_by` corresponda ao login atual.

## Acesso

O formulário público permite somente entrar. Crie manualmente um usuário para cada pessoa em **Appwrite Console → Auth → Users**; cada login acessa apenas seus próprios perfis e lançamentos.

## Desenvolvimento

```bash
npm install
npm run dev
```

As variáveis de `.env.example` são opcionais e servem para apontar uma cópia do projeto para outros recursos do Appwrite. Nenhuma chave secreta é usada no navegador.
