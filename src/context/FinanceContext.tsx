import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ContaBancaria,
  CartaoCredito,
  Transacao,
  Devedor,
  ContaAPagar,
  ResumoFinanceiro,
} from '../types';
import {
  getContasBancarias,
  saveContaBancaria,
  deleteContaBancaria,
  getCartoesCredito,
  saveCartaoCredito,
  deleteCartaoCredito,
  getTransacoes,
  createTransacao,
  deleteTransacao,
  getDevedores,
  saveDevedor,
  deleteDevedor,
  registrarPagamentoDevedor,
  desfazerPagamentoDevedor,
  getContasAPagar,
  saveContaAPagar,
  deleteContaAPagar,
  pagarParcelaContaAPagar,
  getSupabaseClient,
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface FinanceContextType {
  contas: ContaBancaria[];
  cartoes: CartaoCredito[];
  transacoes: Transacao[];
  devedores: Devedor[];
  contasAPagar: ContaAPagar[];
  isLoadingData: boolean;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  resumo: ResumoFinanceiro;

  // Calculators
  getSaldoConta: (contaId: string) => number;
  getFaturaAtualCartao: (cartaoId: string) => number;
  getTotalGastoCartao: (cartaoId: string) => number;
  getLimiteDisponivelCartao: (cartao: CartaoCredito) => number;

  // Actions
  addConta: (conta: Omit<ContaBancaria, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteConta: (contaId: string) => Promise<void>;
  
  addCartao: (cartao: Omit<CartaoCredito, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteCartao: (cartaoId: string) => Promise<void>;
  updateFaturaCartao: (cartaoId: string, novaFatura: number, totalGasto?: number) => Promise<void>;
  pagarFaturaCartao: (cartaoId: string, valorFatura: number, contaOrigemId: string) => Promise<void>;

  addTransacao: (trx: Omit<Transacao, 'id' | 'created_at'>) => Promise<void>;
  deleteTransacaoItem: (trxId: string) => Promise<void>;

  addDevedor: (dev: Omit<Devedor, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteDevedorItem: (devId: string) => Promise<void>;
  receberParcelaDevedor: (devedorId: string, valorParcela: number, contaDestinoId: string, obs?: string) => Promise<void>;
  desfazerParcelaDevedor: (devedorId: string, qtdParcelas?: number) => Promise<void>;

  addContaPagar: (cap: Omit<ContaAPagar, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  deleteContaPagarItem: (capId: string) => Promise<void>;
  pagarParcelaConta: (contaPagarId: string, valorParcela: number, contaOrigemId: string, obs?: string) => Promise<void>;

  refreshAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [contasAPagar, setContasAPagar] = useState<ContaAPagar[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('gpwa_privacy_mode') === 'true';
  });

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('gpwa_privacy_mode', String(next));
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!user) {
      setContas([]);
      setCartoes([]);
      setTransacoes([]);
      setDevedores([]);
      setContasAPagar([]);
      return;
    }

    setIsLoadingData(true);
    try {
      const [contasData, cartoesData, trxData, devData, capData] = await Promise.all([
        getContasBancarias(user.id),
        getCartoesCredito(user.id),
        getTransacoes(user.id),
        getDevedores(user.id),
        getContasAPagar(user.id),
      ]);

      setContas(contasData);
      setCartoes(cartoesData);
      setTransacoes(trxData);
      setDevedores(devData);
      setContasAPagar(capData);
    } catch (err: any) {
      console.error('Erro ao carregar dados financeiros:', err);
      showError('Erro de Carregamento', 'Não foi possível sincronizar os dados com o servidor.');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadData();

    // 1. Supabase Realtime Subscription (Instant live sync across Notebook, Phone, Vercel)
    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      try {
        channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
            },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    // 2. Multi-tab and Multi-device sync on focus / visibility change
    const handleSyncEvent = () => {
      loadData();
    };

    window.addEventListener('storage', handleSyncEvent);
    window.addEventListener('focus', handleSyncEvent);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    });

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('storage', handleSyncEvent);
      window.removeEventListener('focus', handleSyncEvent);
    };
  }, [loadData]);

  // Real-time balance for individual bank account
  const getSaldoConta = useCallback(
    (contaId: string): number => {
      const conta = contas.find((c) => c.id === contaId);
      const saldoInicial = conta ? Number(conta.saldo_inicial) || 0 : 0;

      const totalEntradas = transacoes
        .filter((t) => t.conta_id === contaId && t.tipo === 'entrada')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

      const totalSaidas = transacoes
        .filter((t) => t.conta_id === contaId && t.tipo === 'saida')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

      return saldoInicial + totalEntradas - totalSaidas;
    },
    [contas, transacoes]
  );

  // Credit card current invoice (editable / dynamic)
  const getFaturaAtualCartao = useCallback(
    (cartaoId: string): number => {
      const cartao = cartoes.find((c) => c.id === cartaoId);
      if (cartao && typeof cartao.fatura_atual === 'number') {
        return Math.max(0, cartao.fatura_atual);
      }
      return transacoes
        .filter((t) => t.cartao_id === cartaoId && t.tipo === 'saida')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    },
    [cartoes, transacoes]
  );

  // Credit card total historically spent (aba/campo "valor que já gastei nele no total")
  const getTotalGastoCartao = useCallback(
    (cartaoId: string): number => {
      const cartao = cartoes.find((c) => c.id === cartaoId);
      if (cartao && typeof cartao.total_gasto_acumulado === 'number' && cartao.total_gasto_acumulado > 0) {
        return cartao.total_gasto_acumulado;
      }
      return transacoes
        .filter((t) => t.cartao_id === cartaoId && t.tipo === 'saida')
        .reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    },
    [cartoes, transacoes]
  );

  // Credit card available limit
  const getLimiteDisponivelCartao = useCallback(
    (cartao: CartaoCredito): number => {
      const fatura = getFaturaAtualCartao(cartao.id);
      return Math.max(0, cartao.limite_total - fatura);
    },
    [getFaturaAtualCartao]
  );

  // Summary Metrics
  const resumo = useMemo<ResumoFinanceiro>(() => {
    // 1. Saldo Total Geral
    const saldoTotalGeral = contas.reduce((acc, conta) => acc + getSaldoConta(conta.id), 0);

    // 2. Total a Receber (Soma dos saldos pendentes dos devedores)
    const totalAReceber = devedores
      .filter((d) => d.status !== 'quitado')
      .reduce((acc, d) => acc + Math.max(0, Number(d.valor_total) - Number(d.valor_pago)), 0);

    // 3. Total a Pagar no Mês / Ativo (Soma dos saldos pendentes das contas a pagar)
    const totalAPagarMes = contasAPagar
      .filter((c) => c.status !== 'quitado')
      .reduce((acc, c) => acc + Math.max(0, Number(c.valor_total) - Number(c.valor_pago)), 0);

    // 4. Fatura Atual dos Cartões
    const faturaAtualCartoes = cartoes.reduce(
      (acc, cartao) => acc + getFaturaAtualCartao(cartao.id),
      0
    );

    // 5. Entradas e Saídas do Mês Atual
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const transacoesDoMes = transacoes.filter((t) => t.data?.startsWith(currentMonthPrefix));

    const totalEntradasMes = transacoesDoMes
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    const totalSaidasMes = transacoesDoMes
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    return {
      saldoTotalGeral,
      totalAReceber,
      totalAPagarMes,
      faturaAtualCartoes,
      totalEntradasMes,
      totalSaidasMes,
    };
  }, [contas, cartoes, transacoes, devedores, contasAPagar, getSaldoConta, getFaturaAtualCartao]);

  // Contas Bancárias Actions
  const addConta = async (contaData: Omit<ContaBancaria, 'id' | 'created_at'> & { id?: string }) => {
    try {
      const saved = await saveContaBancaria(contaData);
      setContas((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showSuccess('Conta Bancária Salva', `${saved.nome} atualizada com sucesso.`);
    } catch (e: any) {
      showError('Erro ao Salvar Conta', e?.message);
    }
  };

  const deleteConta = async (contaId: string) => {
    try {
      await deleteContaBancaria(contaId);
      setContas((prev) => prev.filter((c) => c.id !== contaId));
      showInfo('Conta Removida', 'Conta bancária excluída com sucesso.');
    } catch (e: any) {
      showError('Erro ao Excluir Conta', e?.message);
    }
  };

  // Cartões Actions
  const addCartao = async (cartaoData: Omit<CartaoCredito, 'id' | 'created_at'> & { id?: string }) => {
    try {
      const saved = await saveCartaoCredito(cartaoData);
      setCartoes((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showSuccess('Cartão de Crédito Salvo', `${saved.nome} atualizado com sucesso.`);
    } catch (e: any) {
      showError('Erro ao Salvar Cartão', e?.message);
    }
  };

  const deleteCartao = async (cartaoId: string) => {
    try {
      await deleteCartaoCredito(cartaoId);
      setCartoes((prev) => prev.filter((c) => c.id !== cartaoId));
      showInfo('Cartão Removido', 'Cartão de crédito excluído do sistema.');
    } catch (e: any) {
      showError('Erro ao Excluir Cartão', e?.message);
    }
  };

  const updateFaturaCartao = async (cartaoId: string, novaFatura: number, totalGasto?: number) => {
    if (!user) return;
    try {
      const cartao = cartoes.find((c) => c.id === cartaoId);
      if (!cartao) return;

      const updatedCartao: CartaoCredito = {
        ...cartao,
        fatura_atual: Math.max(0, novaFatura),
        total_gasto_acumulado:
          totalGasto !== undefined ? Math.max(0, totalGasto) : cartao.total_gasto_acumulado,
      };

      const saved = await saveCartaoCredito(updatedCartao);
      setCartoes((prev) => prev.map((c) => (c.id === cartaoId ? saved : c)));
      showSuccess(
        'Fatura do Cartão Atualizada',
        `Fatura vigente ajustada para R$ ${novaFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Limite disponível recalculado!`
      );
    } catch (e: any) {
      showError('Erro ao Atualizar Fatura', e?.message);
    }
  };

  const pagarFaturaCartao = async (cartaoId: string, valorFatura: number, contaOrigemId: string) => {
    if (!user) return;
    try {
      const cartao = cartoes.find((c) => c.id === cartaoId);
      const conta = contas.find((c) => c.id === contaOrigemId);

      // 1. Registra uma transação de Saída na conta bancária para debitar o pagamento
      const trx = await createTransacao({
        user_id: user.id,
        descricao: `Pagamento Fatura: ${cartao?.nome || 'Cartão de Crédito'}`,
        valor: valorFatura,
        tipo: 'saida',
        categoria: 'Fatura de Cartão',
        conta_id: contaOrigemId,
        data: new Date().toISOString().split('T')[0],
        observacao: `Liquidação total/parcial da fatura debitada em ${conta?.nome || 'Conta'}`,
      });

      setTransacoes((prev) => [trx, ...prev]);

      // 2. Abate o valor pago da fatura vigente do cartão, restabelecendo o limite disponível
      if (cartao) {
        const faturaAtual = getFaturaAtualCartao(cartaoId);
        const novaFatura = Math.max(0, faturaAtual - valorFatura);
        const updatedCartao: CartaoCredito = {
          ...cartao,
          fatura_atual: novaFatura,
        };
        const savedCartao = await saveCartaoCredito(updatedCartao);
        setCartoes((prev) => prev.map((c) => (c.id === cartaoId ? savedCartao : c)));
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#fbbf24'],
        });
      } catch {}

      showSuccess(
        'Fatura Paga com Sucesso!',
        `Lançado débito de R$ ${valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${conta?.nome}. O limite de R$ ${valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi restabelecido no cartão!`
      );
    } catch (e: any) {
      showError('Erro ao Pagar Fatura', e?.message);
    }
  };

  // Transações Actions
  const addTransacao = async (trxData: Omit<Transacao, 'id' | 'created_at'>) => {
    try {
      const saved = await createTransacao(trxData);
      setTransacoes((prev) => [saved, ...prev]);
      const tipoTxt = saved.tipo === 'entrada' ? 'Entrada' : 'Saída';
      showSuccess(`Nova ${tipoTxt} Lançada`, `${saved.descricao} - R$ ${saved.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    } catch (e: any) {
      showError('Erro ao Lançar Transação', e?.message);
    }
  };

  const deleteTransacaoItem = async (trxId: string) => {
    try {
      await deleteTransacao(trxId);
      setTransacoes((prev) => prev.filter((t) => t.id !== trxId));
      showInfo('Transação Excluída', 'Registro removido do fluxo de caixa.');
    } catch (e: any) {
      showError('Erro ao Excluir Transação', e?.message);
    }
  };

  // Devedores Actions
  const addDevedor = async (devData: Omit<Devedor, 'id' | 'created_at'> & { id?: string }) => {
    try {
      const saved = await saveDevedor(devData);
      setDevedores((prev) => {
        const idx = prev.findIndex((d) => d.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showSuccess('Devedor Registrado', `${saved.nome} (${saved.item_servico}) cadastrado.`);
    } catch (e: any) {
      showError('Erro ao Salvar Devedor', e?.message);
    }
  };

  const deleteDevedorItem = async (devId: string) => {
    try {
      await deleteDevedor(devId);
      setDevedores((prev) => prev.filter((d) => d.id !== devId));
      showInfo('Registro Excluído', 'Devedor removido da lista.');
    } catch (e: any) {
      showError('Erro ao Excluir Devedor', e?.message);
    }
  };

  const receberParcelaDevedor = async (
    devedorId: string,
    valorParcela: number,
    contaDestinoId: string,
    obs?: string
  ) => {
    try {
      const targetDev = devedores.find((d) => d.id === devedorId);
      if (!targetDev) return;

      const { updatedDevedor, transacao } = await registrarPagamentoDevedor(
        targetDev,
        valorParcela,
        contaDestinoId,
        obs
      );

      // Atualiza states
      setDevedores((prev) => prev.map((d) => (d.id === devedorId ? updatedDevedor : d)));
      setTransacoes((prev) => [transacao, ...prev]);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#eab308', '#6ee7b7'],
        });
      } catch {}

      showSuccess(
        'Pagamento Recebido!',
        `R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} creditado na conta bancária.`
      );
    } catch (e: any) {
      showError('Erro ao Registrar Pagamento', e?.message);
    }
  };

  const desfazerParcelaDevedor = async (devedorId: string, qtdParcelas: number = 1) => {
    try {
      const targetDev = devedores.find((d) => d.id === devedorId);
      if (!targetDev) return;

      if (targetDev.parcelas_pagas <= 0) {
        showInfo('Nenhuma Parcela Paga', 'Não há prestações pagas para estornar.');
        return;
      }

      const { updatedDevedor } = await desfazerPagamentoDevedor(targetDev, qtdParcelas);

      // Atualiza states
      setDevedores((prev) => prev.map((d) => (d.id === devedorId ? updatedDevedor : d)));

      // Recarrega transações para refletir a remoção da entrada de caixa
      await loadData();

      showSuccess(
        'Pagamento Excluído/Desfeito!',
        `A prestação voltou a constar como pendente na data correta do cronograma.`
      );
    } catch (e: any) {
      showError('Erro ao Desfazer Pagamento', e?.message);
    }
  };

  // Contas a Pagar Actions
  const addContaPagar = async (capData: Omit<ContaAPagar, 'id' | 'created_at'> & { id?: string }) => {
    try {
      const saved = await saveContaAPagar(capData);
      setContasAPagar((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      showSuccess('Conta a Pagar Salva', `${saved.descricao} adicionada.`);
    } catch (e: any) {
      showError('Erro ao Salvar Conta a Pagar', e?.message);
    }
  };

  const deleteContaPagarItem = async (capId: string) => {
    try {
      await deleteContaAPagar(capId);
      setContasAPagar((prev) => prev.filter((c) => c.id !== capId));
      showInfo('Registro Excluído', 'Conta a pagar removida.');
    } catch (e: any) {
      showError('Erro ao Excluir Conta a Pagar', e?.message);
    }
  };

  const pagarParcelaConta = async (
    contaPagarId: string,
    valorParcela: number,
    contaOrigemId: string,
    obs?: string
  ) => {
    try {
      const targetCap = contasAPagar.find((c) => c.id === contaPagarId);
      if (!targetCap) return;

      const { updatedConta, transacao } = await pagarParcelaContaAPagar(
        targetCap,
        valorParcela,
        contaOrigemId,
        obs
      );

      // Atualiza states
      setContasAPagar((prev) => prev.map((c) => (c.id === contaPagarId ? updatedConta : c)));
      setTransacoes((prev) => [transacao, ...prev]);

      showSuccess(
        'Prestação Paga!',
        `Débito de R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} lançado na conta.`
      );
    } catch (e: any) {
      showError('Erro ao Pagar Prestação', e?.message);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        contas,
        cartoes,
        transacoes,
        devedores,
        contasAPagar,
        isLoadingData,
        isPrivacyMode,
        togglePrivacyMode,
        resumo,
        getSaldoConta,
        getFaturaAtualCartao,
        getTotalGastoCartao,
        getLimiteDisponivelCartao,
        addConta,
        deleteConta,
        addCartao,
        deleteCartao,
        updateFaturaCartao,
        pagarFaturaCartao,
        addTransacao,
        deleteTransacaoItem,
        addDevedor,
        deleteDevedorItem,
        receberParcelaDevedor,
        desfazerParcelaDevedor,
        addContaPagar,
        deleteContaPagarItem,
        pagarParcelaConta,
        refreshAllData: loadData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}
