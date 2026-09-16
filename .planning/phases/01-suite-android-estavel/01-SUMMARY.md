# Fase 01 — Resumo

**Concluída:** 2026-09-03. **Validação:** teste ponta a ponta no AVD-S24; no CI, `CI Run #6`
18/18 no pool de 6 Samsung (referência Android até o Run #14).

## O que mudou

- `BasePage.fechaBanner()`: ciclo presença (`insiderLayout`) → clique (`Close`) → confirmação,
  3 tentativas, sem coordenada.
- `test/specs/test.spec.ts`: `step()` chama `closeBannerIfPresent()` antes de cada passo.
- `CategoriasPage.favoritarPrimeiroProduto()`: retorna o nome do produto lido em runtime.
- `CategoriasPage.voltar()` + spec: um único `voltar()` da listagem até Categorias.
- `HomePage.abrirPerfil()`: `SELETORES_PERFIL = [Menu, Perfil]`.

## Descobertas que viraram regra (`STATE.md` → "Android (M1)")

- O `closeBt` nativo é decorativo; `back()` não fecha o banner; só o `Close` dentro da WebView.
- `insiderLayout` é o marcador de presença, nunca o `htmlView`.
- A listagem de produtos não tem tab bar → `voltar()` antes de `abrirPerfil()` é obrigatório.
- O estado favoritado não está na árvore — a asserção tem que ser na tela de Favoritos.

## Registro detalhado

`plans/2026-09-03-banner-insider-e-favoritar-listagem.md`.
