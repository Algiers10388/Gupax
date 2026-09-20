import React from 'react';
import { 
  Activity, 
  Cpu, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Battery, 
  BatteryCharging, 
  ShieldCheck, 
  Play, 
  Square, 
  Clock, 
  Coins, 
  ExternalLink 
} from 'lucide-react';
import { MiningStatus, P2PoolLiveStats, MinerShareInfo, GupaxTab } from '../types';
import { useBattery } from '../hooks/useBattery';
import { useWakeLock } from '../hooks/useWakeLock';

interface DashboardTabProps {
  status: MiningStatus;
  p2poolStats: P2PoolLiveStats;
  minerInfo: MinerShareInfo;
  onToggleMining: () => void;
  onNavigate: (tab: GupaxTab) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  status,
  p2poolStats,
  minerInfo,
  onToggleMining,
  onNavigate,
}) => {
  const battery = useBattery();
  const { isLocked, toggleLock } = useWakeLock();

  const formatHashrate = (hs: number) => {
    if (hs >= 1000000) return `${(hs / 1000000).toFixed(2)} MH/s`;
    if (hs >= 1000) return `${(hs / 1000).toFixed(1)} KH/s`;
    return `${hs.toFixed(0)} H/s`;
  };

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Top Banner: Mining Status & Quick Controls */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Status</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                  status.isMining
                    ? 'bg-orange-950/80 text-orange-400 border border-orange-800/80'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.isMining ? 'bg-orange-500 animate-pulse' : 'bg-slate-500'}`} />
                {status.isMining ? 'MINING ACTIVE' : 'STOPPED'}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-amber-300 border border-slate-700">
                P2Pool {status.chain.toUpperCase()}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                {formatHashrate(status.hashrate10s)}
              </h2>
              <span className="text-xs font-mono text-slate-400">10s avg</span>
            </div>

            <p className="text-xs text-slate-400 font-mono mt-1">
              Target: <span className="text-slate-200">{status.targetPool || 'p2pool.io:3333'}</span>
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="dashboard-toggle-mining-btn"
              onClick={onToggleMining}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono font-semibold text-sm transition shadow-md active:scale-98 cursor-pointer ${
                status.isMining
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'
              }`}
            >
              {status.isMining ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Mining</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Mining</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('miner')}
              className="px-3 py-2.5 rounded-xl font-mono text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
              title="Open Miner Configuration & WebAssembly Benchmark"
            >
              Config
            </button>
          </div>
        </div>

        {/* Live Hashrate Metrics Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 text-[11px]">60s Average</div>
            <div className="text-white font-semibold mt-0.5">{formatHashrate(status.hashrate60s)}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 text-[11px]">15m Average</div>
            <div className="text-white font-semibold mt-0.5">{formatHashrate(status.hashrate15m)}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 text-[11px]">Peak Hashrate</div>
            <div className="text-orange-400 font-semibold mt-0.5">{formatHashrate(status.peakHashrate)}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="text-slate-400 text-[11px]">Shares (Acc/Rej)</div>
            <div className="text-emerald-400 font-semibold mt-0.5">
              {status.acceptedShares} <span className="text-slate-500">/</span> <span className="text-red-400">{status.rejectedShares}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Gupax Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* P2Pool Sidechain Card */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Activity className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold font-mono">P2Pool {status.chain.toUpperCase()} Chain</h3>
              </div>
              <button
                onClick={() => onNavigate('p2pool')}
                className="text-xs text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>Observer</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Your Shares in Window:</span>
                <span className={`font-bold ${minerInfo.sharesInWindow > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {minerInfo.sharesInWindow} {minerInfo.sharesInWindow > 0 ? '★ Eligible for payout!' : '(Need 1 share)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">P2Pool Hashrate:</span>
                <span className="text-slate-200">{formatHashrate(p2poolStats.poolHashrate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Sidechain Height:</span>
                <span className="text-slate-200">{p2poolStats.sidechainHeight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Difficulty:</span>
                <span className="text-slate-200">{(p2poolStats.difficulty / 1e6).toFixed(1)} M</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Blocks in 24h: <strong className="text-slate-200">{p2poolStats.blocksFound24h}</strong></span>
            <span>Reward: <strong className="text-orange-400">~{p2poolStats.blockRewardXMR} XMR</strong></span>
          </div>
        </div>

        {/* Android Device & Telemetry Card */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold font-mono">Android SoC Telemetry</h3>
              </div>
              <button
                onClick={() => onNavigate('config')}
                className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <span>ARM Setup</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">CPU Hardware Cores:</span>
                <span className="text-slate-200">{cores} Threads (ARM64)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Active Miner Threads:</span>
                <span className="text-orange-400 font-semibold">{status.activeThreads} Threads</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Battery Status:</span>
                <span className={battery.charging ? 'text-emerald-400' : battery.level < 0.2 ? 'text-red-400' : 'text-slate-200'}>
                  {Math.round(battery.level * 100)}% {battery.charging ? '⚡ Charging' : 'Discharging'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Screen Keep-Awake:</span>
                <button
                  onClick={toggleLock}
                  className={`text-[11px] px-1.5 py-0.5 rounded cursor-pointer ${
                    isLocked ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isLocked ? 'ACTIVE (No Sleep)' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Recommended for phones: Max 4 threads to prevent thermal throttling.</span>
          </div>
        </div>
      </div>

      {/* Quick P2Pool Reward Summary */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 border border-slate-800/90 p-4 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold uppercase text-slate-300">P2Pool PPLNS Reward Model</span>
          </div>
          <span className="text-[11px] text-slate-400">0% Pool Fee • True Decentralization</span>
        </div>
        <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
          Unlike centralized pools, P2Pool pays directly to your wallet via Monero coinbase transactions. 
          When your Android device or rig finds a share on the P2Pool {status.chain} sidechain, you receive instant XMR payouts whenever P2Pool finds a Monero block!
        </p>
      </div>
    </div>
  );
};
