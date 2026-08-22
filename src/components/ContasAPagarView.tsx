import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { ContaAPagar, StatusContaPagar } from '../types';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowDownLeft,
  Search,
  Building,
  Tag,
  Clock,
  X,
} from 'lucide-react';

export function ContasAPagarView() {
  const { user } = useAuth();
  const {
    contasAPagar,
    contas,
    addContaPagar,
    deleteContaPagarItem,
    pagarParcelaConta,
    isPrivacyMode,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusContaPagar>('todos');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaAPagar | null>(null);
  const [editingContaId, setEditingContaId] = useState<string | null>(null);

  // Form New Conta a Pagar state
  const [descricao, setDescricao] = useState('');
  const [fornecedorCredor, setFornecedorCredor] = useState('');
  const [valorTotalStr, setValorTotalStr] = useState('');
  const [qtdPrestacoes, setQtdPrestacoes] = useState(12);
  const [vencimento, setVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('Outros');
  const [contaPadraoId, setContaPadraoId] = useState(contas[0]?.id || '');

  // Form Pagar Parcela state
  const [valorPagarStr, setValorPagarStr] = useState('');
  const [contaOrigemId, setContaOrigemId] = useState(contas[0]?.id || '');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleOpenNew = () => {
    setEditingContaId(null);
    setDescricao('');
    setFornecedorCredor('');
    setValorTotalStr('');
    setQtdPrestacoes(1);
    setVencimento(new Date().toISOString().split('T')[0]);
    setCategoria('Outros');
    setContaPadraoId(contas[0]?.id || '');
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (cap: ContaAPagar) => {
    setEditingContaId(cap.id);
    setDescricao(cap.descricao);
    setFornecedorCredor(cap.fornecedor_credor || '');
    setValorTotalStr(
      cap.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setQtdPrestacoes(cap.qtd_prestacoes || 1);
    setVencimento(cap.vencimento || new Date().toISOString().split('T')[0]);
    setCategoria(cap.categoria || 'Outros');
    setContaPadraoId(cap.conta_padrao_id || contas[0]?.id || '');
    setIsNewModalOpen(true);
  };

  const handleSaveContaPagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !descricao.trim()) return;

    const valorTotal =
      parseFloat(valorTotalStr.replace(/\./g, '').replace(',', '.')) || 0;

    const existing = editingContaId ? contasAPagar.find((c) => c.id === editingContaId) : null;

    await addContaPagar({
      id: editingContaId || undefined,
      user_id: user.id,
      descricao: descricao.trim(),
      fornecedor_credor: fornecedorCredor.trim() || 'Fornecedor',
      valor_total: valorTotal,
      qtd_prestacoes: Math.max(1, Number(qtdPrestacoes)),
      prestacoes_pagas: existing ? existing.prestacoes_pagas : 0,
      valor_pago: existing ? existing.valor_pago : 0,
      vencimento,
      categoria,
      conta_padrao_id: contaPadraoId || contas[0]?.id,
      status: existing ? existing.status : 'pendente',
    });

    setIsNewModalOpen(false);
  };

  const handleOpenPagarParcela = (cap: ContaAPagar) => {
    setSelectedConta(cap);
    const valorUnit = cap.valor_total / Math.max(1, cap.qtd_prestacoes);
    const saldoRestante = Math.max(0, cap.valor_total - cap.valor_pago);
    const valorSugerido = Math.min(valorUnit, saldoRestante);

    setValorPagarStr(
      valorSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setContaOrigemId(cap.conta_padrao_id || contas[0]?.id || '');
    setObservacaoPagamento(`Pagamento de parcela referente a ${cap.descricao}`);
    setIsPayModalOpen(true);
  };

  const handleConfirmPagarParcela = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConta) return;

    const valorNum =
      parseFloat(valorPagarStr.replace(/\./g, '').replace(',', '.')) || 0;

    if (valorNum <= 0) return;

    await pagarParcelaConta(
      selectedConta.id,
      valorNum,
      contaOrigemId,
      observacaoPagamento
    );

    setIsPayModalOpen(false);
  };

  const filteredContas = contasAPagar.filter((c) => {
    const matchSearch =
      c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.fornecedor_credor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAPagar = contasAPagar
    .filter((c) => c.status !== 'quitado')
    .reduce((acc, c) => acc + Math.max(0, c.valor_total - c.valor_pago), 0);

  const totalPago = contasAPagar.reduce((acc, c) => acc + (c.valor_pago || 0), 0);

  return (
    <div id="contas-a-pagar-view" className="space-y-6 pb-24">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Contas a Pagar (Obrigações)
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Controle de financiamentos, aluguéis, boletos e baixa automática no caixa
          </p>
        </div>

        <button
          id="btn-add-conta-pagar-view"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-950/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta a Pagar</span>
        </button>
      </div>

      {/* Summary KPI Mini-Banner */}
      <div className="grid grid-cols-2 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div>
          <span className="text-[11px] text-zinc-400 block">Total a Pagar (Ativo)</span>
          <p className="text-lg sm:text-xl font-bold font-mono-num text-rose-400">
            {formatMoney(totalAPagar)}
          </p>
          <span className="text-[10px] text-zinc-500">
            {contasAPagar.filter((c) => c.status !== 'quitado').length} contas pendentes
          </span>
        </div>

        <div className="text-right border-l border-zinc-800 pl-4">
          <span className="text-[11px] text-zinc-400 block">Total Liquidado</span>
          <p className="text-lg sm:text-xl font-bold font-mono-num text-zinc-200">
            {formatMoney(totalPago)}
          </p>
          <span className="text-[10px] text-emerald-500">
            {contasAPagar.filter((c) => c.status === 'quitado').length} contas quitadas
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-contas-pagar"
            type="text"
            placeholder="Buscar por descrição, fornecedor ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'pendente', 'vencendo', 'parcial', 'quitado'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-800 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st === 'todos' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Contas a Pagar Cards List */}
      {filteredContas.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
          <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400">Nenhuma conta a pagar encontrada.</p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all"
          >
            + Cadastrar Nova Conta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContas.map((cap) => {
            const saldoAPagar = Math.max(0, cap.valor_total - cap.valor_pago);
            const prestacoesRestantes = Math.max(0, cap.qtd_prestacoes - cap.prestacoes_pagas);
            const percentPago =
              cap.valor_total > 0 ? (cap.valor_pago / cap.valor_total) * 100 : 0;
            const isQuitado = cap.status === 'quitado' || saldoAPagar === 0;
            const valorUnitario = cap.valor_total / Math.max(1, cap.qtd_prestacoes);

            const statusColors: Record<StatusContaPagar, { bg: string; text: string; label: string }> = {
              quitado: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'Quitado' },
              parcial: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'Parcial' },
              vencendo: { bg: 'bg-rose-500/20 border-rose-500/40 animate-pulse', text: 'text-rose-300', label: 'Vencendo' },
              pendente: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-300', label: 'A Pagar' },
            };

            const currentStatus = statusColors[cap.status] || statusColors.pendente;

            return (
              <div
                key={cap.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 hover:border-zinc-700 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
                        {cap.descricao}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.text}`}
                      >
                        {currentStatus.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span className="text-rose-400 font-medium">{cap.fornecedor_credor}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{cap.categoria}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-400">
                        Venc: {cap.vencimento ? new Date(cap.vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(cap)}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                      title="Editar Conta a Pagar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${cap.descricao}"?`)) {
                          deleteContaPagarItem(cap.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Excluir Conta a Pagar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      {cap.prestacoes_pagas} de {cap.qtd_prestacoes} pagas ({prestacoesRestantes} restantes)
                    </span>
                    <span className="text-zinc-400">
                      Prest: {formatMoney(valorUnitario)}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isQuitado ? 'bg-emerald-400' : 'bg-gradient-to-r from-rose-500 to-yellow-500'
                      }`}
                      style={{ width: `${Math.min(100, percentPago)}%` }}
                    />
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Valor Total
                    </span>
                    <span className="text-xs font-bold text-zinc-200 font-mono-num">
                      {formatMoney(cap.valor_total)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Valor Pago
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono-num">
                      {formatMoney(cap.valor_pago)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Saldo a Pagar
                    </span>
                    <span className="text-xs font-bold text-rose-400 font-mono-num">
                      {formatMoney(saldoAPagar)}
                    </span>
                  </div>
                </div>

                {/* Action: Pagar Parcela */}
                {!isQuitado ? (
                  <button
                    id={`btn-pay-cap-${cap.id}`}
                    onClick={() => handleOpenPagarParcela(cap)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 transition-all cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Pagar Parcela (- Saída Automática em Conta)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conta Totalmente Paga & Liquidada</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: NOVA CONTA A PAGAR */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">
                {editingContaId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContaPagar} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Descrição do Compromisso</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Financiamento Hilux / Aluguel Galpão"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Fornecedor / Credor</label>
                <input
                  type="text"
                  placeholder="Ex: Banco BV, Imobiliária Prime, AWS Cloud"
                  value={fornecedorCredor}
                  onChange={(e) => setFornecedorCredor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Valor Total (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="48.000,00"
                    value={valorTotalStr}
                    onChange={(e) => setValorTotalStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Qtd. Prestações</label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    required
                    value={qtdPrestacoes}
                    onChange={(e) => setQtdPrestacoes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Categoria</label>
                  <input
                    type="text"
                    placeholder="Veículos, Imóveis, etc"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Conta Bancária de Débito</label>
                <select
                  value={contaPadraoId}
                  onChange={(e) => setContaPadraoId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.instituicao})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-950/30"
                >
                  {editingContaId ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR PARCELA */}
      {isPayModalOpen && selectedConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Pagar Prestação</h3>
                <p className="text-xs text-rose-400 font-medium">
                  {selectedConta.descricao} • {selectedConta.fornecedor_credor}
                </p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPagarParcela} className="space-y-4">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Saldo Restante:</span>
                  <span className="font-bold text-rose-400 font-mono-num">
                    {formatMoney(Math.max(0, selectedConta.valor_total - selectedConta.valor_pago))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Prestações Pagas:</span>
                  <span className="text-zinc-200 font-mono">
                    {selectedConta.prestacoes_pagas} / {selectedConta.qtd_prestacoes}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Valor a Pagar (R$)</label>
                <input
                  type="text"
                  required
                  value={valorPagarStr}
                  onChange={(e) => setValorPagarStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-rose-500/40 rounded-xl text-base font-bold text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Debitar da Conta Bancária (Lança Saída Automática)
                </label>
                <select
                  value={contaOrigemId}
                  onChange={(e) => setContaOrigemId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.instituicao})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Observação / Comprovante</label>
                <input
                  type="text"
                  placeholder="Ex: Débito bancário aprovado"
                  value={observacaoPagamento}
                  onChange={(e) => setObservacaoPagamento(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-950/30"
                >
                  Confirmar & Lançar Saída
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
