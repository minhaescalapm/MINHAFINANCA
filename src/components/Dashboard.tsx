import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { TabType, TipoTransacao } from '../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Receipt,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Landmark,
  ChevronRight,
  Database,
  Calendar,
  LogOut,
  BellRing,
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
  onOpenNewTransaction: (tipo: TipoTransacao) => void;
  onOpenNewDevedor: () => void;
  onOpenNewContaPagar: () => void;
  onOpenNewConta: () => void;
  onOpenSupabaseConfig: () => void;
}

export function Dashboard({
  setActiveTab,
  onOpenNewTransaction,
  onOpenNewDevedor,
  onOpenNewContaPagar,
  onOpenNewConta,
  onOpenSupabaseConfig,
}: DashboardProps) {
  const { user, logout, supabaseConfig } = useAuth();
  const {
    resumo,
    transacoes,
    contas,
    cartoes,
    devedores,
    contasAPagar,
    isLoadingData,
    refreshAllData,
    isPrivacyMode,
    togglePrivacyMode,
    deleteTransacaoItem,
  } = useFinance();

  const [filterType, setFilterType] = useState<'todos' | 'entrada' | 'saida'>('todos');

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const filteredRecentTransactions = transacoes
    .filter((t) => {
      if (filterType === 'entrada') return t.tipo === 'entrada';
      if (filterType === 'saida') return t.tipo === 'saida';
      return true;
    })
    .slice(0, 6);

  // Cash flow bar calculations
  const totalFlow = (resumo.totalEntradasMes || 0) + (resumo.totalSaidasMes || 0);
  const entradaPercent = totalFlow > 0 ? ((resumo.totalEntradasMes || 0) / totalFlow) * 100 : 50;
  const saidaPercent = totalFlow > 0 ? ((resumo.totalSaidasMes || 0) / totalFlow) * 100 : 50;

  // Check card due dates
  const todayDay = new Date().getDate();
  const cardsDueSoon = cartoes.filter((c) => {
    let diff = c.dia_vencimento - todayDay;
    if (diff < 0) {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      diff = daysInMonth - todayDay + c.dia_vencimento;
    }
    return diff <= 2 && diff >= 0;
  });

  return (
    <div id="dashboard-view" className="space-y-6 pb-24">
      {/* ⚠️ ALERTA CRÍTICO: FATURA VENCENDO EM 2 DIAS */}
      {cardsDueSoon.length > 0 && (
        <div
          onClick={() => setActiveTab('contas_cartoes')}
          className="cursor-pointer bg-gradient-to-r from-rose-950/90 via-zinc-900 to-rose-950/90 border-2 border-rose-500 rounded-2xl p-4 shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-pulse flex items-center justify-between gap-3 hover:scale-[1.01] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-zinc-950 text-[10px] font-black uppercase">
                  ALERTA
                </span>
                <p className="text-xs font-bold text-rose-200">
                  Fatura do cartão {cardsDueSoon[0].nome} vence em {cardsDueSoon[0].dia_vencimento - todayDay <= 0 ? 'HOJE' : `${cardsDueSoon[0].dia_vencimento - todayDay} dias`}!
                </p>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Vencimento Dia {cardsDueSoon[0].dia_vencimento}. Toque para ver detalhes ou pagar fatura.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'}
              alt={user?.nome}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700/80 object-cover shadow-lg"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950 shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-100 leading-tight">
                {user?.nome || 'Administrador'}
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Contas do Mês</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Privacy Toggle */}
          <button
            id="btn-toggle-privacy"
            onClick={togglePrivacyMode}
            title={isPrivacyMode ? 'Exibir valores' : 'Ocultar valores'}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-yellow-500" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Sync Button */}
          <button
            id="btn-refresh-data"
            onClick={() => refreshAllData()}
            disabled={isLoadingData}
            title="Sincronizar dados"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Logout Button */}
          <button
            id="btn-logout"
            onClick={logout}
            title="Encerrar Sessão"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supabase Status Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseConfig.url ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'
            }`}
          />
          <span className="text-zinc-300 font-medium">
            {supabaseConfig.url ? 'Supabase Conectado' : 'Modo Local-First & Fallback Ativo'}
          </span>
        </div>
        <button
          onClick={onOpenSupabaseConfig}
          className="text-zinc-400 hover:text-emerald-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
        >
          <Database className="w-3 h-3" />
          <span>Configurar</span>
        </button>
      </div>

      {/* 4 CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Saldo Total Geral */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Saldo Geral</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono-num text-emerald-400 leading-tight">
              {formatMoney(resumo.saldoTotalGeral)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              {contas.length} {contas.length === 1 ? 'conta ativa' : 'contas ativas'}
            </p>
          </div>
        </div>

        {/* 2. Total a Receber */}
        <div
          onClick={() => setActiveTab('devedores')}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">A Receber</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono-num text-emerald-400 leading-tight">
              {formatMoney(resumo.totalAReceber)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>{devedores.filter((d) => d.status !== 'quitado').length} devedores</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </p>
          </div>
        </div>

        {/* 3. Total a Pagar no Mês */}
        <div
          onClick={() => setActiveTab('contas_pagar')}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">A Pagar</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono-num text-rose-400 leading-tight">
              {formatMoney(resumo.totalAPagarMes)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>{contasAPagar.filter((c) => c.status !== 'quitado').length} contas abertas</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </p>
          </div>
        </div>

        {/* 4. Fatura Atual dos Cartões */}
        <div
          onClick={() => setActiveTab('contas_cartoes')}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer hover:border-zinc-700 transition-all group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Fatura Cartões</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold font-mono-num text-yellow-400 leading-tight">
              {formatMoney(resumo.faturaAtualCartoes)}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>{cartoes.length} cartões cadastrados</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </p>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS (BOTOES TÁTICOS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Ações Rápidas
          </h2>
          <span className="text-[11px] text-zinc-500">Lançamentos Imediatos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* + Nova Entrada */}
          <button
            id="btn-quick-entrada"
            onClick={() => onOpenNewTransaction('entrada')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-400 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-400 leading-tight truncate">
                + Nova Entrada
              </p>
              <p className="text-[10px] text-zinc-400 truncate">Lucros & Receitas</p>
            </div>
          </button>

          {/* + Nova Saída */}
          <button
            id="btn-quick-saida"
            onClick={() => onOpenNewTransaction('saida')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900 border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-400 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-400 leading-tight truncate">
                + Nova Saída
              </p>
              <p className="text-[10px] text-zinc-400 truncate">Despesas & Gastos</p>
            </div>
          </button>

          {/* + Novo Devedor */}
          <button
            id="btn-quick-devedor"
            onClick={onOpenNewDevedor}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900 border border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10 text-yellow-400 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-yellow-400 leading-tight truncate">
                + Novo Devedor
              </p>
              <p className="text-[10px] text-zinc-400 truncate">Vendas a Prazo</p>
            </div>
          </button>

          {/* + Nova Conta a Pagar */}
          <button
            id="btn-quick-conta-pagar"
            onClick={onOpenNewContaPagar}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-200 transition-all text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-200 leading-tight truncate">
                + Conta a Pagar
              </p>
              <p className="text-[10px] text-zinc-400 truncate">Prestações & Boletos</p>
            </div>
          </button>
        </div>
      </div>

      {/* FLUXO DO MÊS (BARRA VISUAL COMPARATIVA) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Balanço do Mês Atual
            </h3>
            <p className="text-[11px] text-zinc-400">Entradas vs Saídas acumuladas</p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-bold font-mono-num ${
                resumo.totalEntradasMes >= resumo.totalSaidasMes
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {resumo.totalEntradasMes >= resumo.totalSaidasMes ? '+' : ''}
              {formatMoney(resumo.totalEntradasMes - resumo.totalSaidasMes)}
            </span>
          </div>
        </div>

        {/* Progress Multi-Bar */}
        <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${entradaPercent}%` }}
            title={`Entradas: ${entradaPercent.toFixed(1)}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${saidaPercent}%` }}
            title={`Saídas: ${saidaPercent.toFixed(1)}%`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-zinc-400 block text-[10px]">Entradas</span>
              <span className="font-bold text-emerald-400 font-mono-num truncate block">
                {formatMoney(resumo.totalEntradasMes)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end text-right">
            <div className="min-w-0">
              <span className="text-zinc-400 block text-[10px]">Saídas</span>
              <span className="font-bold text-rose-400 font-mono-num truncate block">
                {formatMoney(resumo.totalSaidasMes)}
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS / HISTÓRICO RECENTE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Últimas Transações
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('extrato')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5"
            >
              <span>Ver Extrato Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Transaction list */}
        {filteredRecentTransactions.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center">
            <p className="text-sm text-zinc-400">Nenhuma transação recente encontrada.</p>
            <button
              onClick={() => onOpenNewTransaction('entrada')}
              className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
            >
              + Lançar Primeira Transação
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecentTransactions.map((t) => {
              const isEntrada = t.tipo === 'entrada';
              const contaNome = contas.find((c) => c.id === t.conta_id)?.nome;
              const cartaoNome = cartoes.find((crt) => crt.id === t.cartao_id)?.nome;

              return (
                <div
                  key={t.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
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
                      <p className="text-xs font-bold text-zinc-100 truncate">{t.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 truncate">
                        <span className="text-zinc-500">{t.categoria}</span>
                        <span>•</span>
                        <span className="truncate">{contaNome || cartaoNome || 'Geral'}</span>
                        <span>•</span>
                        <span className="font-mono text-zinc-500">
                          {t.data ? new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-bold font-mono-num ${
                        isEntrada ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isEntrada ? '+' : '-'} {formatMoney(t.valor)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
