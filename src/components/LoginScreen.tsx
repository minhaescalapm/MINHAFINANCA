import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Zap,
  Database,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onOpenSupabaseConfig: () => void;
}

export function LoginScreen({ onOpenSupabaseConfig }: LoginScreenProps) {
  const { login, register, quickDemoLogin, isLoading, supabaseConfig } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('(21) 97515-1937');
  const [senha, setSenha] = useState('050805');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Format phone number Brazilian format: (99) 99999-9999
  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatPhone(val);
    setTelefone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone.trim() || !senha.trim()) return;

    setSubmitting(true);
    if (isRegisterMode) {
      if (!nome.trim()) {
        setSubmitting(false);
        return;
      }
      await register(nome, telefone, senha);
    } else {
      await login(telefone, senha);
    }
    setSubmitting(false);
  };

  const handleMasterQuickLogin = async () => {
    setSubmitting(true);
    setTelefone('(21) 97515-1937');
    setSenha('050805');
    await quickDemoLogin();
    setSubmitting(false);
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden"
    >
      {/* Tactical Ambient Glow Elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Supabase Indicator Button */}
      <button
        id="btn-supabase-config-trigger"
        onClick={onOpenSupabaseConfig}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all backdrop-blur-sm"
      >
        <Database className="w-3.5 h-3.5 text-emerald-400" />
        <span>{supabaseConfig.url ? 'Supabase Conectado' : 'Configurar Supabase'}</span>
        <span
          className={`w-2 h-2 rounded-full ${
            supabaseConfig.url ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'
          }`}
        />
      </button>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-4 relative group">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <ShieldCheck className="w-8 h-8 text-emerald-400 relative z-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-2">
            Gestão Financeira <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">PWA</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Controle tático de fluxo de caixa, cartões, devedores e contas a pagar
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
            <button
              id="tab-login-mode"
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isRegisterMode
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Acesso Seguro
            </button>
            <button
              id="tab-register-mode"
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                isRegisterMode
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Novo Usuário
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isRegisterMode && (
                <motion.div
                  key="nome-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-medium text-zinc-300 block">
                    Nome Completo / Razão Social
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="input-nome"
                      type="text"
                      required={isRegisterMode}
                      placeholder="Ex: Carlos Andrade ou Nexus Logística"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campo Telefone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Telefone (com DDD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="input-telefone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-300">
                  Senha de Acesso
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Tabela: usuarios</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  id="btn-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar / Cadastrar */}
            <button
              id="btn-submit-auth"
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              {submitting || isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar & Acessar</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Master Access Bar */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Acesso Master com Permissão Total
              </span>
            </div>

            <button
              id="btn-master-quick-login"
              type="button"
              onClick={handleMasterQuickLogin}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all group hover:bg-emerald-950/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    Entrar como Administrador Master
                  </p>
                  <p className="text-[11px] text-emerald-400/80 font-mono">(21) 97515-1937 • Senha: 050805</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Acesso Total
              </span>
            </button>
          </div>
        </div>

        {/* Security & Table Notice */}
        <p className="text-center text-xs text-zinc-500 mt-4 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
          <span>Autenticação direta com a tabela </span>
          <code className="text-emerald-400 font-mono bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">
            usuarios
          </code>
        </p>
      </div>
    </div>
  );
}
