# BolsoCerto

Aplicativo de controle de gastos pessoais com conversão automática de moedas, feito em React Native (Expo) como trabalho final da disciplina de Programação de Aplicativos.

O usuário define um orçamento mensal, registra cada gasto em real, dólar ou euro e o app converte para reais com a cotação do dia, avisa quando o orçamento está perto de estourar e lembra de registrar os gastos.

## Integrantes

| Nome completo | Matrícula | O que fez |
|---|---|---|
| _preencher_ | _preencher_ | _preencher_ |
| _preencher_ | _preencher_ | _preencher_ |
| _preencher_ | _preencher_ | _preencher_ |
| _preencher_ | _preencher_ | _preencher_ |

## Como rodar

Requisitos: Node.js 20 ou mais novo e o aplicativo **Expo Go** no celular (ou um emulador).

```bash
git clone <endereço do repositório>
cd bolsocerto
npm install
npx expo start
```

Leia o QR Code com o Expo Go (Android) ou com a câmera (iOS). O celular e o computador precisam estar na mesma rede Wi-Fi.

Teste as notificações em um **celular de verdade**: emuladores e simuladores nem sempre as exibem. No Expo Go para Android aparecem dois avisos (`WARN`) sobre notificações remotas (push) e sobre o Expo Go; eles podem ser ignorados, porque o app usa apenas notificações locais. O aviso `[notificações] Canal próprio indisponível` também é esperado no Expo Go: o app usa o canal padrão.

**Se a notificação não aparecer no Expo Go (Android 13 ou mais novo):** o Expo Go não deixa o app criar o canal de notificação, e sem ele o Android pode não mostrar o pedido de permissão. Libere manualmente: **Configurações do celular → Apps → Expo Go → Notificações → Permitir**. O alerta do app tem um botão **Abrir ajustes** que leva até lá. Depois volte ao app e toque em **Enviar notificação de teste** na aba Metas.

Outros comandos:

```bash
npm run typecheck   # confere os tipos do TypeScript
```

## Telas

| Tela | Navegação | O que o usuário faz |
|---|---|---|
| **Login** | Pilha | Cria o acesso (nome + PIN) no primeiro uso; depois, desbloqueia com o PIN |
| **Resumo** | Aba | Vê o total do mês, a barra do orçamento, a cotação do dólar e do euro e os últimos gastos |
| **Gastos** | Aba | Busca por texto, filtra por categoria e abre um gasto |
| **Metas** | Aba | Define o orçamento (slider ou digitando), liga alertas e lembrete diário, bloqueia o app |
| **Novo gasto** | Modal | Registra um gasto; em dólar ou euro, mostra a conversão antes de salvar |
| **Detalhe do gasto** | Pilha | Edita descrição, valor e categoria, ou exclui o gasto |

São 6 telas interativas (o mínimo pedido é 4).

## Requisitos do trabalho

| Exigência | Como o app atende | Onde está |
|---|---|---|
| Notificação | Alerta ao cruzar 80% e 100% do orçamento, lembrete diário agendado, navegação ao tocar na notificação; `Alert` para confirmações | `src/services/notificacoes.ts`, `src/context/AppContext.tsx`, `src/screens/Metas.tsx` |
| Requisição de Web Service | `fetch` (GET) na AwesomeAPI de cotações, com API de reserva, carregando, erro, tentar de novo e tempo limite | `src/services/cambio.ts`, `src/components/CartaoCotacao.tsx` |
| Persistência de dados | **SQLite** para os gastos, **AsyncStorage** para preferências e última cotação, **SecureStore** para nome e PIN | `src/services/banco.ts`, `preferencias.ts`, `sessao.ts` |
| Mínimo de 4 telas interativas | 6 telas | `src/screens/` |
| Finalidade além de ver informações | O usuário cadastra, edita, exclui, converte e controla um orçamento | todo o app |
| Não ser app de filmes ou livros | Controle financeiro | — |
| GitHub + Git Flow | `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` e tags | [docs/GIT_FLOW.md](docs/GIT_FLOW.md) |

## Tópicos vistos em sala

| Aula | Tópico | Onde aparece |
|---|---|---|
| 01 | JavaScript e POO (classe, getters, método estático) | `src/models/Orcamento.ts` |
| 02 | `View`, `Text`, `StyleSheet`, Flexbox | todas as telas e componentes |
| 03 | Componentização e props tipadas | `src/components/` |
| 03 | `Pressable`, `TextInput`, `Switch`, `Slider`, renderização condicional e listas | `Botao.tsx`, `CampoTexto.tsx`, `Metas.tsx`, `Gastos.tsx` (`FlatList`), `Resumo.tsx` (`map`) |
| 04 | `useState`, `useEffect`, `useRef`, `useContext`, `useMemo`, `useCallback`, `useReducer` | `src/context/AppContext.tsx` e telas |
| 05 | Navegação em pilha, abas e modal | `src/navigation/Rotas.tsx` |
| 06 | Versionamento e Git Flow | [docs/GIT_FLOW.md](docs/GIT_FLOW.md) |
| 07 | Ciclo de vida (montagem, limpeza, foco da tela, `AppState`) e notificações | `AppContext.tsx`, `Resumo.tsx`, `Rotas.tsx`, `notificacoes.ts` |
| 08 | Programação assíncrona (`async/await`, `Promise`, `try/catch`) e web services | `src/services/cambio.ts` |
| 09 | AsyncStorage, SecureStore e SQLite | `src/services/` |

## Estrutura de pastas

```
bolsocerto/
├── App.tsx                  # raiz: provedores e navegação
├── index.ts                 # ponto de entrada (registra o App)
├── app.json                 # configuração do Expo
└── src/
    ├── components/          # peças reutilizáveis (botão, campo, item da lista...)
    ├── context/             # estado global (useReducer + useContext)
    ├── models/              # classe Orcamento (regras do orçamento)
    ├── navigation/          # pilha, abas e modal
    ├── screens/             # as 6 telas
    ├── services/            # banco (SQLite), preferências, sessão, câmbio, notificações
    ├── theme/               # cores e espaçamentos
    ├── types/               # tipos e rotas
    └── utils/               # formatação de moeda e data
```

## Como os dados circulam

1. Ao abrir, o `AppProvider` lê a sessão (SecureStore), os gastos (SQLite) e as preferências (AsyncStorage) e busca a cotação na API.
2. As telas leem tudo pelo hook `useApp()` e pedem mudanças pelas ações (`adicionarGasto`, `editarGasto`, `alterarPreferencias`...).
3. Cada ação grava no aparelho e atualiza o estado; as telas se redesenham sozinhas.
4. Ao salvar um gasto em dólar ou euro, o valor em reais é gravado com a cotação daquele momento, então o histórico não muda quando a cotação variar.
5. Sem internet, o app usa a última cotação salva e avisa o usuário. Gastos em reais funcionam sempre.

## Web services usados

O app tenta as fontes abaixo, nesta ordem, até uma responder. Todas são gratuitas e sem chave.

| Ordem | Fonte | Endereço |
|---|---|---|
| 1 | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas) | `https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL` |
| 2 | [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) | `https://open.er-api.com/v6/latest/BRL` |
| 3 | [Frankfurter](https://frankfurter.dev) | `https://api.frankfurter.dev/v1/latest?base=BRL&symbols=USD,EUR` |

Se nenhuma responder, o app usa a última cotação salva no aparelho. O terminal mostra qual fonte respondeu (`[cotação] Cotação obtida na ...`). A AwesomeAPI costuma responder **429** (limite de requisições) quando usada sem chave; nesse caso a próxima fonte assume.

## Limitações conhecidas

- O PIN protege a abertura do app, mas os gastos no SQLite não são criptografados.
- A data do gasto pode ser hoje, ontem ou anteontem.
- Os dados ficam só no aparelho: não há backup nem sincronização entre dispositivos.
