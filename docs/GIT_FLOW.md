# Git Flow do BolsoCerto

Este é o fluxo que o grupo segue para organizar o repositório.

## Branches

| Branch | Para que serve | Sai de | Volta para |
|---|---|---|---|
| `main` | Código entregue. Cada commit aqui é uma versão com tag (`v1.0.0`, `v1.0.1`...) | — | — |
| `develop` | Código em desenvolvimento, já integrado e funcionando | `main` | — |
| `feature/nome` | Uma funcionalidade nova | `develop` | `develop` |
| `release/x.y.z` | Preparação de uma versão (ajustes finais, número da versão, changelog) | `develop` | `main` e `develop` |
| `hotfix/x.y.z` | Correção urgente de algo que já está na `main` | `main` | `main` e `develop` |

Ninguém faz commit direto na `main` nem na `develop`: tudo entra por merge de outra branch.

```
main     ●───────────────────────────●  v1.0.0 ───●  v1.0.1
          \                         /  \         /  \
release    \                 ●─────●    \       /    \
            \               /       \    \     /      \
hotfix       \             /         \    ●───●        \
              \           /           \        \        \
develop        ●───●─────●─────────────●────────●────────●
                \   \   /
feature          ●───●─●
```

## Passo a passo

### 1. Começar uma funcionalidade

```bash
git checkout develop
git pull
git checkout -b feature/nome-da-funcionalidade
```

### 2. Trabalhar e salvar

```bash
git add .
git commit -m "feat: descreve o que foi feito"
git push -u origin feature/nome-da-funcionalidade
```

### 3. Integrar na develop

Abra um Pull Request no GitHub de `feature/nome-da-funcionalidade` para `develop`. Outro integrante revisa e faz o merge. Pelo terminal, o equivalente é:

```bash
git checkout develop
git pull
git merge --no-ff feature/nome-da-funcionalidade
git push
git branch -d feature/nome-da-funcionalidade
```

O `--no-ff` cria um commit de merge, que deixa visível no histórico onde cada funcionalidade entrou.

### 4. Fechar uma versão

```bash
git checkout develop
git pull
git checkout -b release/1.1.0
# ajustes finais: versão no app.json e no package.json, CHANGELOG.md
git commit -am "chore(release): versão 1.1.0"

git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Versão 1.1.0"

git checkout develop
git merge --no-ff release/1.1.0

git push origin main develop --tags
git branch -d release/1.1.0
```

### 5. Corrigir um erro que já está na main

```bash
git checkout main
git pull
git checkout -b hotfix/1.1.1
# corrige, sobe a versão e anota no CHANGELOG.md
git commit -am "fix: descreve a correção"

git checkout main
git merge --no-ff hotfix/1.1.1
git tag -a v1.1.1 -m "Versão 1.1.1"

git checkout develop
git merge --no-ff hotfix/1.1.1

git push origin main develop --tags
git branch -d hotfix/1.1.1
```

## Mensagens de commit

Formato: `tipo: o que mudou`, no presente e em português.

| Tipo | Quando usar | Exemplo |
|---|---|---|
| `feat` | Funcionalidade nova | `feat: adiciona filtro por categoria na lista de gastos` |
| `fix` | Correção de erro | `fix: mantém a cotação quando o aparelho não consegue gravar` |
| `docs` | Documentação | `docs: explica como rodar o projeto` |
| `style` | Aparência, sem mudar o comportamento | `style: aumenta o espaçamento do cartão de orçamento` |
| `refactor` | Reorganização do código, sem mudar o comportamento | `refactor: separa o formulário do detalhe do gasto` |
| `chore` | Configuração, dependências, versão | `chore: instala as dependências de navegação` |

## Versões

`MAIOR.MENOR.CORREÇÃO` (ex.: `1.2.3`):

- **CORREÇÃO** sobe a cada hotfix (`1.0.0` → `1.0.1`);
- **MENOR** sobe a cada release com funcionalidades novas (`1.0.1` → `1.1.0`);
- **MAIOR** sobe quando algo deixa de ser compatível com a versão anterior.

## Histórico até a versão 1.0.1

| Branch | O que entrou |
|---|---|
| `feature/estrutura-base` | Dependências, configuração do Expo, tipos, tema e funções de formatação |
| `feature/componentes` | Botão, campo de texto, seletor de opções, barra de progresso, botão flutuante |
| `feature/persistencia` | AsyncStorage (preferências), SecureStore (sessão) e SQLite (gastos) |
| `feature/web-service-cotacao` | Requisição à API de cotações e cartão que mostra o resultado |
| `feature/notificacoes` | Permissão, alerta imediato, lembrete diário e toque na notificação |
| `feature/orcamento-e-contexto` | Classe `Orcamento`, estado global e cartões que dependem dele |
| `feature/telas` | Login, Resumo, Gastos, Novo gasto, Detalhe do gasto e Metas |
| `feature/navegacao` | Pilha, abas e modal ligados no `App.tsx` |
| `feature/documentacao` | README, este guia e o modelo de Pull Request |
| `release/1.0.0` | Changelog e fechamento da versão → tag `v1.0.0` |
| `hotfix/1.0.1` | Correção na busca de cotação → tag `v1.0.1` |

Para ver o desenho do histórico:

```bash
git log --graph --oneline --all --decorate
```

## Sugestão de divisão para as próximas funcionalidades

| Integrante | Branch |
|---|---|
| 1 | `feature/escolher-data-do-gasto` |
| 2 | `feature/grafico-por-categoria` |
| 3 | `feature/exportar-gastos` |
| 4 | `feature/tema-escuro` |
