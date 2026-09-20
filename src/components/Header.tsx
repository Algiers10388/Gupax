import React from 'react';
import { Cpu, Zap, Battery, BatteryCharging, Sun, Moon, Download } from 'lucide-react';
import { P2PoolChain } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useWakeLock } from '../hooks/useWakeLock';
import { useBattery } from '../hooks/useBattery';

interface HeaderProps {
  chain: P2PoolChain;
  onToggleChain: () => void;
  isMining: boolean;
  isP2PoolConnected: boolean;
  isNodeConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  chain,
  onToggleChain,
  isMining,
  isP2PoolConnected,
  isNodeConnected,
}) => {
  const { isLocked, toggleLock, isSupported: isWakeLockSupported } = useWakeLock();
  const battery = useBattery();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-500">
            <Cpu className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold tracking-wider text-base text-white">GUPAX</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-orange-950 text-orange-400 border border-orange-800/60 tracking-tight">
                Android
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">P2Pool + XMRig Mobile Suite</p>
          </div>
        </div>

        {/* Chain Selector & Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Mini vs Main Toggle */}
          <button
            id="header-chain-toggle"
            onClick={onToggleChain}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-900 border border-slate-700/80 hover:border-orange-500/50 transition cursor-pointer"
            title="Click to toggle between P2Pool Mini (for CPUs/phones) and Main"
          >
            <span className="text-slate-400">Chain:</span>
            <span className={chain === 'mini' ? 'text-amber-400' : 'text-orange-500'}>
              {chain.toUpperCase()}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* WakeLock Control for Android */}
          {isWakeLockSupported && (
            <button
              id="header-wakelock-toggle"
              onClick={toggleLock}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border transition cursor-pointer ${
                isLocked
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isLocked ? 'Screen WakeLock Active (Keeps screen awake)' : 'Click to enable WakeLock'}
            >
              {isLocked ? <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden md:inline font-mono text-[11px]">{isLocked ? 'Awake ON' : 'Awake'}</span>
            </button>
          )}

          {/* Battery Status */}
          {battery.isSupported && (
            <div
              className={`hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-lg border ${
                battery.charging
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  : battery.level < 0.2
                  ? 'bg-red-950/50 border-red-800/60 text-red-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
              title={`Battery: ${Math.round(battery.level * 100)}% ${battery.charging ? '(Charging)' : ''}`}
            >
              {battery.charging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{Math.round(battery.level * 100)}%</span>
            </div>
          )}

          {/* Quick status dots */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] font-mono">
            <span
              title={`XMRig: ${isMining ? 'Active' : 'Standby'}`}
              className={`w-2 h-2 rounded-full ${isMining ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(242,104,34,0.8)]' : 'bg-slate-600'}`}
            />
            <span
              title={`P2Pool: ${isP2PoolConnected ? 'Connected' : 'Offline'}`}
              className={`w-2 h-2 rounded-full ${isP2PoolConnected ? 'bg-emerald-400' : 'bg-red-500'}`}
            />
            <span
              title={`Node: ${isNodeConnected ? 'Synchronized' : 'Disconnected'}`}
              className={`w-2 h-2 rounded-full ${isNodeConnected ? 'bg-sky-400' : 'bg-slate-600'}`}
            />
          </div>

          {/* Standalone Native Python Program / PIP Download */}
          <a
            href="/gupax_mobile-1.0.0-py3-none-any.whl"
            download="gupax_mobile-1.0.0-py3-none-any.whl"
            title="Download PIP Wheel package (pip install gupax_mobile-1.0.0-py3-none-any.whl)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">pip (.whl)</span>
          </a>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
