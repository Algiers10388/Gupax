import React, { useState } from 'react';
import { 
  Network, 
  Search, 
  Coins, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ExternalLink, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { P2PoolChain, P2PoolLiveStats, MinerShareInfo } from '../types';
import { calculateEarnings, DEMO_WALLETS, fetchMinerStats } from '../services/p2poolApi';

interface P2PoolTabProps {
  chain: P2PoolChain;
  onChangeChain: (chain: P2PoolChain) => void;
  p2poolStats: P2PoolLiveStats;
  minerInfo: MinerShareInfo;
  walletAddress: string;
  onUpdateWallet: (address: string) => void;
  onRefreshMinerInfo: (info: MinerShareInfo) => void;
}

export const P2PoolTab: React.FC<P2PoolTabProps> = ({
  chain,
  onChangeChain,
  p2poolStats,
  minerInfo,
  walletAddress,
  onUpdateWallet,
  onRefreshMinerInfo,
}) => {
  const [inputAddress, setInputAddress] = useState(walletAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [calcHashrate, setCalcHashrate] = useState<number>(850); // Default 850 H/s for mobile phone

  const earnings = calculateEarnings(calcHashrate, chain, 175);

  const handleSearch = async (addrToSearch: string) => {
    setIsSearching(true);
    const targetAddr = addrToSearch.trim();
    onUpdateWallet(targetAddr);
    const res = await fetchMinerStats(chain, targetAddr);
    onRefreshMinerInfo(res);
    setIsSearching(false);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Chain Mode Switcher */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-mono font-bold text-white uppercase">P2Pool Decentralized Sidechain</h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Select the sidechain matching your mining power. Android phones should always use <strong>P2Pool Mini</strong>.
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => onChangeChain('mini')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                chain === 'mini'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mini Chain (&lt; 50 KH/s)
            </button>
            <button
              onClick={() => onChangeChain('main')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                chain === 'main'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Main Chain (&gt; 50 KH/s)
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Address & Share Lookup */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 font-mono">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-400" />
            <span>PPLNS Share & Payout Observer</span>
          </h3>
          <span className="text-[11px] text-slate-400">PPLNS Window: 2,160 blocks (~6 hours)</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputAddress}
            onChange={e => setInputAddress(e.target.value)}
            placeholder="Paste your 95-character Monero address here (4... or 8...)"
            className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => handleSearch(inputAddress)}
            disabled={isSearching}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isSearching ? 'Querying...' : 'Check Address'}</span>
          </button>
        </div>

        {/* Demo address quick links */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span>Try example:</span>
          {DEMO_WALLETS.map(demo => (
            <button
              key={demo.name}
              onClick={() => {
                setInputAddress(demo.address);
                handleSearch(demo.address);
              }}
              className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer"
            >
              {demo.name}
            </button>
          ))}
        </div>

        {/* Miner Share Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Shares in Window</div>
            <div className={`text-lg font-bold mt-1 ${minerInfo.sharesInWindow > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {minerInfo.sharesInWindow} {minerInfo.sharesInWindow > 0 ? '★ Active' : '0 Shares'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {minerInfo.sharesInWindow > 0 ? 'Getting rewarded on every found block' : 'Keep mining until 1 share hits'}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Unpaid Balance</div>
            <div className="text-lg font-bold text-slate-200 mt-1">
              {minerInfo.unpaidBalanceXMR.toFixed(6)} XMR
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Total Paid: {minerInfo.totalPaidXMR.toFixed(4)} XMR
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Estimated Hashrate</div>
            <div className="text-lg font-bold text-orange-400 mt-1">
              {minerInfo.hashrateEstimate > 0 ? `${minerInfo.hashrateEstimate.toFixed(0)} H/s` : 'Calculating...'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Calculated from share timestamps
            </div>
          </div>
        </div>
      </div>

      {/* P2Pool Network Stats & Monero Payout Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sidechain Real-time Telemetry */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>P2Pool {chain.toUpperCase()} Live Metrics</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Sidechain Block Height:</span>
              <span className="text-white font-bold">{p2poolStats.sidechainHeight.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monero Mainchain Height:</span>
              <span className="text-white">{p2poolStats.mainchainHeight.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Sidechain Miners:</span>
              <span className="text-emerald-400 font-bold">{p2poolStats.activeMiners.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sidechain Hashrate:</span>
              <span className="text-orange-400 font-bold">{(p2poolStats.poolHashrate / 1e6).toFixed(2)} MH/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mainchain Block Reward:</span>
              <span className="text-slate-200">~{p2poolStats.blockRewardXMR} XMR</span>
            </div>
          </div>
        </div>

        {/* Interactive Payout Calculator */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Android P2Pool Payout Calculator</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Test Hashrate:</span>
              <span className="text-orange-400 font-bold">{calcHashrate} H/s</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={calcHashrate}
              onChange={e => setCalcHashrate(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>100 H/s (Budget phone)</span>
              <span>1,200 H/s (Snapdragon 8 Gen 2/3)</span>
              <span>5,000 H/s (Multi-device)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Time to 1 Share (Mini):</span>
              <span className="text-amber-400 font-bold">~{earnings.estTimeToShareHours} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Daily Return:</span>
              <span className="text-slate-200">{earnings.dailyXMR.toFixed(6)} XMR (${earnings.dailyUSD.toFixed(3)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monthly Return:</span>
              <span className="text-emerald-400 font-bold">{earnings.monthlyXMR.toFixed(5)} XMR (${earnings.monthlyUSD.toFixed(2)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
