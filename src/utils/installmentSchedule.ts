// Helper functions for Monday-to-Friday installment schedules, reference dates, and 10% daily fine calculation

export interface ScheduledInstallment {
  numero: number; // 1 to N
  dataVencimentoIso: string; // YYYY-MM-DD
  dataVencimentoFormatada: string; // DD/MM/YYYY
  diaSemanaNome: string; // "Segunda-feira", "Sexta-feira", etc.
  isSextaFeira: boolean;
  dataCoberturaFimIso: string; // if Friday, Domingo YYYY-MM-DD, else same date
  dataCoberturaFimFormatada: string;
  dataReferenciaDescricao: string; // "Essa prestação é referente ao dia DD/MM/AAAA (Sexta-feira)..."
  proximoVencimentoFormatado: string;
  isPaga: boolean;
  isAtrasada: boolean;
  diasAtraso: number;
  valorOriginal: number;
  multaAtraso: number; // 10% per day of delay
  valorComMulta: number;
}

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function parseISODate(isoStr: string): Date {
  if (!isoStr) return new Date();
  const parts = isoStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0); // Noon to avoid timezone shifts
  }
  return new Date(isoStr);
}

export function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatBRDate(d: Date | string): string {
  if (!d) return '';
  if (typeof d === 'string') {
    const parts = d.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates the schedule of business days (Monday to Friday).
 * If installment falls on Friday, it covers Friday through Sunday.
 * Next installment is Monday.
 */
export function generateInstallmentSchedule(
  dataInicioIso: string,
  qtdParcelas: number,
  parcelasPagas: number,
  valorParcela: number
): ScheduledInstallment[] {
  const safeQtd = Math.max(1, qtdParcelas || 1);
  const startDate = parseISODate(dataInicioIso || formatISODate(new Date()));

  // Normalize initial date if it starts on weekend
  let currentDate = new Date(startDate.getTime());
  const initialDayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
  if (initialDayOfWeek === 0) {
    // Sunday -> move to Monday
    currentDate = addDays(currentDate, 1);
  } else if (initialDayOfWeek === 6) {
    // Saturday -> move to Monday
    currentDate = addDays(currentDate, 2);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule: ScheduledInstallment[] = [];

  for (let i = 1; i <= safeQtd; i++) {
    if (i > 1) {
      const prevDayOfWeek = currentDate.getDay();
      if (prevDayOfWeek === 5) {
        // Friday -> Next business day is Monday (+3 days)
        currentDate = addDays(currentDate, 3);
      } else if (prevDayOfWeek === 6) {
        // Saturday -> Monday (+2 days)
        currentDate = addDays(currentDate, 2);
      } else {
        // Monday - Thursday -> +1 day
        currentDate = addDays(currentDate, 1);
      }
    }

    const currentIso = formatISODate(currentDate);
    const dayOfWeek = currentDate.getDay();
    const isSexta = dayOfWeek === 5;
    const diaNome = DIAS_SEMANA[dayOfWeek];

    // If Friday, covers until Sunday (+2 days)
    const coberturaFimDate = isSexta ? addDays(currentDate, 2) : currentDate;
    const coberturaFimIso = formatISODate(coberturaFimDate);
    const coberturaFimFormatada = formatBRDate(coberturaFimDate);

    // Next due date (Monday if Friday, else next day)
    const nextDueDate = isSexta ? addDays(currentDate, 3) : addDays(currentDate, 1);
    const proximoVencimentoFormatado = formatBRDate(nextDueDate);

    // Reference text description
    let dataReferenciaDescricao = '';
    if (isSexta) {
      dataReferenciaDescricao = `${formatBRDate(currentDate)} (Sexta-feira até Domingo ${coberturaFimFormatada})`;
    } else {
      dataReferenciaDescricao = `${formatBRDate(currentDate)} (${diaNome})`;
    }

    // Overdue calculation
    const isPaga = i <= parcelasPagas;
    const dateZero = new Date(currentDate.getTime());
    dateZero.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dateZero.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isAtrasada = !isPaga && diffDays > 0;
    const diasAtraso = isAtrasada ? diffDays : 0;

    // Multa de 10% por dia de atraso
    const multaAtraso = isAtrasada ? valorParcela * 0.1 * diasAtraso : 0;
    const valorComMulta = valorParcela + multaAtraso;

    schedule.push({
      numero: i,
      dataVencimentoIso: currentIso,
      dataVencimentoFormatada: formatBRDate(currentDate),
      diaSemanaNome: diaNome,
      isSextaFeira: isSexta,
      dataCoberturaFimIso: coberturaFimIso,
      dataCoberturaFimFormatada: coberturaFimFormatada,
      dataReferenciaDescricao,
      proximoVencimentoFormatado,
      isPaga,
      isAtrasada,
      diasAtraso,
      valorOriginal: valorParcela,
      multaAtraso,
      valorComMulta,
    });
  }

  return schedule;
}

/**
 * Builds the customized WhatsApp message with reference dates,
 * Friday-to-Sunday coverage, 10% daily fine notice, and WITHOUT the "Saldo Restante a Pagar" field.
 */
export function buildWhatsAppDevedorMessage(params: {
  nome: string;
  itemServico: string;
  dataPagamento: string;
  valorPago: number;
  parcelaAtualNum: number;
  totalParcelas: number;
  dataReferenciaTexto: string;
  isSextaFeira: boolean;
  proximaCobrancaData: string;
  diasAtraso?: number;
  multaAtraso?: number;
}): string {
  const parcelasRestantes = Math.max(0, params.totalParcelas - params.parcelaAtualNum);
  const dataPgtoFormatada = formatBRDate(params.dataPagamento);
  const valorFormatado = params.valorPago.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let msg = `Olá *${params.nome}*, confirmamos o recebimento da sua prestação! ✅\n\n`;
  msg += `📋 *Item/Serviço:* ${params.itemServico}\n`;
  msg += `📅 *Data do Pagamento:* ${dataPgtoFormatada}\n`;
  msg += `💰 *Valor Pago:* R$ ${valorFormatado}\n`;
  msg += `📊 *Status das Parcelas:* ${params.parcelaAtualNum} de ${params.totalParcelas} pagas\n`;
  msg += `⏳ *Parcelas Restantes:* Faltam ${parcelasRestantes} parcelas\n`;
  msg += `🗓️ *Referência:* Essa prestação é referente ao dia ${params.dataReferenciaTexto}\n`;

  if (params.isSextaFeira) {
    msg += `📌 *Cobertura de Fim de Semana:* Acertando a sexta-feira, você está coberto até domingo. Sua próxima prestação será na Segunda-feira (${params.proximaCobrancaData}).\n`;
  }

  if (params.diasAtraso && params.diasAtraso > 0) {
    const multaFormatada = (params.multaAtraso || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    msg += `\n🚨 *Aviso de Regularização:* Parcela referente à data em atraso (${params.diasAtraso} dia(s) de atraso | Multa de 10%/dia: R$ ${multaFormatada}).\n`;
  }

  msg += `\n⚠️ *Não atrase:* Multa de 10% por dia de atraso. Somente estará em dia quando quitar todas as parcelas pendentes.\n\n`;
  msg += `Agradecemos a sua pontualidade e confiança! 🤝`;

  return msg;
}
