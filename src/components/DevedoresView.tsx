import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Devedor, StatusDevedor } from '../types';
import {
  generateInstallmentSchedule,
  buildWhatsAppDevedorMessage,
  ScheduledInstallment,
  formatBRDate,
} from '../utils/installmentSchedule';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ArrowUpRight,
  TrendingUp,
  Search,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Check,
  Send,
  Sparkles,
  Receipt,
  Car,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function DevedoresView() {
  const { user } = useAuth();
  const {
    devedores,
    contas,
    addDevedor,
    deleteDevedorItem,
    receberParcelaDevedor,
    isPrivacyMode,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusDevedor>('todos');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedDevedor, setSelectedDevedor] = useState<Devedor | null>(null);
  const [expandedParcelas, setExpandedParcelas] = useState<Record<string, boolean>>({});

  // Form New/Edit Devedor state
  const [editingDevedorId, setEditingDevedorId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [itemServico, setItemServico] = useState('');
  const [valorParcelaStr, setValorParcelaStr] = useState('140,00');
  const [qtdParcelas, setQtdParcelas] = useState(300);
  const [valorTotalStr, setValorTotalStr] = useState('42.000,00');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [contaDestinoId, setContaDestinoId] = useState(contas[0]?.id || '');

  // Form Registrar Pagamento state
  const [valorReceberStr, setValorReceberStr] = useState('');
  const [qtdParcelasPagar, setQtdParcelasPagar] = useState(1);
  const [contaRecebimentoId, setContaRecebimentoId] = useState(contas[0]?.id || '');
  const [dataPagamentoRecebida, setDataPagamentoRecebida] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [observacaoRecebimento, setObservacaoRecebimento] = useState('');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);

  // Receipt Modal state (for preview & copy)
  const [receiptData, setReceiptData] = useState<{
    devedor: Devedor;
    dataPagamento: string;
    valorPago: number;
    parcelaNum: number;
    totalParcelas: number;
    parcelasRestantes: number;
    whatsappText: string;
  } | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const formatMoney = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Helper to parse currency string
  const parseMoney = (valStr: string): number => {
    if (!valStr) return 0;
    const clean = valStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  // Helper to format number to BRL input string
  const formatInputMoney = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format Date DD/MM/YYYY
  const formatDateBR = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Auto Calculation Handlers for Create/Edit Modal
  const handleParcelaChange = (valStr: string) => {
    setValorParcelaStr(valStr);
    const parcNum = parseMoney(valStr);
    const total = parcNum * Math.max(1, Number(qtdParcelas) || 1);
    setValorTotalStr(formatInputMoney(total));
  };

  const handleQtdParcelasChange = (qtd: number) => {
    const safeQtd = Math.max(1, qtd);
    setQtdParcelas(safeQtd);
    const parcNum = parseMoney(valorParcelaStr);
    if (parcNum > 0) {
      const total = parcNum * safeQtd;
      setValorTotalStr(formatInputMoney(total));
    } else {
      const totalNum = parseMoney(valorTotalStr);
      if (totalNum > 0) {
        setValorParcelaStr(formatInputMoney(totalNum / safeQtd));
      }
    }
  };

  const handleTotalChange = (valStr: string) => {
    setValorTotalStr(valStr);
    const totalNum = parseMoney(valStr);
    const safeQtd = Math.max(1, Number(qtdParcelas) || 1);
    if (safeQtd > 0) {
      const parc = totalNum / safeQtd;
      setValorParcelaStr(formatInputMoney(parc));
    }
  };

  // Open Create Modal
  const handleOpenNew = () => {
    setEditingDevedorId(null);
    setNome('MAICON');
    setTelefone('(11) 98888-7777');
    setItemServico('ZAFIRA PRATA');
    setValorParcelaStr('140,00');
    setQtdParcelas(300);
    setValorTotalStr('42.000,00');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setContaDestinoId(contas[0]?.id || '');
    setIsNewModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dev: Devedor) => {
    setEditingDevedorId(dev.id);
    setNome(dev.nome);
    setTelefone(dev.telefone || '');
    setItemServico(dev.item_servico);
    const parcVal = dev.valor_parcela || (dev.valor_total / Math.max(1, dev.qtd_parcelas));
    setValorParcelaStr(formatInputMoney(parcVal));
    setQtdParcelas(dev.qtd_parcelas);
    setValorTotalStr(formatInputMoney(dev.valor_total));
    setDataInicio(dev.data_inicio || new Date().toISOString().split('T')[0]);
    setContaDestinoId(dev.conta_destino_id || contas[0]?.id || '');
    setIsNewModalOpen(true);
  };

  // Save Devedor (Create or Edit)
  const handleSaveDevedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nome.trim() || !itemServico.trim()) return;

    const valorTotal = parseMoney(valorTotalStr);
    const valorParc = parseMoney(valorParcelaStr);
    const safeQtd = Math.max(1, Number(qtdParcelas) || 1);

    const existing = editingDevedorId ? devedores.find((d) => d.id === editingDevedorId) : null;

    await addDevedor({
      id: editingDevedorId || undefined,
      user_id: user.id,
      nome: nome.trim().toUpperCase(),
      telefone: telefone.trim() || undefined,
      item_servico: itemServico.trim().toUpperCase(),
      valor_total: valorTotal,
      valor_parcela: valorParc > 0 ? valorParc : valorTotal / safeQtd,
      qtd_parcelas: safeQtd,
      parcelas_pagas: existing ? existing.parcelas_pagas : 0,
      valor_pago: existing ? existing.valor_pago : 0,
      data_inicio: dataInicio,
      conta_destino_id: contaDestinoId || contas[0]?.id,
      status: existing ? existing.status : 'pendente',
    });

    setIsNewModalOpen(false);
  };

  // WhatsApp Message Generator using Business Schedule and 10% Late Fee Rules
  const generateWhatsAppMessage = (
    dev: Devedor,
    valorPago: number,
    dataPgto: string,
    parcelaNumAlvo: number
  ): string => {
    const unitParc = dev.valor_parcela || (dev.valor_total / Math.max(1, dev.qtd_parcelas));
    const schedule = generateInstallmentSchedule(
      dev.data_inicio || dataPgto,
      dev.qtd_parcelas,
      dev.parcelas_pagas,
      unitParc
    );

    const item = schedule.find((s) => s.numero === parcelaNumAlvo) || schedule[0];

    return buildWhatsAppDevedorMessage({
      nome: dev.nome,
      itemServico: dev.item_servico,
      dataPagamento: dataPgto,
      valorPago: valorPago,
      parcelaAtualNum: parcelaNumAlvo,
      totalParcelas: dev.qtd_parcelas,
      dataReferenciaTexto: item ? item.dataReferenciaDescricao : formatBRDate(dataPgto),
      isSextaFeira: item ? item.isSextaFeira : false,
      proximaCobrancaData: item ? item.proximoVencimentoFormatado : formatBRDate(dataPgto),
      diasAtraso: item && item.isAtrasada ? item.diasAtraso : 0,
      multaAtraso: item && item.isAtrasada ? item.multaAtraso : 0,
    });
  };

  // Open WhatsApp directly with phone & message
  const triggerWhatsApp = (telefone: string | undefined, message: string) => {
    const cleanPhone = (telefone || '').replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55')) {
      finalPhone = `55${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(message);
    const url = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank');
  };

  // Open Payment Modal
  const handleOpenRegistrarPagamento = (dev: Devedor) => {
    setSelectedDevedor(dev);
    const unitParc = dev.valor_parcela || (dev.valor_total / Math.max(1, dev.qtd_parcelas));
    const saldoRestante = Math.max(0, dev.valor_total - dev.valor_pago);
    const valorSugerido = Math.min(unitParc, saldoRestante);

    setQtdParcelasPagar(1);
    setValorReceberStr(formatInputMoney(valorSugerido));
    setDataPagamentoRecebida(new Date().toISOString().split('T')[0]);
    setContaRecebimentoId(dev.conta_destino_id || contas[0]?.id || '');
    setObservacaoRecebimento(`Recebimento de prestação referente a ${dev.item_servico}`);
    setAutoOpenWhatsApp(true);
    setIsPayModalOpen(true);
  };

  // Quick select parcelas in payment modal
  const handleSelectQtdParcelasPagar = (qtd: number) => {
    if (!selectedDevedor) return;
    setQtdParcelasPagar(qtd);
    const unitParc =
      selectedDevedor.valor_parcela ||
      selectedDevedor.valor_total / Math.max(1, selectedDevedor.qtd_parcelas);
    const saldoRestante = Math.max(0, selectedDevedor.valor_total - selectedDevedor.valor_pago);
    const total = Math.min(unitParc * qtd, saldoRestante);
    setValorReceberStr(formatInputMoney(total));
  };

  // Confirm Payment & optionally dispatch WhatsApp
  const handleConfirmPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevedor) return;

    const valorNum = parseMoney(valorReceberStr);
    if (valorNum <= 0) return;

    const dev = selectedDevedor;
    const unitParc = dev.valor_parcela || (dev.valor_total / Math.max(1, dev.qtd_parcelas));
    const parcelasPagasAdd = Math.max(1, Math.round(valorNum / unitParc));
    const novaQtdPagas = Math.min(dev.qtd_parcelas, dev.parcelas_pagas + parcelasPagasAdd);

    await receberParcelaDevedor(
      dev.id,
      valorNum,
      contaRecebimentoId,
      observacaoRecebimento
    );

    setIsPayModalOpen(false);

    const waMsg = generateWhatsAppMessage(
      dev,
      valorNum,
      dataPagamentoRecebida,
      novaQtdPagas
    );

    if (autoOpenWhatsApp && dev.telefone) {
      triggerWhatsApp(dev.telefone, waMsg);
    } else {
      // Show receipt modal preview
      setReceiptData({
        devedor: dev,
        dataPagamento: dataPagamentoRecebida,
        valorPago: valorNum,
        parcelaNum: novaQtdPagas,
        totalParcelas: dev.qtd_parcelas,
        parcelasRestantes: Math.max(0, dev.qtd_parcelas - novaQtdPagas),
        whatsappText: waMsg,
      });
      setIsReceiptModalOpen(true);
    }
  };

  // Click on a specific paid installment to trigger WhatsApp
  const handleClickPaidInstallment = (dev: Devedor, parcelaIndex: number) => {
    const unitParc = dev.valor_parcela || (dev.valor_total / Math.max(1, dev.qtd_parcelas));
    const dataPgto = dev.data_inicio || new Date().toISOString().split('T')[0];

    const msg = generateWhatsAppMessage(
      dev,
      unitParc,
      dataPgto,
      parcelaIndex
    );

    setReceiptData({
      devedor: dev,
      dataPagamento: dataPgto,
      valorPago: unitParc,
      parcelaNum: parcelaIndex,
      totalParcelas: dev.qtd_parcelas,
      parcelasRestantes: Math.max(0, dev.qtd_parcelas - dev.parcelas_pagas),
      whatsappText: msg,
    });

    // Directly open WhatsApp
    if (dev.telefone) {
      triggerWhatsApp(dev.telefone, msg);
    } else {
      setIsReceiptModalOpen(true);
    }
  };

  // Toggle accordion of parcelas list
  const toggleParcelasAccordion = (devId: string) => {
    setExpandedParcelas((prev) => ({
      ...prev,
      [devId]: !prev[devId],
    }));
  };

  // Filter devedores
  const filteredDevedores = devedores.filter((d) => {
    const matchSearch =
      d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.item_servico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalEmAberto = devedores
    .filter((d) => d.status !== 'quitado')
    .reduce((acc, d) => acc + Math.max(0, d.valor_total - d.valor_pago), 0);

  const totalJaRecebido = devedores.reduce((acc, d) => acc + (d.valor_pago || 0), 0);

  return (
    <div id="devedores-view" className="space-y-6 pb-24">
      {/* Header & New Devedor Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Contas a Receber (Devedores)
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cálculo automático de parcelas, controle de valor pago / a pagar e envio de recibo no WhatsApp
          </p>
        </div>

        <button
          id="btn-add-devedor"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30 transition-all cursor-pointer hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Devedor (Conta a Receber)</span>
        </button>
      </div>

      {/* Summary KPI Mini-Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div>
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
            Saldo a Receber (Falta Pagar)
          </span>
          <p className="text-xl font-bold font-mono-num text-rose-400 mt-0.5">
            {formatMoney(totalEmAberto)}
          </p>
          <span className="text-[10px] text-zinc-500">
            {devedores.filter((d) => d.status !== 'quitado').length} contratos ativos em cobrança
          </span>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
            Total Já Pago & Liquidado
          </span>
          <p className="text-xl font-bold font-mono-num text-emerald-400 mt-0.5">
            {formatMoney(totalJaRecebido)}
          </p>
          <span className="text-[10px] text-emerald-500">
            Creditado nas contas bancárias cadastradas
          </span>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
            Integração WhatsApp
          </span>
          <p className="text-xs font-bold text-zinc-200 mt-1 flex items-center gap-1.5 text-emerald-400">
            <MessageCircle className="w-4 h-4" />
            <span>Envio de Comprovante Automático</span>
          </p>
          <span className="text-[10px] text-zinc-500">
            Dispara data, valor, pagas e restantes
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
            id="input-search-devedores"
            type="text"
            placeholder="Buscar por devedor ou item vendido (ex: MAICON, ZAFIRA PRATA)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'pendente', 'parcial', 'quitado'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st === 'todos' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Devedores Cards List */}
      {filteredDevedores.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-400">Nenhum devedor encontrado nesta busca.</p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
          >
            + Cadastrar Devedor (Ex: MAICON - ZAFIRA PRATA)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDevedores.map((dev) => {
            const saldoRestante = Math.max(0, dev.valor_total - dev.valor_pago);
            const percentPago =
              dev.valor_total > 0 ? (dev.valor_pago / dev.valor_total) * 100 : 0;
            const isQuitado = dev.status === 'quitado' || saldoRestante === 0;
            const valorUnitario =
              dev.valor_parcela || dev.valor_total / Math.max(1, dev.qtd_parcelas);
            const parcelasRestantes = Math.max(0, dev.qtd_parcelas - dev.parcelas_pagas);
            const isExpanded = !!expandedParcelas[dev.id];

            // Generate full schedule with Monday-Friday rules and 10% daily late fees
            const schedule = generateInstallmentSchedule(
              dev.data_inicio || new Date().toISOString().split('T')[0],
              dev.qtd_parcelas,
              dev.parcelas_pagas,
              valorUnitario
            );
            const parcelasAtrasadas = schedule.filter((s) => s.isAtrasada);
            const temAtraso = parcelasAtrasadas.length > 0;
            const totalMultaAtraso = parcelasAtrasadas.reduce((acc, s) => acc + s.multaAtraso, 0);

            const statusColors: Record<StatusDevedor, { bg: string; text: string; label: string }> = {
              quitado: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: '100% Quitado' },
              parcial: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'Em Andamento' },
              pendente: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-300', label: 'Pendente' },
              atrasado: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', label: 'Atrasado' },
            };

            const currentStatus = temAtraso
              ? statusColors.atrasado
              : statusColors[dev.status] || statusColors.pendente;

            return (
              <div
                key={dev.id}
                id={`card-devedor-${dev.id}`}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-zinc-700 transition-all relative overflow-hidden"
              >
                {/* Visual accent border on top */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isQuitado
                      ? 'bg-emerald-500'
                      : temAtraso
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500'
                  }`}
                />

                {/* Card Top: Client & Item Info + Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-zinc-100 tracking-wide uppercase">
                        {dev.nome}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.text}`}
                      >
                        {temAtraso ? `Atrasado (${parcelasAtrasadas.length} pendentes)` : currentStatus.label}
                      </span>
                    </div>

                    {/* Item / Serviço */}
                    <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold mt-1">
                      <Tag className="w-3.5 h-3.5 text-yellow-500" />
                      <span>{dev.item_servico}</span>
                      {dev.telefone && (
                        <span className="text-zinc-400 font-normal font-mono text-[11px] ml-2">
                          • {dev.telefone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Header Actions (Editar, WhatsApp Direto, Excluir) */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {/* Direct WhatsApp Button */}
                    {dev.telefone && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateWhatsAppMessage(
                            dev,
                            valorUnitario,
                            dev.data_inicio || new Date().toISOString().split('T')[0],
                            Math.max(1, dev.parcelas_pagas)
                          );
                          triggerWhatsApp(dev.telefone, msg);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-all hover:scale-105"
                        title="Enviar comprovante completo no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

                    {/* Botão Editar Devedor */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dev)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-all hover:scale-105"
                      title="Editar Devedor e Parcelas"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Editar</span>
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja excluir o registro de "${dev.nome}"?`)) {
                          deleteDevedorItem(dev.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Excluir Devedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ⚠️ REGRA DE ATRASO & MULTA 10%/DIA + PAGAMENTOS DE SEGUNDA A SEXTA */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px] leading-relaxed">
                    <p className="font-semibold text-amber-200">
                      ⚠️ Ao atraso, multa de 10% por dia de atraso.
                    </p>
                    <p className="text-amber-300/90">
                      Os pagamentos são de <strong>Segunda a Sexta</strong>. Ao acertar na <strong>Sexta-feira</strong>, já cobre Sábado e Domingo (ficando devendo somente a de Segunda-feira).
                    </p>
                    <p className="text-amber-400 font-medium">
                      • Somente estará em dia quando acertar as parcelas atrasadas com a data que atrasou.
                    </p>
                  </div>
                </div>

                {/* ALERTA SE HOUVER PARCELA EM ATRASO */}
                {temAtraso && (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-200">
                        🚨 Constam {parcelasAtrasadas.length} parcela(s) em atraso!
                      </p>
                      <p className="text-[11px] text-rose-300 mt-0.5">
                        Multa acumulada (10%/dia): <span className="font-bold text-rose-100">{formatMoney(totalMultaAtraso)}</span>. A conta só voltará ao status 'em dia' após quitação das pendências.
                      </p>
                    </div>
                  </div>
                )}

                {/* 📊 SEÇÃO: VALOR DA PARCELA, TOTAL, VALOR PAGO E O QUE FALTA PAGAR */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800/90 text-center">
                  {/* Valor da Parcela Unitária */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                      Valor da Parcela
                    </span>
                    <span className="text-sm sm:text-base font-bold text-yellow-400 font-mono-num block">
                      {formatMoney(valorUnitario)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      x {dev.qtd_parcelas} parcelas
                    </span>
                  </div>

                  {/* Valor Total Contrato */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                      Valor Total
                    </span>
                    <span className="text-sm sm:text-base font-bold text-zinc-200 font-mono-num block">
                      {formatMoney(dev.valor_total)}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Total Contratado
                    </span>
                  </div>

                  {/* VALOR PAGO */}
                  <div className="space-y-0.5 bg-emerald-950/30 rounded-xl p-1.5 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                      Valor Pago
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 font-mono-num block">
                      {formatMoney(dev.valor_pago)}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-mono font-semibold">
                      {dev.parcelas_pagas} de {dev.qtd_parcelas} pagas
                    </span>
                  </div>

                  {/* O QUE FALTA PAGAR */}
                  <div className="space-y-0.5 bg-rose-950/30 rounded-xl p-1.5 border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                      Falta Pagar
                    </span>
                    <span className="text-sm sm:text-base font-black text-rose-400 font-mono-num block">
                      {formatMoney(saldoRestante)}
                    </span>
                    <span className="text-[10px] text-rose-300 font-mono font-semibold">
                      Faltam {parcelasRestantes} parcelas
                    </span>
                  </div>
                </div>

                {/* Progress Bar with Exact Percentage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-medium">
                      Progresso de Quitação: {dev.parcelas_pagas}/{dev.qtd_parcelas} parcelas
                    </span>
                    <span className={`font-bold ${isQuitado ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {percentPago.toFixed(1)}% Quitado
                    </span>
                  </div>

                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isQuitado
                          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                          : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-yellow-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentPago))}%` }}
                    />
                  </div>
                </div>

                {/* Primary Action: Registrar Pagamento de Parcela */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {!isQuitado ? (
                    <button
                      id={`btn-pay-dev-${dev.id}`}
                      type="button"
                      onClick={() => handleOpenRegistrarPagamento(dev)}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Registrar Pagamento de Parcela (+ WhatsApp com Data de Ref.)</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 py-2.5 rounded-xl shadow-inner">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Contrato 100% Quitado & Todas as Parcelas Recebidas</span>
                    </div>
                  )}

                  {/* Toggle Accordion: Prestações do Contrato */}
                  <button
                    type="button"
                    onClick={() => toggleParcelasAccordion(dev.id)}
                    className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver Prestações ({dev.qtd_parcelas})</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* 📋 EXPANDABLE ACCORDION: PRESTAÇÕES COM DATA DE REFERÊNCIA & MULTAS */}
                {isExpanded && (
                  <div className="pt-3 border-t border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                        <Receipt className="w-4 h-4 text-emerald-400" />
                        <span>Cronograma de Prestações ({dev.nome} - {dev.item_servico})</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Clique em qualquer prestação paga para reenviar o comprovante no WhatsApp
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {schedule.map((item) => {
                        return (
                          <div
                            key={item.numero}
                            onClick={() => {
                              if (item.isPaga) {
                                handleClickPaidInstallment(dev, item.numero);
                              } else {
                                handleOpenRegistrarPagamento(dev);
                              }
                            }}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all ${
                              item.isPaga
                                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/30'
                                : item.isAtrasada
                                ? 'bg-rose-950/25 border-rose-500/40 hover:border-rose-500/70'
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                                  item.isPaga
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : item.isAtrasada
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                #{item.numero}
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-zinc-100">
                                    Prestação {item.numero} de {dev.qtd_parcelas}
                                  </span>

                                  {/* STATUS BADGE */}
                                  {item.isPaga ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      PAGA
                                    </span>
                                  ) : item.isAtrasada ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      EM ATRASO ({item.diasAtraso}d)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-semibold flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      A PAGAR (EM DIA)
                                    </span>
                                  )}
                                </div>

                                {/* DATA DE REFERÊNCIA EXPLÍCITA SOLICITADA */}
                                <div className="text-[11px] text-zinc-300 font-mono flex items-center gap-1.5 flex-wrap">
                                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>
                                    Essa prestação é referente ao dia <strong>{item.dataVencimentoFormatada}</strong> ({item.diaSemanaNome})
                                  </span>
                                </div>

                                {/* AVISO DE SEXTA-FEIRA COBRINDO SÁBADO E DOMINGO */}
                                {item.isSextaFeira && (
                                  <div className="text-[10px] text-emerald-400 font-mono">
                                    📌 Sexta-feira: Acerto cobre até Domingo {item.dataCoberturaFimFormatada} (Próx: Segunda {item.proximoVencimentoFormatado})
                                  </div>
                                )}

                                {/* MULTA DE 10% SE ATRASADA */}
                                {item.isAtrasada && (
                                  <div className="text-[11px] text-rose-300 font-mono font-semibold">
                                    Multa de 10%/dia ({item.diasAtraso}d): +{formatMoney(item.multaAtraso)} • Total a Acertar: {formatMoney(item.valorComMulta)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* WhatsApp Button on Paid Installments */}
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              {item.isPaga ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClickPaidInstallment(dev, item.numero);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all hover:scale-105"
                                  title="Abrir WhatsApp com comprovante e data de referência"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRegistrarPagamento(dev);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                                >
                                  Pagar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 📝 MODAL: CADASTRAR / EDITAR DEVEDOR COM CÁLCULO AUTOMÁTICO DE VALOR TOTAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">
                  {editingDevedorId ? 'Editar Devedor / Contrato' : 'Cadastrar Devedor (Conta a Receber)'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDevedor} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Nome do Devedor / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MAICON / Carlos Fontes"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Item / Serviço Vendido</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ZAFIRA PRATA / Venda de Veículo"
                  value={itemServico}
                  onChange={(e) => setItemServico(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              {/* ⚡ CÁLCULO AUTOMÁTICO: VALOR DA PARCELA + QTD PARCELAS = VALOR TOTAL */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Cálculo Automático de Parcelas
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {qtdParcelas} x R$ {valorParcelaStr}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* VALOR DA PARCELA */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Valor da Parcela (R$)</label>
                    <input
                      type="text"
                      required
                      placeholder="140,00"
                      value={valorParcelaStr}
                      onChange={(e) => handleParcelaChange(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-emerald-500/40 rounded-xl text-xs font-bold text-yellow-400 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* QTD PARCELAS */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Qtd. Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      required
                      value={qtdParcelas}
                      onChange={(e) => handleQtdParcelasChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* VALOR TOTAL JÁ CALCULADO */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-medium text-zinc-300 flex justify-between">
                    <span>Valor Total (R$)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Cálculo Automático</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="42.000,00"
                    value={valorTotalStr}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-emerald-500/40 rounded-xl text-sm font-black text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* TELEFONE E DATA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(11) 98888-7777"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Data de Início</label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* CONTA BANCÁRIA PADRÃO */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Conta Padrão de Recebimento</label>
                <select
                  value={contaDestinoId}
                  onChange={(e) => setContaDestinoId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
                >
                  {editingDevedorId ? 'Salvar Alterações' : 'Cadastrar Devedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💰 MODAL: REGISTRAR PAGAMENTO DE PRESTAÇÃO & DISPARO DE WHATSAPP */}
      {isPayModalOpen && selectedDevedor && (() => {
        const unitParc =
          selectedDevedor.valor_parcela ||
          selectedDevedor.valor_total / Math.max(1, selectedDevedor.qtd_parcelas);
        const paySchedule = generateInstallmentSchedule(
          selectedDevedor.data_inicio || new Date().toISOString().split('T')[0],
          selectedDevedor.qtd_parcelas,
          selectedDevedor.parcelas_pagas,
          unitParc
        );
        const proximaParc =
          paySchedule.find((s) => !s.isPaga) ||
          paySchedule[paySchedule.length - 1] ||
          paySchedule[0];

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Registrar Pagamento de Prestação</h3>
                <p className="text-xs text-emerald-400 font-bold">
                  {selectedDevedor.nome} • {selectedDevedor.item_servico}
                </p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPagamento} className="space-y-4">
              {/* Resumo da Cobrança e Data de Referência (Saldo Restante Removido conforme solicitado) */}
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Contratado:</span>
                  <span className="text-zinc-200">{formatMoney(selectedDevedor.valor_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Prestações Pagas:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedDevedor.parcelas_pagas} de {selectedDevedor.qtd_parcelas} ({formatMoney(selectedDevedor.valor_pago)})
                  </span>
                </div>
                
                {/* DATA DE REFERÊNCIA EXPLÍCITA */}
                {proximaParc && (
                  <div className="border-t border-zinc-800/80 pt-2 space-y-1">
                    <div className="text-yellow-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span>Prestação #{proximaParc.numero}: Essa prestação é referente ao dia {proximaParc.dataVencimentoFormatada} ({proximaParc.diaSemanaNome})</span>
                    </div>
                    {proximaParc.isSextaFeira && (
                      <p className="text-[10px] text-emerald-400">
                        📌 Sexta-feira: Acerto cobre até Domingo {proximaParc.dataCoberturaFimFormatada} (Próxima: Segunda {proximaParc.proximoVencimentoFormatado})
                      </p>
                    )}
                    {proximaParc.isAtrasada && (
                      <p className="text-[10px] text-rose-400 font-bold">
                        ⚠️ Parcela em atraso ({proximaParc.diasAtraso}d). Multa (10%/dia): +{formatMoney(proximaParc.multaAtraso)}. Total: {formatMoney(proximaParc.valorComMulta)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Aviso da regra de atraso e dias úteis */}
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-0.5">
                <p className="font-semibold text-amber-200">
                  ⚠️ Ao atraso, multa de 10% por dia de atraso.
                </p>
                <p className="text-amber-300/80">
                  Os pagamentos são de Segunda a Sexta. Somente estará em dia quando acertar as atrasadas.
                </p>
              </div>

              {/* Botões Rápidos de Quantidade de Parcelas */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Quantas Prestações Recebidas?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSelectQtdParcelasPagar(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        qtdParcelasPagar === num
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {num} {num === 1 ? 'Parc.' : 'Parcs.'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor Recebido */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Valor Recebido (R$)</label>
                <input
                  type="text"
                  required
                  value={valorReceberStr}
                  onChange={(e) => setValorReceberStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-emerald-500/50 rounded-xl text-base font-black text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Data do Pagamento */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Data do Pagamento</label>
                <input
                  type="date"
                  required
                  value={dataPagamentoRecebida}
                  onChange={(e) => setDataPagamentoRecebida(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Conta Bancária Destino */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Creditar na Conta (Entrada Automática no Fluxo)
                </label>
                <select
                  value={contaRecebimentoId}
                  onChange={(e) => setContaRecebimentoId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.instituicao})
                    </option>
                  ))}
                </select>
              </div>

              {/* 📲 Opção de abrir WhatsApp imediatamente */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-200 font-semibold">
                    Abrir WhatsApp do cliente com o recibo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoOpenWhatsApp}
                  onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-zinc-900 border-zinc-700"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
                >
                  Confirmar & Enviar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* 📲 MODAL: PRÉVIA DO RECIBO / WHATSAPP */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-zinc-100">Recibo WhatsApp</h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {receiptData.whatsappText}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(receiptData.whatsappText);
                  setCopiedReceipt(true);
                  setTimeout(() => setCopiedReceipt(false), 2000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedReceipt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedReceipt ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerWhatsApp(receiptData.devedor.telefone, receiptData.whatsappText);
                  setIsReceiptModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
