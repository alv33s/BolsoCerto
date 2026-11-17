export type NivelOrcamento = 'ok' | 'atencao' | 'estourado';

/**
 * Classe (POO) que concentra as regras do orçamento mensal:
 * quanto já foi usado, quanto sobra e em que nível de alerta está.
 */
export class Orcamento {
  static readonly LIMITE_ATENCAO = 0.8;
  static readonly LIMITE_ESTOURO = 1;

  constructor(
    private readonly limite: number,
    private readonly gasto: number,
  ) {}

  /** Fração usada do orçamento (0.5 = 50%). Sem limite definido, devolve 0. */
  get usado(): number {
    return this.limite > 0 ? this.gasto / this.limite : 0;
  }

  get percentual(): number {
    return Math.round(this.usado * 100);
  }

  get saldo(): number {
    return this.limite - this.gasto;
  }

  get nivel(): NivelOrcamento {
    if (this.usado >= Orcamento.LIMITE_ESTOURO) return 'estourado';
    if (this.usado >= Orcamento.LIMITE_ATENCAO) return 'atencao';
    return 'ok';
  }

  /**
   * Compara com o orçamento de antes de um novo gasto e diz se um limite
   * acabou de ser cruzado. É isso que decide se a notificação é enviada.
   */
  cruzouLimiteDesde(anterior: Orcamento): NivelOrcamento | null {
    if (this.nivel === anterior.nivel || this.nivel === 'ok') return null;
    if (anterior.nivel === 'estourado') return null;
    return this.nivel;
  }
}
