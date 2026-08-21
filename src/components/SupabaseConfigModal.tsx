import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  resetLocalDatabaseToSeed,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const { refreshConfig } = useAuth();
  const { showSuccess, showInfo } = useToast();

  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(url, anonKey);
    refreshConfig();
    showSuccess('Configuração Salva', 'Credenciais do Supabase atualizadas.');
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showSuccess('SQL Copiado!', 'Cole no SQL Editor do seu projeto Supabase.');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleResetSeed = () => {
    if (confirm('Deseja restaurar os dados de demonstração (Venda do Civic, Financiamento, Nubank, Itaú)?')) {
      resetLocalDatabaseToSeed();
      showInfo('Dados Restaurados', 'Base de dados local redefinida para os registros de demonstração.');
      window.location.reload();
    }
  };

  return (
    <div
      id="modal-supabase-config"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Conexão Supabase
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  PostgreSQL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie sua instância ou copie o script SQL de criação
              </p>
            </div>
          </div>
          <button
            id="btn-close-supabase-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-5 pt-2">
          <button
            id="tab-supabase-config"
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Credenciais de API
          </button>
          <button
            id="tab-supabase-sql"
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Script SQL das Tabelas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'config' ? (
          <form onSubmit={handleSaveCredentials} className="p-6 space-y-5">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-zinc-200 font-semibold mb-0.5">Modo Híbrido Ativo</p>
                O aplicativo possui armazenamento local com sincronização automática e dados pré-carregados. Caso forneça as credenciais abaixo, ele fará as consultas diretamente no seu Supabase.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>Supabase Project URL</span>
              </label>
              <input
                id="input-supabase-url"
                type="url"
                placeholder="https://exemplo.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-500" />
                <span>Supabase Anon Public API Key</span>
              </label>
              <input
                id="input-supabase-anon-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                id="btn-reset-seed"
                type="button"
                onClick={handleResetSeed}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-500" />
                <span>Restaurar Dados Demo</span>
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  id="btn-cancel-supabase"
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Fechar
                </button>
                <button
                  id="btn-save-supabase"
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-950/30 transition-colors"
                >
                  Salvar Credenciais
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Execute este script no SQL Editor do Supabase para criar as 6 tabelas necessárias:
              </p>
              <button
                id="btn-copy-sql-schema"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 max-h-72 overflow-y-auto">
              <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-medium transition-colors"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
