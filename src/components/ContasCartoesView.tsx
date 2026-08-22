import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { ContaBancaria, CartaoCredito, TipoConta } from '../types';
import {
  Landmark,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Check,
  Bell,
  BellRing,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContasCartoesViewProps {
  onOpenNewTransaction: () => void;
}

export function ContasCartoesView({ onOpenNewTransaction }: ContasCartoesViewProps) {
  const { user } = useAuth();
  const {
    contas,
    cartoes,
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
    isPrivacyMode,
  } = useFinance();

  // Modals state
  const [isContaModalOpen, setIsContaModalOpen] = useState(false);
  const [isCartaoModalOpen, setIsCartaoModalOpen] = useState(false);
  const [isPagarFaturaOpen, setIsPagarFaturaOpen] = useState(false);
  const [selectedCartaoFatura, setSelectedCartaoFatura] = useState<CartaoCredito | null>(null);

  // Form Conta state
  const [editingContaId, setEditingContaId] = useState<string | null>(null);
  const [contaNome, setContaNome] = useState('');
  const [contaInstituicao, setContaInstituicao] = useState('');
  const [contaTipo, setContaTipo] = useState<TipoConta>('corrente');
  const [contaSaldoInicial, setContaSaldoInicial] = useState('0,00');
  const [contaCor, setContaCor] = useState('#10b981');

  // Form Cartão state
  const [editingCartaoId, setEditingCartaoId] = useState<string | null>(null);
  const [cartaoNome, setCartaoNome] = useState('');
  const [cartaoBandeira, setCartaoBandeira] = useState<'visa' | 'mastercard' | 'elo' | 'amex' | 'outros'>('mastercard');
  const [cartaoLimite, setCartaoLimite] = useState('');
  const [cartaoFaturaAtual, setCartaoFaturaAtual] = useState('0,00');
  const [cartaoTotalGasto, setCartaoTotalGasto] = useState('0,00');
  const [cartaoVencimento, setCartaoVencimento] = useState(10);
  const [cartaoMelhorDia, setCartaoMelhorDia] = useState(3);
  const [cartaoContaDebito, setCartaoContaDebito] = useState('');
  const [cartaoNumero, setCartaoNumero] = useState('');
  const [cartaoExpiracao, setCartaoExpiracao] = useState('');
  const [cartaoCodigoCompra, setCartaoCodigoCompra] = useState('');

  // Quick edit fatura modal
  const [isQuickFaturaOpen, setIsQuickFaturaOpen] = useState(false);
  const [quickFaturaCard, setQuickFaturaCard] = useState<CartaoCredito | null>(null);
  const [quickFaturaVal, setQuickFaturaVal] = useState('');
  const [quickTotalGastoVal, setQuickTotalGastoVal] = useState('');

  // PIN security state (PIN: 1602)
  const [unlockedCards, setUnlockedCards] = useState<Record<string, boolean>>({});
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinTargetCard, setPinTargetCard] = useState<CartaoCredito | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mobile Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [alertSent, setAlertSent] = useState(false);

  // Pagar fatura form state
  const [faturaValorPagar, setFaturaValorPagar] = useState('');
  const [faturaContaOrigem, setFaturaContaOrigem] = useState(contas[0]?.id || '');

  // Current Month Name and Year
  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const currentMonthFormatted =
    currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  const currentYear = currentDate.getFullYear();

  // Calculate Due Date Status
  const getCardDueStatus = (diaVencimento: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    let diffDays = diaVencimento - currentDay;

    // If day has passed this month, compute days to next month
    if (diffDays < 0) {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      diffDays = daysInMonth - currentDay + diaVencimento;
    }

    const isDueSoon = diffDays <= 2 && diffDays >= 0;
    return {
      diffDays,
      isDueSoon,
      isDueToday: diffDays === 0,
      isDueTomorrow: diffDays === 1,
      isDueInTwoDays: diffDays === 2,
    };
  };

  // Check any card due in <= 2 days
  const cardsDueSoon = cartoes.filter((c) => {
    const status = getCardDueStatus(c.dia_vencimento);
    return status.isDueSoon;
  });

  // Mobile Notification Dispatcher
  const triggerMobileNotification = (title: string, body: string) => {
    // 1. Device Vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([250, 100, 250, 100, 400]);
      } catch (e) {
        console.warn('Vibration API error:', e);
      }
    }

    // 2. Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=128&auto=format&fit=crop&q=80',
          });
          setAlertSent(true);
        } catch (e) {
          console.warn('Notification error:', e);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            try {
              new Notification(title, { body });
              setAlertSent(true);
            } catch (e) {
              console.warn('Notification error:', e);
            }
          }
        });
      }
    }
  };

  // Automated check on mount if card is due in <= 2 days
  useEffect(() => {
    if (cardsDueSoon.length > 0 && !alertSent) {
      const firstCard = cardsDueSoon[0];
      const status = getCardDueStatus(firstCard.dia_vencimento);
      const fatura = getFaturaAtualCartao(firstCard.id);
      const daysText = status.diffDays === 0 ? 'HOJE' : `em ${status.diffDays} dia(s)`;
      triggerMobileNotification(
        `⚠️ Alerta: Fatura do cartão ${firstCard.nome} vence ${daysText}!`,
        `Fatura vigente no valor de R$ ${fatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Vencimento: Dia ${firstCard.dia_vencimento}.`
      );
    }
  }, [cardsDueSoon.length]);

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // PIN Dialpad Handler (PIN: 1602)
  const handlePinPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setEnteredPin('');
    setPinError(false);
  };

  const validatePin = (pinToTest: string) => {
    if (pinToTest === '1602') {
      if (pinTargetCard) {
        setUnlockedCards((prev) => ({ ...prev, [pinTargetCard.id]: true }));
      }
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        setIsPinModalOpen(false);
        setEnteredPin('');
        setPinTargetCard(null);
      }, 300);
    } else {
      setPinError(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => {
        setEnteredPin('');
      }, 700);
    }
  };

  const handleOpenPinModal = (cartao: CartaoCredito) => {
    setPinTargetCard(cartao);
    setEnteredPin('');
    setPinError(false);
    setIsPinModalOpen(true);
  };

  const handleLockCard = (cartaoId: string) => {
    setUnlockedCards((prev) => ({ ...prev, [cartaoId]: false }));
  };

  // Conta Handlers
  const handleOpenNewConta = () => {
    setEditingContaId(null);
    setContaNome('');
    setContaInstituicao('Nubank');
    setContaTipo('pj');
    setContaSaldoInicial('0,00');
    setContaCor('#820ad1');
    setIsContaModalOpen(true);
  };

  const handleOpenEditConta = (c: ContaBancaria) => {
    setEditingContaId(c.id);
    setContaNome(c.nome);
    setContaInstituicao(c.instituicao);
    setContaTipo(c.tipo);
    setContaSaldoInicial(
      c.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setContaCor(c.cor || '#10b981');
    setIsContaModalOpen(true);
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contaNome.trim()) return;

    const saldoNum =
      parseFloat(contaSaldoInicial.replace(/\./g, '').replace(',', '.')) || 0;

    await addConta({
      id: editingContaId || undefined,
      user_id: user.id,
      nome: contaNome.trim(),
      instituicao: contaInstituicao.trim() || 'Banco',
      tipo: contaTipo,
      saldo_inicial: saldoNum,
      cor: contaCor,
    });

    setIsContaModalOpen(false);
  };

  // Cartão Handlers
  const handleOpenNewCartao = () => {
    setEditingCartaoId(null);
    setCartaoNome('');
    setCartaoBandeira('mastercard');
    setCartaoLimite('');
    setCartaoFaturaAtual('0,00');
    setCartaoTotalGasto('0,00');
    setCartaoVencimento(10);
    setCartaoMelhorDia(3);
    setCartaoContaDebito(contas[0]?.id || '');
    setCartaoNumero('');
    setCartaoExpiracao('');
    setCartaoCodigoCompra('');
    setIsCartaoModalOpen(true);
  };

  const handleOpenEditCartao = (crt: CartaoCredito) => {
    setEditingCartaoId(crt.id);
    setCartaoNome(crt.nome);
    setCartaoBandeira(crt.bandeira || 'mastercard');
    setCartaoLimite(
      crt.limite_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const fatura = getFaturaAtualCartao(crt.id);
    setCartaoFaturaAtual(
      fatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const totalGasto = getTotalGastoCartao(crt.id);
    setCartaoTotalGasto(
      totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setCartaoVencimento(crt.dia_vencimento || 10);
    setCartaoMelhorDia(crt.melhor_dia_compra || 3);
    setCartaoContaDebito(crt.conta_debito_id || contas[0]?.id || '');
    setCartaoNumero(crt.numero_cartao || '4532 7810 9921 5193');
    setCartaoExpiracao(crt.data_expiracao || '12/29');
    setCartaoCodigoCompra(crt.codigo_compra || '508');
    setIsCartaoModalOpen(true);
  };

  const handleOpenQuickFatura = (crt: CartaoCredito) => {
    setQuickFaturaCard(crt);
    const fatura = getFaturaAtualCartao(crt.id);
    setQuickFaturaVal(
      fatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const totalGasto = getTotalGastoCartao(crt.id);
    setQuickTotalGastoVal(
      totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setIsQuickFaturaOpen(true);
  };

  const handleSaveQuickFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFaturaCard) return;

    const novaFaturaNum =
      parseFloat(quickFaturaVal.replace(/\./g, '').replace(',', '.')) || 0;
    const totalGastoNum =
      parseFloat(quickTotalGastoVal.replace(/\./g, '').replace(',', '.')) || 0;

    await updateFaturaCartao(quickFaturaCard.id, novaFaturaNum, totalGastoNum);
    setIsQuickFaturaOpen(false);
  };

  const handleSaveCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cartaoNome.trim()) return;

    const limiteNum =
      parseFloat(cartaoLimite.replace(/\./g, '').replace(',', '.')) || 0;
    const faturaNum =
      parseFloat(cartaoFaturaAtual.replace(/\./g, '').replace(',', '.')) || 0;
    const totalGastoNum =
      parseFloat(cartaoTotalGasto.replace(/\./g, '').replace(',', '.')) || 0;

    await addCartao({
      id: editingCartaoId || undefined,
      user_id: user.id,
      nome: cartaoNome.trim(),
      bandeira: cartaoBandeira,
      limite_total: limiteNum,
      fatura_atual: faturaNum,
      total_gasto_acumulado: totalGastoNum,
      dia_vencimento: Number(cartaoVencimento),
      melhor_dia_compra: Number(cartaoMelhorDia),
      conta_debito_id: cartaoContaDebito || undefined,
      numero_cartao: cartaoNumero.trim() || '4532 7810 9921 5193',
      data_expiracao: cartaoExpiracao.trim() || '12/29',
      codigo_compra: cartaoCodigoCompra.trim() || '508',
    });

    setIsCartaoModalOpen(false);
  };

  const handleOpenPagarFatura = (crt: CartaoCredito) => {
    setSelectedCartaoFatura(crt);
    const fatura = getFaturaAtualCartao(crt.id);
    setFaturaValorPagar(
      fatura.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setFaturaContaOrigem(crt.conta_debito_id || contas[0]?.id || '');
    setIsPagarFaturaOpen(true);
  };

  const handleConfirmPagarFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCartaoFatura || !faturaContaOrigem) return;
    const valor = parseFloat(faturaValorPagar.replace(/\./g, '').replace(',', '.')) || 0;
    if (valor <= 0) return;

    await pagarFaturaCartao(selectedCartaoFatura.id, valor, faturaContaOrigem);
    setIsPagarFaturaOpen(false);
  };

  return (
    <div id="contas-cartoes-view" className="space-y-8 pb-24">
      {/* ⚠️ ALERTA DE FATURA VENCENDO EM 2 DIAS & NOTIFICAÇÃO CELULAR */}
      {cardsDueSoon.length > 0 && (
        <div
          id="banner-alerta-fatura-vencendo"
          className="relative overflow-hidden bg-gradient-to-r from-rose-950/80 via-zinc-900 to-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 shadow-[0_0_30px_rgba(244,63,94,0.35)] animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider">
                    ALERTA CRÍTICO
                  </span>
                  <h4 className="text-sm font-bold text-rose-200">
                    Fatura Vencendo em {cardsDueSoon[0].dia_vencimento - currentDate.getDate() <= 0 ? 'HOJE' : `${cardsDueSoon[0].dia_vencimento - currentDate.getDate()} dias`}!
                  </h4>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Cartão <strong>{cardsDueSoon[0].nome}</strong> com fatura de{' '}
                  <strong className="text-rose-400 font-mono">
                    {formatMoney(getFaturaAtualCartao(cardsDueSoon[0].id))}
                  </strong>{' '}
                  vencendo no <strong>Dia {cardsDueSoon[0].dia_vencimento}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-notificar-celular"
                onClick={() => {
                  const c = cardsDueSoon[0];
                  const st = getCardDueStatus(c.dia_vencimento);
                  const daysTxt = st.diffDays === 0 ? 'HOJE' : `em ${st.diffDays} dias`;
                  triggerMobileNotification(
                    `🚨 Vencimento da Fatura: ${c.nome}!`,
                    `Fatura vence ${daysTxt} (Dia ${c.dia_vencimento}). Valor: ${formatMoney(getFaturaAtualCartao(c.id))}`
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs shadow-lg transition-all"
              >
                <Bell className="w-4 h-4" />
                <span>Notificar no Celular</span>
              </button>

              <button
                onClick={() => handleOpenPagarFatura(cardsDueSoon[0])}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-rose-500/50 text-rose-300 hover:bg-zinc-800 font-bold text-xs transition-all"
              >
                Pagar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: CONTAS BANCÁRIAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Contas Bancárias & Caixas
              </h2>
              <p className="text-[11px] text-zinc-400">
                Saldo atualizado em tempo real via cálculo de transações
              </p>
            </div>
          </div>

          <button
            id="btn-add-conta"
            onClick={handleOpenNewConta}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

        {/* List of Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contas.map((conta) => {
            const saldoAtual = getSaldoConta(conta.id);
            const isPositive = saldoAtual >= 0;

            const tipoBadges: Record<TipoConta, { label: string; color: string }> = {
              pj: { label: 'Conta PJ', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
              corrente: { label: 'Conta Corrente PF', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
              investimento: { label: 'Investimentos', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
              poupanca: { label: 'Poupança', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
              caixa: { label: 'Caixa / Cofre Físico', color: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
            };

            return (
              <div
                key={conta.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-all group relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: conta.cor || '#10b981' }}
                />

                <div className="flex items-start justify-between gap-2 pl-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100">{conta.nome}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{conta.instituicao}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        tipoBadges[conta.tipo]?.color || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {tipoBadges[conta.tipo]?.label || conta.tipo}
                    </span>

                    <button
                      onClick={() => handleOpenEditConta(conta)}
                      className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Editar Conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a conta "${conta.nome}"?`)) {
                          deleteConta(conta.id);
                        }
                      }}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Excluir Conta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-end justify-between pl-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Saldo Calculado em Tempo Real
                    </span>
                    <p
                      className={`text-lg font-bold font-mono-num ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatMoney(saldoAtual)}
                    </p>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    Inicial: R$ {conta.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CARTÕES DE CRÉDITO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Cartões de Crédito
              </h2>
              <p className="text-[11px] text-zinc-400">
                Mês atual, faturas vigentes, dados protegidos por PIN e alertas
              </p>
            </div>
          </div>

          <button
            id="btn-add-cartao"
            onClick={handleOpenNewCartao}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>

        {/* List of Credit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cartoes.map((cartao) => {
            const faturaAtual = getFaturaAtualCartao(cartao.id);
            const totalGastoAcumulado = getTotalGastoCartao(cartao.id);
            const limiteDisponivel = getLimiteDisponivelCartao(cartao);
            const usagePercent =
              cartao.limite_total > 0 ? (faturaAtual / cartao.limite_total) * 100 : 0;

            const dueStatus = getCardDueStatus(cartao.dia_vencimento);
            const isUnlocked = unlockedCards[cartao.id];

            // Card credentials
            const numCartao = cartao.numero_cartao || '4532 7810 9921 5193';
            const expCartao = cartao.data_expiracao || '12/29';
            const codCompra = cartao.codigo_compra || '508';
            const last4 = numCartao.replace(/\s/g, '').slice(-4);

            return (
              <div
                key={cartao.id}
                id={`card-credito-${cartao.id}`}
                className={`bg-zinc-950 border rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4.5 transition-all ${
                  dueStatus.isDueSoon
                    ? 'border-rose-500/80 ring-2 ring-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* 🚨 BLINKING DUE DATE BADGE (QUANDO FALTAR 2 DIAS) */}
                {dueStatus.isDueSoon && (
                  <div className="bg-rose-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center justify-between shadow-lg">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
                      ⚠️ VENCE EM {dueStatus.diffDays === 0 ? 'HOJE' : `${dueStatus.diffDays} DIAS`}!
                    </span>
                    <span className="font-mono text-[9px] lowercase opacity-90">alerta no celular ativo</span>
                  </div>
                )}

                {/* VISUAL CARD TOP (Exact matching the user screenshot) */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Golden Chip */}
                    <div className="w-10 h-7 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 rounded-lg border border-amber-300/60 flex items-center justify-center shadow-md shrink-0">
                      <div className="w-6 h-4 border border-amber-900/40 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="bg-amber-800/20 rounded-xs" />
                        <div className="bg-amber-800/20 rounded-xs" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-zinc-100 tracking-wide uppercase">
                        {cartao.nome}
                      </h3>
                      <span className="text-[11px] text-zinc-400 font-mono tracking-wider uppercase block">
                        {cartao.bandeira} PLATINUM/BLACK
                      </span>
                    </div>
                  </div>

                  {/* Top Action Buttons (EDITAR CARTAO, PAGAR FATURA, EXCLUIR) */}
                  <div className="flex items-center gap-1.5">
                    {/* BOTÃO EDITAR CARTÃO SOLICITADO */}
                    <button
                      id={`btn-editar-cartao-${cartao.id}`}
                      type="button"
                      onClick={() => handleOpenEditCartao(cartao)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                      title="Editar dados e limites deste cartão"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Editar</span>
                    </button>

                    {/* BOTÃO PAGAR FATURA */}
                    <button
                      id={`btn-pagar-fatura-${cartao.id}`}
                      type="button"
                      onClick={() => handleOpenPagarFatura(cartao)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                      title="Pagar fatura e restabelecer o limite disponível"
                    >
                      Pagar Fatura
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja excluir o cartão "${cartao.nome}"?`)) {
                          deleteCartao(cartao.id);
                        }
                      }}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
                      title="Excluir Cartão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* MÊS ATUAL E VALOR DA FATURA VIGENTE (EDITÁVEL) */}
                <div className="space-y-2 relative z-10 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-300 font-medium">
                        Fatura Vigente ({currentMonthFormatted}/{currentYear}):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickFatura(cartao)}
                        className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 border border-zinc-700 transition-colors"
                        title="Editar valor da fatura manualmente"
                      >
                        <Edit2 className="w-2.5 h-2.5 text-yellow-400" />
                        <span>Editar</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickFatura(cartao)}
                      className="font-bold text-rose-400 font-mono-num text-base tracking-tight hover:underline cursor-pointer flex items-center gap-1"
                      title="Clique para editar o valor da fatura"
                    >
                      <span>{formatMoney(faturaAtual)}</span>
                    </button>
                  </div>

                  {/* Limit Progress Bar */}
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        usagePercent > 80
                          ? 'bg-rose-500'
                          : usagePercent > 50
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, usagePercent))}%` }}
                    />
                  </div>

                  {/* Disponível, Total e Valor Já Gasto */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-400 font-mono pt-0.5">
                    <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 block uppercase">Limite Disponível</span>
                      <span className="text-emerald-400 font-bold">{formatMoney(limiteDisponivel)}</span>
                    </div>

                    <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 block uppercase">Limite Total</span>
                      <span className="text-zinc-200 font-bold">{formatMoney(cartao.limite_total)}</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-yellow-950/20 p-1.5 rounded-lg border border-yellow-500/20">
                      <span className="text-[10px] text-yellow-500 block uppercase">Já Gastei no Total</span>
                      <span className="text-yellow-400 font-bold">{formatMoney(totalGastoAcumulado)}</span>
                    </div>
                  </div>
                </div>

                {/* CARD DATES FOOTER (Melhor Dia de Compra & Vencimento da Fatura) */}
                <div className="pt-2 grid grid-cols-2 gap-2.5 text-xs relative z-10">
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/70">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Melhor Dia de Compra</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      Dia {cartao.melhor_dia_compra}
                    </span>
                  </div>

                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/70 text-right">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">Vencimento da Fatura</span>
                    <span className="text-sm font-bold text-yellow-400 font-mono">
                      Dia {cartao.dia_vencimento}
                    </span>
                  </div>
                </div>

                {/* 🔒 SENSITIVE CARD DETAILS SECTION (PROTEGIDO POR PIN 1602) */}
                <div className="pt-2 border-t border-zinc-900 relative z-10">
                  {!isUnlocked ? (
                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">
                            Número, Validade & Cód. Compra
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            •••• •••• •••• {last4} | Exp: ••/•• | CVV: •••
                          </p>
                        </div>
                      </div>

                      <button
                        id={`btn-unlock-pin-${cartao.id}`}
                        type="button"
                        onClick={() => handleOpenPinModal(cartao)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold text-xs transition-all hover:scale-105"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Ver Dados (PIN)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <Unlock className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Cartão Desbloqueado (PIN 1602)
                          </span>
                        </div>
                        <button
                          onClick={() => handleLockCard(cartao.id)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Bloquear</span>
                        </button>
                      </div>

                      {/* Card Number Full */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          Número do Cartão (16 Dígitos)
                        </span>
                        <div className="flex items-center justify-between bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800">
                          <span className="text-sm font-bold font-mono tracking-widest text-zinc-100">
                            {numCartao}
                          </span>
                          <button
                            onClick={() => handleCopy(numCartao.replace(/\s/g, ''), `num-${cartao.id}`)}
                            className="p-1 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                            title="Copiar número do cartão"
                          >
                            {copiedField === `num-${cartao.id}` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expiration and CVV Row */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                            Data de Expiração
                          </span>
                          <div className="flex items-center justify-between bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <span className="text-xs font-bold font-mono text-zinc-100">{expCartao}</span>
                            <button
                              onClick={() => handleCopy(expCartao, `exp-${cartao.id}`)}
                              className="p-1 rounded text-zinc-400 hover:text-emerald-400"
                              title="Copiar validade"
                            >
                              {copiedField === `exp-${cartao.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                            Cód. Compra (CVV)
                          </span>
                          <div className="flex items-center justify-between bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <span className="text-xs font-bold font-mono text-yellow-400">{codCompra}</span>
                            <button
                              onClick={() => handleCopy(codCompra, `cvv-${cartao.id}`)}
                              className="p-1 rounded text-zinc-400 hover:text-emerald-400"
                              title="Copiar código de compra"
                            >
                              {copiedField === `cvv-${cartao.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔐 MODAL DE PIN DIGITÁVEL (PIN: 1602) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xs shadow-2xl p-6 space-y-5 text-center relative">
            <button
              onClick={() => {
                setIsPinModalOpen(false);
                setEnteredPin('');
                setPinTargetCard(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100">Digite o PIN de Segurança</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {pinTargetCard ? pinTargetCard.nome : 'Cartão de Crédito'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                PIN Master: 1602
              </span>
            </div>

            {/* 4 MASKED PIN DOTS */}
            <div className={`flex justify-center items-center gap-3 py-2 ${pinError ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3].map((index) => {
                const filled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinError
                        ? 'border-rose-500 bg-rose-500/40'
                        : filled
                        ? 'border-yellow-400 bg-yellow-400 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-medium">PIN incorreto! Digite 1602.</p>
            )}

            {/* DIALPAD NUMÉRICO TÁTIL */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinPress(digit)}
                  className="h-12 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 active:bg-zinc-800 text-lg font-bold text-zinc-100 font-mono transition-all hover:scale-105"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handlePinClear}
                className="h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all hover:scale-105"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handlePinPress('0')}
                className="h-12 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 active:bg-zinc-800 text-lg font-bold text-zinc-100 font-mono transition-all hover:scale-105"
              >
                0
              </button>

              <button
                type="button"
                onClick={handlePinBackspace}
                className="h-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-all hover:scale-105"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA / EDITAR CONTA BANCÁRIA */}
      {isContaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">
                {editingContaId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
              </h3>
              <button
                onClick={() => setIsContaModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConta} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Nome de Identificação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank PJ Operacional / Itaú PF"
                  value={contaNome}
                  onChange={(e) => setContaNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Instituição Financeira</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Itaú, Inter, Bradesco, Dinheiro em Espécie"
                  value={contaInstituicao}
                  onChange={(e) => setContaInstituicao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Tipo de Conta</label>
                  <select
                    value={contaTipo}
                    onChange={(e) => setContaTipo(e.target.value as TipoConta)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pj">Conta PJ / Empresarial</option>
                    <option value="corrente">Conta Corrente PF</option>
                    <option value="investimento">Investimentos</option>
                    <option value="poupanca">Poupança</option>
                    <option value="caixa">Caixa / Cofre Físico</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Saldo Inicial (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={contaSaldoInicial}
                    onChange={(e) => setContaSaldoInicial(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsContaModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR CARTÃO DE CRÉDITO COM CAMPOS SENSÍVEIS */}
      {isCartaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">
                {editingCartaoId ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
              </h3>
              <button
                onClick={() => setIsCartaoModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCartao} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ITAU / Nubank Ultravioleta Black"
                  value={cartaoNome}
                  onChange={(e) => setCartaoNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Bandeira</label>
                  <select
                    value={cartaoBandeira}
                    onChange={(e) => setCartaoBandeira(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">American Express</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Limite Total (R$)</label>
                  <input
                    type="text"
                    required
                    placeholder="20.000,00"
                    value={cartaoLimite}
                    onChange={(e) => setCartaoLimite(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Melhor Dia Compra</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cartaoMelhorDia}
                    onChange={(e) => setCartaoMelhorDia(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Dia Vencimento Fatura</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={cartaoVencimento}
                    onChange={(e) => setCartaoVencimento(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* VALOR DA FATURA ATUAL & VALOR TOTAL GASTO ACUMULADO */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-yellow-500/30 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                  <Receipt className="w-4 h-4" />
                  <span>Fatura Vigente & Total Já Gasto</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">
                      Fatura Vigente (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={cartaoFaturaAtual}
                      onChange={(e) => setCartaoFaturaAtual(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                    />
                    <span className="text-[10px] text-zinc-500 block">Editável manualmente</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">
                      Total Já Gasto (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={cartaoTotalGasto}
                      onChange={(e) => setCartaoTotalGasto(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/40 rounded-xl text-xs font-bold text-yellow-400 font-mono focus:outline-none focus:border-yellow-500"
                    />
                    <span className="text-[10px] text-zinc-500 block">Acumulado total</span>
                  </div>
                </div>
              </div>

              {/* CAMPOS SENSÍVEIS DO CARTÃO */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dados do Cartão (Protegidos com PIN 1602)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Número do Cartão (16 dígitos)</label>
                  <input
                    type="text"
                    placeholder="4532 7810 9921 5193"
                    value={cartaoNumero}
                    onChange={(e) => setCartaoNumero(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Data de Expiração (MM/AA)</label>
                    <input
                      type="text"
                      placeholder="12/29"
                      value={cartaoExpiracao}
                      onChange={(e) => setCartaoExpiracao(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Cód. de Compra (CVV)</label>
                    <input
                      type="text"
                      placeholder="508"
                      maxLength={4}
                      value={cartaoCodigoCompra}
                      onChange={(e) => setCartaoCodigoCompra(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartaoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs shadow-lg shadow-yellow-950/30"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE RÁPIDO DE FATURA & TOTAL GASTO */}
      {isQuickFaturaOpen && quickFaturaCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Editar Fatura & Total Gasto</h3>
                <p className="text-xs text-yellow-400 font-bold">{quickFaturaCard.nome}</p>
              </div>
              <button
                onClick={() => setIsQuickFaturaOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickFatura} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Valor da Fatura Vigente (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={quickFaturaVal}
                  onChange={(e) => setQuickFaturaVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-rose-500/50 rounded-xl text-base font-bold text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-zinc-400">
                  O limite disponível se ajustará automaticamente (Limite - Fatura).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Valor Total Já Gasto Acumulado (R$)
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={quickTotalGastoVal}
                  onChange={(e) => setQuickTotalGastoVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-yellow-500/50 rounded-xl text-base font-bold text-yellow-400 font-mono focus:outline-none focus:border-yellow-500"
                />
                <span className="text-[10px] text-zinc-400">
                  Valor total histórico que você já gastou neste cartão.
                </span>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                💡 Ao pagar faturas, o limite disponível voltará com o valor pago automaticamente.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickFaturaOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs shadow-lg shadow-yellow-950/30"
                >
                  Salvar Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR FATURA */}
      {isPagarFaturaOpen && selectedCartaoFatura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Liquidar Fatura do Cartão</h3>
                <p className="text-xs text-zinc-400">{selectedCartaoFatura.nome}</p>
              </div>
              <button
                onClick={() => setIsPagarFaturaOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPagarFatura} className="space-y-4">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Atual da Fatura:</span>
                <span className="font-bold text-rose-400 font-mono-num text-sm">
                  {formatMoney(getFaturaAtualCartao(selectedCartaoFatura.id))}
                </span>
              </div>

              {/* AVISO IMPORTANTE: RESTAURAÇÃO DO LIMITE */}
              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Ao pagar a fatura, o limite disponível voltará imediatamente com o valor pago.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Valor a Pagar (R$)</label>
                <input
                  type="text"
                  required
                  value={faturaValorPagar}
                  onChange={(e) => setFaturaValorPagar(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Debitar da Conta Bancária</label>
                <select
                  value={faturaContaOrigem}
                  onChange={(e) => setFaturaContaOrigem(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (Saldo: R$ {getSaldoConta(c.id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPagarFaturaOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
                >
                  Confirmar Pagamento & Liberar Limite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
