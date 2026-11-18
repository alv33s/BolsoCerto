# BolsoCerto

Aplicativo de controle de gastos pessoais com conversão automática de moedas, feito em React Native (Expo) como trabalho final da disciplina de Programação de Aplicativos.

O usuário define um orçamento mensal, registra cada gasto em real, dólar ou euro e o app converte para reais com a cotação do dia, avisa quando o orçamento está perto de estourar e lembra de registrar os gastos. Também permite separar dinheiro em cofrinhos, um para cada objetivo, e simula quanto a sobra do orçamento renderia na poupança, no Tesouro Selic e em um CDB, com a taxa Selic do Banco Central.

## Integrantes

| Nome completo | Matrícula | O que fez |
|---|---|---|
| _Felipe Alves Muniz_ | _Uc23101331_ | _Back-end_ |
| _Enzo Freitas_ | _UC23102171_ | _Front-end_ |


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
| **Simular investimento** | Pilha | Compara poupança, Tesouro Selic e CDB com a Selic atual, por valor, aporte e prazo |
| **Cofrinhos** | Aba | Vê todos os cofrinhos, quanto já guardou em cada um e o total |
| **Novo cofrinho** | Modal | Cria um cofrinho com nome, meta e um valor inicial opcional |
| **Cofrinho** | Pilha | Guarda ou retira dinheiro, vê o histórico, apaga movimentações e exclui o cofrinho |

São 10 telas interativas (o mínimo pedido é 4).

## Requisitos do trabalho

| Exigência | Como o app atende | Onde está |
|---|---|---|
| Notificação | Alerta ao cruzar 80% e 100% do orçamento, aviso quando um cofrinho atinge a meta, lembrete diário agendado, navegação ao tocar na notificação; `Alert` para confirmações | `src/services/notificacoes.ts`, `src/context/AppContext.tsx`, `src/screens/Metas.tsx` |
| Requisição de Web Service | `fetch` (GET) em APIs de cotação (com reservas) e na API do Banco Central (Selic), com carregando, erro, tentar de novo e tempo limite | `src/services/http.ts`, `cambio.ts`, `indicadores.ts`, `src/components/CartaoCotacao.tsx`, `src/screens/Simulador.tsx` |
| Persistência de dados | **SQLite** para os gastos e os cofrinhos (com `JOIN`, `SUM` e transações), **AsyncStorage** para preferências, última cotação e última Selic, **SecureStore** para nome e PIN | `src/services/banco.ts`, `cofrinhos.ts`, `preferencias.ts`, `sessao.ts` |
| Mínimo de 4 telas interativas | 6 telas | `src/screens/` |
| Finalidade além de ver informações | O usuário cadastra, edita, exclui, converte e controla um orçamento | todo o app |
| Não ser app de filmes ou livros | Controle financeiro | — |
| GitHub + Git Flow | `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` e tags | [docs/GIT_FLOW.md](docs/GIT_FLOW.md) |

## Tópicos vistos em sala

| Aula | Tópico | Onde aparece |
|---|---|---|
| 01 | JavaScript e POO (classe, getters, métodos estáticos) | `src/models/Orcamento.ts`, `src/models/Simulador.ts` |
| 02 | `View`, `Text`, `StyleSheet`, Flexbox | todas as telas e componentes |
| 03 | Componentização e props tipadas | `src/components/` |
| 03 | `Pressable`, `TextInput`, `Switch`, `Slider`, renderização condicional e listas | `Botao.tsx`, `CampoTexto.tsx`, `Metas.tsx`, `Gastos.tsx` (`FlatList`), `Resumo.tsx` (`map`) |
| 04 | `useState`, `useEffect`, `useRef`, `useContext`, `useMemo`, `useCallback`, `useReducer` | `src/context/AppContext.tsx` e telas |
| 05 | Navegação em pilha, abas e modal | `src/navigation/Rotas.tsx` |
| 06 | Versionamento e Git Flow | [docs/GIT_FLOW.md](docs/GIT_FLOW.md) |
| 07 | Ciclo de vida (montagem, limpeza, foco da tela, `AppState`) e notificações | `AppContext.tsx`, `Resumo.tsx`, `Rotas.tsx`, `notificacoes.ts` |
| 08 | Programação assíncrona (`async/await`, `Promise`, `try/catch`) e web services | `src/services/http.ts`, `cambio.ts`, `indicadores.ts` |
| 09 | AsyncStorage, SecureStore e SQLite | `src/services/` |

## Estrutura de pastas

```
bolsocerto/
├── App.tsx                  # raiz: provedores e navegação
├── index.ts                 # ponto de entrada (registra o App)
├── app.json                 # configuração do Expo
└── src/
    ├── components/          # peças reutilizáveis (botão, campo, item da lista...)
    ├── context/             # estado global (useReducer + useContext) e estado dos cofrinhos
    ├── models/              # classes Orcamento e Simulador (regras de negócio)
    ├── navigation/          # pilha, abas e modal
    ├── screens/             # as telas
    ├── services/            # banco e cofrinhos (SQLite), preferências, sessão, câmbio, Selic, notificações
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

## Cofrinhos

Cada cofrinho tem um nome e uma meta. O usuário guarda ou retira dinheiro, e o app soma as movimentações para mostrar quanto já foi juntado. O dinheiro não sai da conta de verdade: o cofrinho só registra quanto foi separado para cada objetivo.

- **Tabelas no SQLite:** `cofrinhos` (nome, meta, data de criação) e `movimentacoes` (valor positivo para depósito, negativo para retirada). O total de cada cofrinho vem de uma consulta com `LEFT JOIN` e `SUM` agrupado por cofrinho (`src/services/cofrinhos.ts`).
- **Transações:** criar um cofrinho com valor inicial e excluir um cofrinho com o histórico são feitos de uma vez, ou tudo ou nada.
- **Estado:** `src/context/CofrinhosContext.tsx` guarda a lista e é usado pelas três telas.
- **Notificação:** ao guardar o valor que faz o cofrinho chegar na meta, o app avisa "Meta atingida!".
- **Regras:** não dá para retirar mais do que está guardado; segurar o dedo numa movimentação permite apagá-la.

## Simulador de investimento

Usa a meta da Selic definida pelo Copom, da API pública do Banco Central (série 432 do SGS, gratuita e sem chave):

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json
```

As regras ficam na classe `Simulador` (`src/models/Simulador.ts`):

- **Poupança:** 0,5% ao mês quando a Selic passa de 8,5% ao ano; senão, 70% da Selic. Isenta de IR.
- **Tesouro Selic:** rende a Selic.
- **CDB:** rende 100%, 110% ou 120% do CDI, considerado 0,10 ponto abaixo da Selic.
- **Imposto de Renda:** tabela regressiva (22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima), aplicada ao valor inicial e a cada aporte pelo tempo que cada um ficou aplicado.

É uma simulação educativa e aproximada: mantém a Selic de hoje fixa durante todo o prazo e não inclui a TR da poupança nem taxas de custódia.

## Limitações conhecidas

- O PIN protege a abertura do app, mas os gastos no SQLite não são criptografados.
- A data do gasto pode ser hoje, ontem ou anteontem.
- Os dados ficam só no aparelho: não há backup nem sincronização entre dispositivos.
