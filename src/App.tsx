import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TabType, TipoTransacao } from './types';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { ContasCartoesView } from './components/ContasCartoesView';
import { DevedoresView } from './components/DevedoresView';
import { ContasAPagarView } from './components/ContasAPagarView';
import { ExtratoView } from './components/ExtratoView';
import { TransactionModal } from './components/TransactionModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { devedores, contasAPagar } = useFinance();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Global Transaction Modal state
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [trxInitialType, setTrxInitialType] = useState<TipoTransacao>('entrada');

  const handleOpenNewTransaction = (tipo: TipoTransacao = 'entrada') => {
    setTrxInitialType(tipo);
    setIsTrxModalOpen(true);
  };

  // Loading Splash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-wider">AUTENTICANDO SISTEMA...</p>
      </div>
    );
  }

  // 1. Unauthenticated State (All screens blocked)
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)} />
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </>
    );
  }

  // 2. Authenticated App
  const openDevedoresCount = devedores.filter((d) => d.status !== 'quitado').length;
  const openContasPagarCount = contasAPagar.filter((c) => c.status !== 'quitado').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Main Responsive Content Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenNewDevedor={() => setActiveTab('devedores')}
            onOpenNewContaPagar={() => setActiveTab('contas_pagar')}
            onOpenNewConta={() => setActiveTab('contas_cartoes')}
            onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {activeTab === 'contas_cartoes' && (
          <ContasCartoesView onOpenNewTransaction={() => handleOpenNewTransaction('saida')} />
        )}

        {activeTab === 'devedores' && <DevedoresView />}

        {activeTab === 'contas_pagar' && <ContasAPagarView />}

        {activeTab === 'extrato' && (
          <ExtratoView onOpenNewTransaction={handleOpenNewTransaction} />
        )}
      </main>

      {/* Fixed Mobile-First Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        devedoresCount={openDevedoresCount}
        contasPagarCount={openContasPagarCount}
      />

      {/* Universal Fast Transaction Modal */}
      <TransactionModal
        isOpen={isTrxModalOpen}
        onClose={() => setIsTrxModalOpen(false)}
        initialType={trxInitialType}
      />

      {/* Supabase Connection & SQL DDL Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
