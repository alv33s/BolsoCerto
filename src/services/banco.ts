// Persistência estruturada com SQLite: os gastos ficam em uma tabela
// e são consultados, inseridos, atualizados e apagados com SQL.
import * as SQLite from 'expo-sqlite';
import { Categoria, Gasto, Moeda } from '../types';

/** Formato da linha como ela sai do banco (nomes de coluna em snake_case). */
type Linha = {
  id: number;
  descricao: string;
  valor_original: number;
  moeda: string;
  cotacao: number;
  valor_reais: number;
  categoria: string;
  data: string;
};

const dbPromise = (async () => {
  const db = await SQLite.openDatabaseAsync('bolsocerto.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor_original REAL NOT NULL,
      moeda TEXT NOT NULL,
      cotacao REAL NOT NULL,
      valor_reais REAL NOT NULL,
      categoria TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `);
  return db;
})();

/** Conexão com o banco, compartilhada com outros serviços (ex.: cofrinhos). */
export function abrirBanco(): Promise<SQLite.SQLiteDatabase> {
  return dbPromise;
}

function paraGasto(l: Linha): Gasto {
  return {
    id: l.id,
    descricao: l.descricao,
    valorOriginal: l.valor_original,
    moeda: l.moeda as Moeda,
    cotacao: l.cotacao,
    valorReais: l.valor_reais,
    categoria: l.categoria as Categoria,
    data: l.data,
  };
}

export async function listarGastos(): Promise<Gasto[]> {
  const db = await dbPromise;
  const linhas = await db.getAllAsync<Linha>('SELECT * FROM gastos ORDER BY data DESC, id DESC');
  return linhas.map(paraGasto);
}

export async function inserirGasto(gasto: Omit<Gasto, 'id'>): Promise<Gasto> {
  const db = await dbPromise;
  const resultado = await db.runAsync(
    `INSERT INTO gastos (descricao, valor_original, moeda, cotacao, valor_reais, categoria, data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    gasto.descricao,
    gasto.valorOriginal,
    gasto.moeda,
    gasto.cotacao,
    gasto.valorReais,
    gasto.categoria,
    gasto.data,
  );
  return { ...gasto, id: resultado.lastInsertRowId };
}

export async function atualizarGasto(gasto: Gasto): Promise<void> {
  const db = await dbPromise;
  await db.runAsync(
    `UPDATE gastos
        SET descricao = ?, valor_original = ?, valor_reais = ?, categoria = ?
      WHERE id = ?`,
    gasto.descricao,
    gasto.valorOriginal,
    gasto.valorReais,
    gasto.categoria,
    gasto.id,
  );
}

export async function removerGasto(id: number): Promise<void> {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM gastos WHERE id = ?', id);
}

export async function removerTodosOsGastos(): Promise<void> {
  const db = await dbPromise;
  await db.execAsync('DELETE FROM gastos;');
}
