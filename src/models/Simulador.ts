// Classe (POO) com as regras da simulação de investimentos de renda fixa.
// É uma simulação educativa e aproximada: ignora a TR da poupança, taxas de
// custódia e variações futuras da Selic.

export type TipoInvestimento = 'poupanca' | 'tesouroSelic' | 'cdb';

export type EntradaSimulacao = {
  /** Valor aplicado hoje, em reais. */
  valorInicial: number;
  /** Valor aplicado todo mês (o primeiro também hoje), em reais. */
  aporteMensal: number;
  /** Por quantos meses o dinheiro fica aplicado. */
  meses: number;
  /** Selic em % ao ano (ex.: 14.25). */
  selicAnual: number;
  /** Quanto o CDB paga do CDI, em % (ex.: 110). */
  percentualCdi: number;
};

export type ResultadoSimulacao = {
  tipo: TipoInvestimento;
  nome: string;
  /** Rendimento ao ano usado no cálculo, em %. */
  taxaAnual: number;
  totalInvestido: number;
  rendimentoBruto: number;
  impostoRenda: number;
  valorFinal: number;
  rendimentoLiquido: number;
  isentoDeIR: boolean;
};

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export class Simulador {
  /** Acima desta Selic, a poupança rende 0,5% ao mês. */
  static readonly SELIC_LIMITE_POUPANCA = 8.5;
  /** O CDI costuma ficar cerca de 0,10 ponto abaixo da meta da Selic. */
  static readonly DIFERENCA_CDI = 0.1;
  static readonly DIAS_POR_MES = 30;
  static readonly MESES_MAXIMO = 600;

  constructor(private readonly entrada: EntradaSimulacao) {}

  /** Alíquota do Imposto de Renda em renda fixa, pela tabela regressiva (por dias aplicados). */
  static aliquotaIR(dias: number): number {
    if (dias <= 180) return 0.225;
    if (dias <= 360) return 0.2;
    if (dias <= 720) return 0.175;
    return 0.15;
  }

  /** Converte uma taxa em % ao ano para a taxa equivalente ao mês (fração). */
  static taxaMensal(percentualAnual: number): number {
    return Math.pow(1 + percentualAnual / 100, 1 / 12) - 1;
  }

  /** Converte uma taxa ao mês (fração) para % ao ano. */
  static taxaAnual(taxaMensal: number): number {
    return (Math.pow(1 + taxaMensal, 12) - 1) * 100;
  }

  /** Diz se os dados permitem simular; devolve a mensagem de erro ou null. */
  get erro(): string | null {
    const { valorInicial, aporteMensal, meses, selicAnual, percentualCdi } = this.entrada;
    if (!(selicAnual > 0) || selicAnual > 100) return 'Informe a Selic para simular, como 14,25.';
    const numeros = [valorInicial, aporteMensal, meses, percentualCdi];
    if (numeros.some((n) => !Number.isFinite(n) || n < 0)) return 'Digite os valores em reais, como 150,00.';
    if (valorInicial + aporteMensal <= 0) return 'Informe um valor inicial ou um aporte mensal.';
    if (meses < 1 || meses > Simulador.MESES_MAXIMO) return 'O prazo precisa ser de 1 a 600 meses.';
    return null;
  }

  get cdiAnual(): number {
    return Math.max(this.entrada.selicAnual - Simulador.DIFERENCA_CDI, 0);
  }

  get taxaMensalPoupanca(): number {
    // Regra da poupança: 0,5% ao mês, ou 70% da Selic quando ela está em 8,5% ao ano ou menos.
    return this.entrada.selicAnual > Simulador.SELIC_LIMITE_POUPANCA
      ? 0.005
      : Simulador.taxaMensal(this.entrada.selicAnual * 0.7);
  }

  /**
   * Simula um investimento. O valor inicial e cada aporte rendem pelo tempo que
   * ficam aplicados, e o IR de cada um segue o prazo dele.
   */
  simular(tipo: TipoInvestimento): ResultadoSimulacao {
    const { valorInicial, aporteMensal, meses, percentualCdi } = this.entrada;

    let nome: string;
    let taxaMes: number;
    let isento = false;
    if (tipo === 'poupanca') {
      nome = 'Poupança';
      taxaMes = this.taxaMensalPoupanca;
      isento = true;
    } else if (tipo === 'tesouroSelic') {
      nome = 'Tesouro Selic';
      taxaMes = Simulador.taxaMensal(this.entrada.selicAnual);
    } else {
      nome = `CDB ${percentualCdi}% do CDI`;
      taxaMes = Simulador.taxaMensal((this.cdiAnual * percentualCdi) / 100);
    }

    let totalInvestido = 0;
    let rendimentoBruto = 0;
    let impostoRenda = 0;

    // Mês 0 = hoje: entra o valor inicial e o primeiro aporte.
    for (let mes = 0; mes < meses; mes++) {
      const aplicado = (mes === 0 ? valorInicial : 0) + aporteMensal;
      if (aplicado <= 0) continue;

      const mesesAplicado = meses - mes;
      const ganho = aplicado * (Math.pow(1 + taxaMes, mesesAplicado) - 1);
      const imposto = isento ? 0 : ganho * Simulador.aliquotaIR(mesesAplicado * Simulador.DIAS_POR_MES);

      totalInvestido += aplicado;
      rendimentoBruto += ganho;
      impostoRenda += imposto;
    }

    const rendimentoLiquido = rendimentoBruto - impostoRenda;

    return {
      tipo,
      nome,
      taxaAnual: arredondar(Simulador.taxaAnual(taxaMes)),
      totalInvestido: arredondar(totalInvestido),
      rendimentoBruto: arredondar(rendimentoBruto),
      impostoRenda: arredondar(impostoRenda),
      valorFinal: arredondar(totalInvestido + rendimentoLiquido),
      rendimentoLiquido: arredondar(rendimentoLiquido),
      isentoDeIR: isento,
    };
  }

  /** Os três investimentos, do que rende mais para o que rende menos. */
  resultados(): ResultadoSimulacao[] {
    const tipos: TipoInvestimento[] = ['poupanca', 'tesouroSelic', 'cdb'];
    return tipos.map((tipo) => this.simular(tipo)).sort((a, b) => b.valorFinal - a.valorFinal);
  }
}
