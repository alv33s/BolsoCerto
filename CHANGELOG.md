# Changelog

Todas as mudanças de cada versão do BolsoCerto.

## 1.0.3

- A cotação passa a ter três fontes, tentadas em ordem: AwesomeAPI, ExchangeRate-API e Frankfurter. Corrige a falha quando a AwesomeAPI responde 429 (limite de requisições).
- Quando a permissão de notificação é negada, o alerta oferece abrir os ajustes do aparelho.
- Atualiza expo para 58.0.26 e expo-sqlite para 58.0.18.

## 1.0.2

- Corrige o erro de notificação no Expo Go para Android: quando o aparelho recusa o canal de notificação próprio, o app passa a usar o canal padrão em vez de gerar erro.
- A cotação passa a ter uma API de reserva (Frankfurter), usada quando a AwesomeAPI não responde.

## 1.0.1

- Corrige a busca de cotação: se o aparelho não conseguir gravar a cotação nova, o app agora continua usando o valor que acabou de vir da API, em vez de voltar para a cotação antiga.

## 1.0.0

Primeira versão entregue.

- Acesso protegido por nome e PIN (SecureStore).
- Registro, edição e exclusão de gastos em real, dólar e euro (SQLite).
- Conversão para reais com a cotação da AwesomeAPI, com uso offline da última cotação salva.
- Orçamento mensal com barra de progresso.
- Notificações ao cruzar 80% e 100% do orçamento e lembrete diário.
- Busca e filtro por categoria na lista de gastos.
- Navegação em abas, pilha e modal.
