import React from 'react';
import { TabType } from '../types';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Receipt,
  ArrowLeftRight,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  devedoresCount?: number;
  contasPagarCount?: number;
}

export function BottomNav({
  activeTab,
  setActiveTab,
  devedoresCount = 0,
  contasPagarCount = 0,
}: BottomNavProps) {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'contas_cartoes' as TabType,
      label: 'Cartões & Contas',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'devedores' as TabType,
      label: 'Devedores',
      icon: Users,
      badge: devedoresCount > 0 ? devedoresCount : null,
      badgeColor: 'bg-emerald-500 text-zinc-950',
    },
    {
      id: 'contas_pagar' as TabType,
      label: 'A Pagar',
      icon: Receipt,
      badge: contasPagarCount > 0 ? contasPagarCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'extrato' as TabType,
      label: 'Extrato',
      icon: ArrowLeftRight,
      badge: null,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-lg pb-safe"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-all group ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {/* Active Indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-emerald-400' : 'group-hover:scale-105'
                  }`}
                />

                {item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[10px] font-bold px-1.5 min-w-4 h-4 rounded-full flex items-center justify-center ${
                      item.badgeColor || 'bg-zinc-700 text-zinc-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[68px] text-center leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
