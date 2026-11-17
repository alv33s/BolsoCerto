// Função de requisição compartilhada pelos serviços que consultam web services.

const TEMPO_LIMITE_PADRAO_MS = 8000;

/**
 * Faz um GET, espera no máximo `tempoLimiteMs` e devolve o JSON da resposta.
 * Lança erro com uma mensagem legível quando o servidor falha ou demora.
 */
export async function buscarJson(
  url: string,
  tempoLimiteMs: number = TEMPO_LIMITE_PADRAO_MS,
): Promise<unknown> {
  // Cancela a requisição se o servidor demorar demais.
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), tempoLimiteMs);

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controle.signal,
    });

    // Erros do servidor (ex.: 404, 429 = limite de requisições, 500).
    if (!resposta.ok) {
      throw new Error(`O serviço respondeu com erro ${resposta.status}.`);
    }

    return await resposta.json();
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new Error('O serviço demorou demais para responder.');
    }
    throw erro;
  } finally {
    clearTimeout(temporizador);
  }
}
