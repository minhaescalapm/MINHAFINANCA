import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TipoTransacao } from '../types';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Plus,
  Trash2,
  Calendar,
  Download,
  Landmark,
  CreditCard,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface ExtratoViewProps {
  onOpenNewTransaction: (tipo: TipoTransacao) => void;
}

export function ExtratoView({ onOpenNewTransaction }: ExtratoViewProps) {
  const {
    transacoes,
    contas,
    cartoes,
    deleteTransacaoItem,
    isPrivacyMode,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [contaFilter, setContaFilter] = useState<string>('todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Get list of unique months available in transacoes
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    transacoes.forEach((t) => {
      if (t.data) {
        monthsSet.add(t.data.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transacoes]);

  // Filtered list
  const filteredTransacoes = transacoes.filter((t) => {
    const matchSearch =
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.observacao && t.observacao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchTipo = tipoFilter === 'todos' || t.tipo === tipoFilter;

    const matchConta =
      contaFilter === 'todos' ||
      t.conta_id === contaFilter ||
      t.cartao_id === contaFilter;

    const matchMonth =
      selectedMonth === 'todos' || (t.data && t.data.startsWith(selectedMonth));

    return matchSearch && matchTipo && matchConta && matchMonth;
  });

  // Calculate totals of filtered items
  const totalEntradasFiltradas = filteredTransacoes
    .filter((t) => t.tipo === 'entrada')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

  const totalSaidasFiltradas = filteredTransacoes
    .filter((t) => t.tipo === 'saida')
    .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

  const saldoFiltrado = totalEntradasFiltradas - totalSaidasFiltradas;

  // Export CSV
  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Conta/Cartão', 'Observação'];
    const rows = filteredTransacoes.map((t) => {
      const contaNome = contas.find((c) => c.id === t.conta_id)?.nome;
      const cartaoNome = cartoes.find((crt) => crt.id === t.cartao_id)?.nome;
      return [
        t.data,
        t.tipo.toUpperCase(),
        `"${t.descricao.replace(/"/g, '""')}"`,
        `"${t.categoria}"`,
        t.valor.toFixed(2),
        `"${contaNome || cartaoNome || 'Geral'}"`,
        `"${(t.observacao || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="extrato-view" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Fluxo de Caixa & Extrato
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Histórico completo de entradas, saídas, boletos e recebimentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-zinc-100 transition-colors"
            title="Exportar CSV para Excel/Sheets"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="btn-extrato-nova-entrada"
            onClick={() => onOpenNewTransaction('entrada')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Summary Filter Bar */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            Entradas Filtradas
          </span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono-num">
            +{formatMoney(totalEntradasFiltradas)}
          </span>
        </div>

        <div className="border-x border-zinc-800 px-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            Saídas Filtradas
          </span>
          <span className="text-xs sm:text-sm font-bold text-rose-400 font-mono-num">
            -{formatMoney(totalSaidasFiltradas)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            Saldo Período
          </span>
          <span
            className={`text-xs sm:text-sm font-bold font-mono-num ${
              saldoFiltrado >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {saldoFiltrado >= 0 ? '+' : ''}
            {formatMoney(saldoFiltrado)}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-extrato"
            type="text"
            placeholder="Buscar por descrição, categoria ou observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Tipo Filter */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTipoFilter('todos')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tipoFilter === 'todos'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTipoFilter('entrada')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tipoFilter === 'entrada'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTipoFilter('saida')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tipoFilter === 'saida'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* Conta / Cartão Filter */}
          <select
            value={contaFilter}
            onChange={(e) => setContaFilter(e.target.value)}
            className="py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            <option value="todos">Todas as Contas & Cartões</option>
            <optgroup label="Contas Bancárias">
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cartões de Crédito">
              {cartoes.map((crt) => (
                <option key={crt.id} value={crt.id}>
                  {crt.nome}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
          >
            <option value="todos">Todos os Meses</option>
            {availableMonths.map((m) => {
              const [year, month] = m.split('-');
              const dateObj = new Date(Number(year), Number(month) - 1, 1);
              const monthName = dateObj.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <option key={m} value={m}>
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransacoes.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
          <ArrowLeftRight className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400">Nenhum lançamento corresponde aos filtros atuais.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransacoes.map((t) => {
            const isEntrada = t.tipo === 'entrada';
            const conta = contas.find((c) => c.id === t.conta_id);
            const cartao = cartoes.find((crt) => crt.id === t.cartao_id);

            return (
              <div
                key={t.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isEntrada
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {isEntrada ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                      {t.descricao}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span className="text-yellow-400 font-medium">{t.categoria}</span>
                      <span>•</span>
                      <span className="text-zinc-400 truncate">
                        {conta ? conta.nome : cartao ? cartao.nome : 'Geral'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-zinc-500">
                        {t.data ? new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>

                    {t.observacao && (
                      <p className="text-[10px] text-zinc-500 mt-1 italic truncate">
                        "{t.observacao}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-sm font-bold font-mono-num ${
                        isEntrada ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isEntrada ? '+' : '-'} {formatMoney(t.valor)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir a transação "${t.descricao}" de ${formatMoney(t.valor)}?`)) {
                        deleteTransacaoItem(t.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700/50 transition-all cursor-pointer"
                    title="Excluir Transação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
