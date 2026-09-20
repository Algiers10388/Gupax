import React from 'react';
import { Activity, Pickaxe, Network, Cpu, Server, Terminal } from 'lucide-react';
import { GupaxTab } from '../types';

interface NavigationProps {
  activeTab: GupaxTab;
  onSelectTab: (tab: GupaxTab) => void;
  isMining: boolean;
  activeSharesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isMining,
  activeSharesCount,
}) => {
  const tabs: { id: GupaxTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Status', icon: Activity },
    { id: 'miner', label: 'Miner', icon: Pickaxe, badge: isMining ? 'ON' : undefined },
    { id: 'p2pool', label: 'P2Pool', icon: Network, badge: activeSharesCount > 0 ? `${activeSharesCount}★` : undefined },
    { id: 'config', label: 'ARM Config', icon: Cpu },
    { id: 'nodes', label: 'Nodes', icon: Server },
    { id: 'console', label: 'Console', icon: Terminal },
  ];

  return (
    <>
      {/* Desktop/Tablet Horizontal Tabs */}
      <div className="hidden md:block bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-desktop-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition cursor-pointer relative ${
                  isActive
                    ? 'text-orange-400 border-orange-500 bg-orange-950/20'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Android Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-6 h-14">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-mobile-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition cursor-pointer select-none ${
                  isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute top-0 inset-x-2 h-0.5 bg-orange-500 rounded-full" />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 text-[9px] font-bold bg-orange-600 text-white rounded-full leading-none">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono mt-1 font-medium tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
