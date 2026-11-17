import { Moeda } from '../types';

const SIMBOLO: Record<Moeda, string> = { BRL: 'R$', USD: 'US$', EUR: '€' };

/** 1234.5 -> "1.234,50" */
export function formatarNumero(valor: number): string {
  const [inteiro, decimal] = Math.abs(valor).toFixed(2).split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}${comPontos},${decimal}`;
}

export function formatarMoeda(valor: number, moeda: Moeda = 'BRL'): string {
  return `${SIMBOLO[moeda]} ${formatarNumero(valor)}`;
}

/** Aceita "12,50", "12.50" e "1.234,50". Devolve NaN quando o texto não é um número. */
export function lerValor(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return NaN;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  return /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN;
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function formatarData(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${formatarData(iso)} às ${h}:${m}`;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function nomeDoMes(data: Date = new Date()): string {
  return MESES[data.getMonth()];
}

export function mesmoMes(iso: string, referencia: Date = new Date()): boolean {
  const d = new Date(iso);
  return d.getMonth() === referencia.getMonth() && d.getFullYear() === referencia.getFullYear();
}

/** Data de hoje menos `dias`, ao meio-dia (evita virar o dia por causa de fuso horário). */
export function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}
