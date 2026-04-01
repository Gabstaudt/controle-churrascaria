# DEV-01 - Diario de Implementacao

Este arquivo documenta o que foi implementado na DEV-01 (controle-churrascaria).

## Escopo da DEV-01

- Fluxo de acesso separado entre funcionario e admin.
- Operacao de freezer focada em lancamento rapido.
- Ajustes de UX/UI para uso pratico em tablet/computador.
- Regras de estoque para retirar/repor bebidas por codigo/nome.

## Historico de Mudancas

### 1. Estrutura inicial validada

- Projeto frontend em React + Vite + TypeScript.
- API separada (`churras-api`) ainda em scaffold basico.

### 2. Credenciais padrao e login

- Garantia de usuario admin padrao (`admin` / `admin123`).
- Criacao automatica de funcionario exemplo (`funcionario` / `func123`) no storage local.
- Login admin com normalizacao de entrada (`trim`) para evitar falhas por espaco.

Arquivos impactados:
- `src/lib/store.ts`
- `src/lib/auth-context.tsx`
- `src/pages/LoginPage.tsx`

### 3. Separacao de fluxos (funcionario vs admin)

- Funcionario saiu do login administrativo e ganhou fluxo proprio.
- Rota admin definida em `/admin`.
- Rota de funcionario definida em `/funcionario`.
- Raiz `/` redireciona para `/funcionario`.
- Compatibilidade:
  - `/login` redireciona para `/admin`
  - `/freezer` redireciona para `/funcionario`

Arquivos impactados:
- `src/App.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/Index.tsx`

### 4. Area do funcionario simplificada

Fluxo operacional atual do funcionario:
- Informa codigo do funcionario.
- Informa bebida (codigo ou nome).
- Informa quantidade (padrao 1, com botoes de ajuste rapido).
- Seleciona acao: `Retirar` ou `Repor`.

Melhorias aplicadas:
- UI simplificada para lancamento rapido.
- Mensagens de erro mais diretas.
- Botao de acesso ao login admin.

Arquivo principal:
- `src/pages/EmployeePanel.tsx`

### 5. Reposicao com cadastro de novo item

- Em `Repor`, se a bebida nao existir no freezer:
  - funcionario pode cadastrar novo item informando nome da bebida.
- Se o item existir:
  - quantidade e incrementada.
  - nome pode ser atualizado quando informado.

Arquivo principal:
- `src/pages/EmployeePanel.tsx`

### 6. Busca por codigo OU nome da bebida

- Campo de bebida passou a aceitar:
  - codigo
  - nome
- Regra de resolucao:
  - tenta match exato;
  - depois parcial;
  - se houver multiplos resultados, pede refinamento.

Arquivo principal:
- `src/pages/EmployeePanel.tsx`

### 7. Feedback de retirada com contexto completo

- Ao retirar bebida, o sistema exibe mensagem contendo:
  - nome do funcionario
  - bebida retirada
  - quantidade

Arquivo principal:
- `src/pages/EmployeePanel.tsx`

### 8. Ajustes visuais (tema claro)

- Sistema migrado para tema claro.
- Tokens de cor globais ajustados.
- Melhor legibilidade e contraste para uso operacional.

Arquivo principal:
- `src/index.css`

### 9. Produto com preco e edicao no admin

- Modelo de produto atualizado para conter:
  - nome
  - categoria
  - descricao
  - preco
- Cadastro de produto no admin agora exige todos esses campos.
- Produto criado pode ser editado no painel administrativo.
- Tela de produtos ganhou:
  - botao de editar por item
  - modal de edicao com os mesmos campos do cadastro
  - validacao de preco
- Compatibilidade com dados antigos:
  - produtos sem preco salvo recebem `0` no carregamento.

Arquivos impactados:
- `src/lib/store.ts`
- `src/components/admin/ProductsModule.tsx`

### 10. Estoque unico (sem divisao por freezer)

- Fluxo de estoque migrado para lista unica de itens.
- Tela do funcionario nao usa mais numero de freezer.
- Modulo de estoque no admin agora edita um estoque unico.
- Dashboard passou a mostrar indicadores de estoque unico.
- Configuracoes removeram secao de quantidade de freezers.
- Compatibilidade mantida:
  - dados antigos por freezer sao migrados automaticamente para `churras_stock`.

Arquivos impactados:
- `src/lib/store.ts`
- `src/pages/EmployeePanel.tsx`
- `src/components/admin/StockModule.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/SettingsModule.tsx`
- `src/pages/LoginPage.tsx`

### 11. Movimentacao de estoque no admin (entrada e saida)

- Modulo de estoque admin passou a permitir:
  - entrada de itens
  - saida de itens
- Entrada/Saida funcionam por busca de codigo ou nome da bebida.
- Em entrada, quando item nao existe, e permitido cadastrar novo item (nome obrigatorio).
- Movimentacoes registram auditoria com tipo `stock`.
- Edicao manual de quantidade foi mantida no mesmo modulo.

Arquivos impactados:
- `src/components/admin/StockModule.tsx`

### 12. Estoque vinculado ao cadastro de produtos

- Estoque passa a aceitar movimentacao apenas de produtos aprovados no modulo de produtos.
- Busca de movimentacao (admin e funcionario) funciona por:
  - codigo do produto
  - nome do produto
- Se produto nao existir/aprovado, movimentacao e bloqueada com mensagem.
- Cadastro direto de item no estoque foi removido.
- Produto agora possui campo `code` para identificacao operacional.

Arquivos impactados:
- `src/lib/store.ts`
- `src/components/admin/ProductsModule.tsx`
- `src/components/admin/StockModule.tsx`
- `src/pages/EmployeePanel.tsx`

### 13. Input de busca visual no estoque (admin)

- Campo de movimentacao de estoque no admin virou busca assistida.
- Ao digitar codigo ou nome do produto:
  - lista os produtos encontrados
  - permite selecionar item na lista
  - mostra resumo do produto selecionado antes de confirmar
- Entrada e saida continuam usando apenas produtos aprovados.

Arquivo impactado:
- `src/components/admin/StockModule.tsx`

### 14. Fluxo de entrada no admin via modal + busca no funcionario

- Painel admin:
  - removida movimentacao inline de entrada/saida
  - adicionado botao `Adicionar estoque`
  - botao abre modal com:
    - input de busca
    - lista paginada de produtos existentes
    - selecao de produto
    - definicao de quantidade
  - entrada no estoque e confirmada no modal
- Painel funcionario:
  - campo `codigo ou nome` virou busca assistida
  - exibe sugestoes de produtos para selecao rapida

Arquivos impactados:
- `src/components/admin/StockModule.tsx`
- `src/pages/EmployeePanel.tsx`

### 15. Usuarios/RH com listagem principal + perfis de acesso

- Tela principal de Usuarios/RH passou a priorizar listagem de usuarios:
  - nome
  - codigo
  - tipo/perfil
  - status
- Gerenciamento de permissoes saiu da listagem principal e foi isolado no botao:
  - `Gerenciar permissoes`
- Introduzido conceito de perfis/tipos de usuario:
  - perfil Administrador
  - perfil Funcionario
  - perfis customizados
- Agora e possivel:
  - criar usuario escolhendo perfil/tipo
  - criar/editar perfis de permissao
  - atribuir perfil aos usuarios

Arquivos impactados:
- `src/lib/store.ts`
- `src/components/admin/UsersModule.tsx`

### 16. Integracao com churras-api (estoque e produtos)

- `churras-api` recebeu endpoints para:
  - produtos (`/api/products`)
  - estoque (`/api/stock`)
  - perfis (`/api/profiles`)
  - usuarios (`/api/users`)
- API configurada com:
  - CORS habilitado
  - prefixo global `/api`
- Frontend integrado para consumir API nos fluxos de:
  - estoque admin
  - estoque funcionario
  - cadastro/edicao/aprovacao/rejeicao/exclusao de produtos
- Estoque permanece vinculado a produtos aprovados vindos da API.

Arquivos impactados no frontend:
- `src/lib/api.ts`
- `src/components/admin/StockModule.tsx`
- `src/pages/EmployeePanel.tsx`
- `src/components/admin/ProductsModule.tsx`

Arquivos impactados no backend (`churras-api`):
- `src/main.ts`
- `src/app.module.ts`
- `src/domain.types.ts`
- `src/store.service.ts`
- `src/products.controller.ts`
- `src/stock.controller.ts`
- `src/profiles.controller.ts`
- `src/users.controller.ts`

### 17. Ajuste visual da tela inicial de Usuarios/RH

- Tela inicial de Usuarios/RH simplificada para lista direta.
- Mantidos dados essenciais na primeira vista:
  - nome
  - codigo
  - tipo/perfil
  - status
- Gerenciamento avancado continua dentro de `Gerenciar permissoes`.

Arquivo impactado:
- `src/components/admin/UsersModule.tsx`

### 18. Historico lateral de movimentacoes no painel do funcionario

- Integrada movimentacao do funcionario com API de estoque.
- Ao retirar/adicionar produto, a tela do funcionario agora mostra ao lado:
  - historico de produtos adicionados e retirados
  - quem movimentou (nome/codigo)
  - produto movimentado
  - quantidade movimentada
- Historico consumido de endpoint da API (`/api/stock/history`).

Arquivos impactados:
- `src/lib/api.ts`
- `src/pages/EmployeePanel.tsx`
- `src/components/admin/StockModule.tsx`

### 19. Pipeline CI/CD com GitHub Actions

- Frontend recebeu pipeline de CI para garantir qualidade em PRs e pushes:
  - instalacao de dependencias
  - lint
  - testes
  - build
  - publicacao de artefato `dist`
- Frontend recebeu pipeline de CD para deploy continuo no Netlify (branch `main`) e execucao manual (`workflow_dispatch`).
- Deploy no Netlify via GitHub Actions com:
  - `npx netlify-cli deploy --dir=dist --prod`
  - uso de secrets: `NETLIFY_AUTH_TOKEN` e `NETLIFY_SITE_ID`
- Pipeline configurado com:
  - concorrencia para evitar execucoes duplicadas
  - permissoes minimas por workflow
  - timeout por job

Arquivos impactados:
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

## Validacoes executadas

- Build de producao executada apos as mudancas principais:
  - `npm run build` com sucesso.
- Testes de projeto executados nas etapas anteriores:
  - `npm test` com sucesso.

## Estado atual da DEV-01

- Pronto para uso no fluxo funcional basico de freezer.
- Rotas oficiais:
  - `GET /funcionario` (tela inicial operacional)
  - `GET /admin` (login administrativo)

## Proximo padrao de documentacao

A partir daqui, cada nova alteracao da DEV-01 deve incluir:
- Objetivo da mudanca
- Arquivos alterados
- Regra de negocio impactada
- Validacao executada (build/test/manual)
