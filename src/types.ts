export interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  senha?: string;
  avatar_url?: string;
  created_at?: string;
}

export type TipoConta = 'corrente' | 'poupanca' | 'investimento' | 'pj' | 'caixa';

export interface ContaBancaria {
  id: string;
  user_id: string;
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo_inicial: number;
  cor?: string;
  created_at?: string;
}

export interface CartaoCredito {
  id: string;
  user_id: string;
  nome: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'amex' | 'outros';
  limite_total: number;
  fatura_atual?: number; // Fatura vigente/atual editável
  total_gasto_acumulado?: number; // Total que já gastei nele no total
  dia_vencimento: number;
  melhor_dia_compra: number;
  cor?: string;
  conta_debito_id?: string;
  numero_cartao?: string; // Ex: "4532 8920 1234 5678"
  data_expiracao?: string; // Ex: "08/30"
  codigo_compra?: string; // CVV / Código de Segurança (Ex: "805")
  created_at?: string;
}

export type TipoTransacao = 'entrada' | 'saida';

export interface Transacao {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  conta_id?: string; // se for débito em conta
  cartao_id?: string; // se for no crédito
  data: string; // YYYY-MM-DD
  observacao?: string;
  comprovante?: string;
  devedor_id?: string; // se originado de pagamento de devedor
  conta_a_pagar_id?: string; // se originado de conta paga
  created_at?: string;
}

export type StatusDevedor = 'pendente' | 'parcial' | 'quitado' | 'atrasado';

export interface Devedor {
  id: string;
  user_id: string;
  nome: string;
  telefone?: string;
  item_servico: string; // Ex: "Venda do Civic", "Empréstimo", "Consultoria PJ"
  valor_total: number;
  valor_parcela?: number; // Valor de cada prestação/parcela
  qtd_parcelas: number;
  parcelas_pagas: number;
  valor_pago: number;
  data_inicio: string; // YYYY-MM-DD
  conta_destino_id?: string; // conta bancária padrão que receberá o dinheiro
  status: StatusDevedor;
  created_at?: string;
}

export type StatusContaPagar = 'pendente' | 'parcial' | 'quitado' | 'vencendo';

export interface ContaAPagar {
  id: string;
  user_id: string;
  descricao: string; // Ex: "Financiamento Caminhonete", "Aluguel Galpão"
  fornecedor_credor: string; // Ex: "Banco BV", "Imobiliária Prime"
  valor_total: number;
  qtd_prestacoes: number;
  prestacoes_pagas: number;
  valor_pago: number;
  vencimento: string; // YYYY-MM-DD
  categoria: string; // Ex: "Veículos", "Imóveis", "Fornecedores", "Impostos"
  conta_padrao_id?: string; // conta bancária que pagará
  status: StatusContaPagar;
  created_at?: string;
}

export type TabType = 'dashboard' | 'contas_cartoes' | 'devedores' | 'contas_pagar' | 'extrato';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface ResumoFinanceiro {
  saldoTotalGeral: number;
  totalAReceber: number;
  totalAPagarMes: number;
  faturaAtualCartoes: number;
  totalEntradasMes: number;
  totalSaidasMes: number;
}
