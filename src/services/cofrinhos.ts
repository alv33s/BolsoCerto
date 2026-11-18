// Persistência dos cofrinhos com SQLite: uma tabela para os cofrinhos e outra
// para as movimentações (quanto foi guardado ou retirado de cada um).
import { Cofrinho, Movimentacao } from '../types';
import { abrirBanco } from './banco';

type LinhaCofrinho = {
  id: number;
  nome: string;
  meta: number;
  criado_em: string;
  guardado: number;
};

type LinhaMovimentacao = {
  id: number;
  cofrinho_id: number;
  valor: number;
  data: string;
};

// Cria as tabelas na primeira vez que o serviço é usado.
const pronto = (async () => {
  const db = await abrirBanco();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cofrinhos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      meta REAL NOT NULL,
      criado_em TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cofrinho_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL
    );
  `);
  return db;
})();

function paraCofrinho(l: LinhaCofrinho): Cofrinho {
  return {
    id: l.id,
    nome: l.nome,
    meta: l.meta,
    guardado: Math.round(l.guardado * 100) / 100,
    criadoEm: l.criado_em,
  };
}

/** Lista os cofrinhos com o total guardado em cada um (JOIN + SUM agrupado). */
export async function listarCofrinhos(): Promise<Cofrinho[]> {
  const db = await pronto;
  const linhas = await db.getAllAsync<LinhaCofrinho>(`
    SELECT c.id, c.nome, c.meta, c.criado_em, COALESCE(SUM(m.valor), 0) AS guardado
      FROM cofrinhos c
      LEFT JOIN movimentacoes m ON m.cofrinho_id = c.id
     GROUP BY c.id
     ORDER BY c.criado_em DESC, c.id DESC
  `);
  return linhas.map(paraCofrinho);
}

export async function listarMovimentacoes(cofrinhoId: number): Promise<Movimentacao[]> {
  const db = await pronto;
  const linhas = await db.getAllAsync<LinhaMovimentacao>(
    'SELECT * FROM movimentacoes WHERE cofrinho_id = ? ORDER BY data DESC, id DESC',
    cofrinhoId,
  );
  return linhas.map((l) => ({ id: l.id, cofrinhoId: l.cofrinho_id, valor: l.valor, data: l.data }));
}

/** Cria o cofrinho e, se houver valor inicial, já registra a primeira movimentação. */
export async function criarCofrinho(nome: string, meta: number, valorInicial: number): Promise<number> {
  const db = await pronto;
  const agora = new Date().toISOString();
  let id = 0;
  await db.withTransactionAsync(async () => {
    const resultado = await db.runAsync(
      'INSERT INTO cofrinhos (nome, meta, criado_em) VALUES (?, ?, ?)',
      nome,
      meta,
      agora,
    );
    id = resultado.lastInsertRowId;
    if (valorInicial > 0) {
      await db.runAsync(
        'INSERT INTO movimentacoes (cofrinho_id, valor, data) VALUES (?, ?, ?)',
        id,
        valorInicial,
        agora,
      );
    }
  });
  return id;
}

export async function adicionarMovimentacao(cofrinhoId: number, valor: number): Promise<void> {
  const db = await pronto;
  await db.runAsync(
    'INSERT INTO movimentacoes (cofrinho_id, valor, data) VALUES (?, ?, ?)',
    cofrinhoId,
    valor,
    new Date().toISOString(),
  );
}

export async function removerMovimentacao(id: number): Promise<void> {
  const db = await pronto;
  await db.runAsync('DELETE FROM movimentacoes WHERE id = ?', id);
}

/** Apaga o cofrinho e todas as movimentações dele de uma vez (transação). */
export async function excluirCofrinho(id: number): Promise<void> {
  const db = await pronto;
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM movimentacoes WHERE cofrinho_id = ?', id);
    await db.runAsync('DELETE FROM cofrinhos WHERE id = ?', id);
  });
}

export async function removerTodosOsCofrinhos(): Promise<void> {
  const db = await pronto;
  await db.execAsync('DELETE FROM movimentacoes; DELETE FROM cofrinhos;');
}
