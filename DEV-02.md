# DEV-02 - Etiquetas por Saida e Checkout por Barcode (Frontend)

Este documento registra a entrega da DEV-02 no `controle-churrascaria`.

## Objetivo

Implementar o fluxo de etiqueta por retirada de produto e leitura no caixa, com barcode unico por saida.

## Escopo implementado

### 1. Retirada com saidas unicas

- Ao retirar produto no painel do funcionario, o frontend consome o retorno da API com saidas unitarias.
- Cada saida possui:
  - `id` unico
  - `barcode` unico
  - nome do produto
  - preco do produto

### 2. Etiqueta para comanda

- Apos a retirada, abre modal de etiquetas para impressao.
- Cada etiqueta mostra:
  - nome do produto
  - preco
  - codigo de barras
- O barcode e renderizado em `CODE128`.

### 3. Impressao

- Implementado fluxo de impressao via `window.print`.
- Layout simplificado para uso futuro em impressora termica.

### 4. Caixa com leitura de barcode

- Novo fluxo no modulo de caixa:
  - leitura do barcode via input/scanner
  - busca da saida na API
  - soma automatica dos itens
  - finalizacao do pagamento
- Ao finalizar, as saidas sao marcadas como pagas na API.

### 5. Integracao API frontend

- `src/lib/api.ts` recebeu metodos para:
  - buscar etiqueta por barcode
  - listar pendencias
  - finalizar checkout por barcodes

## Arquivos alterados

- `src/pages/EmployeePanel.tsx`
- `src/components/admin/CashModule.tsx`
- `src/components/BarcodeLabel.tsx`
- `src/lib/api.ts`
- `package.json`

## Dependencias

- `jsbarcode`

## Validacao

- `npm run build` executado com sucesso.
