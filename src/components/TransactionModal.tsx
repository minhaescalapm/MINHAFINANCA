import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { TipoTransacao } from '../types';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Landmark,
  Tag,
  FileText,
  DollarSign,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TipoTransacao;
}

const CATEGORIAS_ENTRADA = [
  'Venda de Carros',
  'Salário & Retirada',
  'Serviços & Consultoria',
  'Rendimento / Investimentos',
  'Venda de Imóveis',
  'Empréstimos Recebidos',
  'Outras Entradas',
];

const CATEGORIAS_SAIDA = [
  'Veículos & Frota',
  'Combustível & Transporte',
  'Alimentação & Negócios',
  'Imóveis & Aluguel',
  'Tecnologia & Softwares',
  'Fornecedores & Estoque',
  'Impostos & Tributos',
  'Lazer & Pessoal',
  'Saúde & Cuidados',
  'Fatura de Cartão',
  'Outras Saídas',
];

export function TransactionModal({
  isOpen,
  onClose,
  initialType = 'entrada',
}: TransactionModalProps) {
  const { user } = useAuth();
  const { contas, cartoes, addTransacao } = useFinance();

  const [tipo, setTipo] = useState<TipoTransacao>(initialType);
  const [descricao, setDescricao] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [categoria, setCategoria] = useState(
    initialType === 'entrada' ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0]
  );
  const [customCategoria, setCustomCategoria] = useState('');
  const [destinoTipo, setDestinoTipo] = useState<'conta' | 'cartao'>('conta');
  const [contaId, setContaId] = useState(contas[0]?.id || '');
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial type changes
  React.useEffect(() => {
    setTipo(initialType);
    setCategoria(initialType === 'entrada' ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0]);
    if (initialType === 'entrada') {
      setDestinoTipo('conta');
    }
  }, [initialType]);

  // Set default account/card if available
  React.useEffect(() => {
    if (contas.length > 0 && !contaId) setContaId(contas[0].id);
    if (cartoes.length > 0 && !cartaoId) setCartaoId(cartoes[0].id);
  }, [contas, cartoes, contaId, cartaoId]);

  if (!isOpen) return null;

  const handleTipoChange = (newTipo: TipoTransacao) => {
    setTipo(newTipo);
    setCategoria(newTipo === 'entrada' ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0]);
    if (newTipo === 'entrada') {
      setDestinoTipo('conta');
    }
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setValorStr('');
      return;
    }
    const num = parseFloat(raw) / 100;
    setValorStr(
      num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const parseValor = (str: string): number => {
    if (!str) return 0;
    const clean = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const valorNumerico = parseValor(valorStr);
    if (valorNumerico <= 0 || !descricao.trim()) return;

    setIsSubmitting(true);
    const finalCategoria = customCategoria.trim() || categoria;

    await addTransacao({
      user_id: user.id,
      descricao: descricao.trim(),
      valor: valorNumerico,
      tipo,
      categoria: finalCategoria,
      conta_id: destinoTipo === 'conta' ? contaId : undefined,
      cartao_id: destinoTipo === 'cartao' ? cartaoId : undefined,
      data,
      observacao: observacao.trim() || undefined,
    });

    setIsSubmitting(false);
    onClose();
    // Reset form
    setDescricao('');
    setValorStr('');
    setObservacao('');
    setCustomCategoria('');
  };

  const currentCategorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <div
      id="modal-transaction"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                tipo === 'entrada'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {tipo === 'entrada' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownLeft className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {tipo === 'entrada' ? 'Nova Entrada (Lucro/Receita)' : 'Nova Saída (Despesa/Gasto)'}
              </h2>
              <p className="text-xs text-zinc-400">Lançamento direto no fluxo de caixa</p>
            </div>
          </div>
          <button
            id="btn-close-trx-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo Selector */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
            <button
              id="btn-select-tipo-entrada"
              type="button"
              onClick={() => handleTipoChange('entrada')}
              className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'entrada'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              + Entrada (Lucro)
            </button>
            <button
              id="btn-select-tipo-saida"
              type="button"
              onClick={() => handleTipoChange('saida')}
              className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'saida'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              - Saída (Despesa)
            </button>
          </div>

          {/* Valor Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Valor da Transação (R$)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-bold">
                R$
              </div>
              <input
                id="input-trx-valor"
                type="text"
                required
                placeholder="0,00"
                value={valorStr}
                onChange={handleValorChange}
                className={`w-full pl-11 pr-4 py-3 bg-zinc-950 border rounded-xl text-lg font-bold font-mono-num placeholder-zinc-600 focus:outline-none transition-colors ${
                  tipo === 'entrada'
                    ? 'text-emerald-400 border-emerald-500/30 focus:border-emerald-500'
                    : 'text-rose-400 border-rose-500/30 focus:border-rose-500'
                }`}
              />
            </div>
          </div>

          {/* Descrição Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Descrição do Lançamento</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <FileText className="w-4 h-4" />
              </div>
              <input
                id="input-trx-descricao"
                type="text"
                required
                placeholder={tipo === 'entrada' ? 'Ex: Venda de Veículo / Honorários' : 'Ex: Abastecimento Frota / Licença TI'}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Origem/Destino (Conta Bancária ou Cartão de Crédito) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Método de Lançamento</label>
            {tipo === 'saida' && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDestinoTipo('conta')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    destinoTipo === 'conta'
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Conta Bancária / Pix
                </button>
                <button
                  type="button"
                  onClick={() => setDestinoTipo('cartao')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    destinoTipo === 'cartao'
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cartão de Crédito
                </button>
              </div>
            )}

            {destinoTipo === 'conta' ? (
              <select
                id="select-trx-conta"
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.instituicao})
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="select-trx-cartao"
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                {cartoes.map((crt) => (
                  <option key={crt.id} value={crt.id}>
                    {crt.nome} (Venc. Dia {crt.dia_vencimento})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Categoria</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {currentCategorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategoria(cat);
                    setCustomCategoria('');
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs text-left truncate transition-colors ${
                    categoria === cat && !customCategoria
                      ? 'bg-zinc-800 text-yellow-400 font-semibold border border-yellow-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              id="input-trx-custom-categoria"
              type="text"
              placeholder="Ou digite outra categoria personalizada..."
              value={customCategoria}
              onChange={(e) => setCustomCategoria(e.target.value)}
              className="w-full mt-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Data & Observação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Data do Lançamento</label>
              <input
                id="input-trx-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Observação / Nota</label>
              <input
                id="input-trx-obs"
                type="text"
                placeholder="Opcional..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex gap-3">
            <button
              id="btn-cancel-trx"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-trx"
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                tipo === 'entrada'
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 shadow-emerald-950/30'
                  : 'bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white shadow-rose-950/30'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Confirmar Lançamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
