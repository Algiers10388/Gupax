import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GupaxTab, 
  P2PoolChain, 
  MiningStatus, 
  P2PoolLiveStats, 
  MinerShareInfo, 
  LogEntry 
} from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardTab } from './components/DashboardTab';
import { MinerTab } from './components/MinerTab';
import { P2PoolTab } from './components/P2PoolTab';
import { AndroidConfigTab } from './components/AndroidConfigTab';
import { NodesTab } from './components/NodesTab';
import { ConsoleTab } from './components/ConsoleTab';
import { fetchP2PoolStats, fetchMinerStats, DEMO_WALLETS } from './services/p2poolApi';
import { useHaptics } from './hooks/useHaptics';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();
  const { shareSuccessHaptic, blockFoundHaptic } = useHaptics();

  // Navigation & Mode
  const [activeTab, setActiveTab] = useState<GupaxTab>('dashboard');
  const [chain, setChain] = useState<P2PoolChain>('mini');
  const [walletAddress, setWalletAddress] = useState<string>(DEMO_WALLETS[0].address);

  // Mining Engine State
  const [status, setStatus] = useState<MiningStatus>({
    isMining: false,
    isP2PoolConnected: true,
    isNodeConnected: true,
    hashrate10s: 0,
    hashrate60s: 0,
    hashrate15m: 0,
    peakHashrate: 0,
    acceptedShares: 0,
    rejectedShares: 0,
    totalHashes: 0,
    uptimeSeconds: 0,
    activeThreads: 4,
    targetPool: 'p2pmd.xmrvsbeast.com:3333',
    chain: 'mini',
    walletAddress: DEMO_WALLETS[0].address,
  });

  // P2Pool Live Stats
  const [p2poolStats, setP2PoolStats] = useState<P2PoolLiveStats>({
    chain: 'mini',
    sidechainHeight: 3982450,
    mainchainHeight: 3249180,
    poolHashrate: 14850000,
    networkHashrate: 2950000000,
    difficulty: 172000000,
    activeMiners: 1390,
    blockRewardXMR: 0.60,
    lastBlockFoundTime: '2m 14s ago',
    blocksFound24h: 16,
    pplnsWindowBlocks: 2160,
  });

  // Miner Share Info
  const [minerInfo, setMinerInfo] = useState<MinerShareInfo>({
    address: DEMO_WALLETS[0].address,
    sharesInWindow: 1,
    totalSharesFound: 14,
    lastShareTimestamp: Date.now() - 15 * 60000,
    hashrateEstimate: 850,
    unpaidBalanceXMR: 0.003412,
    totalPaidXMR: 0.1425,
    estimatedNextPayout: 'Active in next P2Pool block',
  });

  // Logging
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      source: 'GUPAX',
      level: 'info',
      message: 'Gupax Mobile for Android initialized. ARM64 architecture detected.',
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString(),
      source: 'P2POOL',
      level: 'success',
      message: 'Connected to P2Pool Mini sidechain. Target difficulty 172M.',
    },
    {
      id: '3',
      timestamp: new Date().toLocaleTimeString(),
      source: 'DAEMON',
      level: 'info',
      message: 'Monero mainchain synchronized at block 3,249,180.',
    },
  ]);

  const addLog = useCallback((source: LogEntry['source'], level: LogEntry['level'], message: string) => {
    setLogs(prev => [
      ...prev.slice(-250), // keep latest 250 log entries
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        source,
        level,
        message,
      },
    ]);
  }, []);

  // Fetch initial & periodic P2Pool and Miner stats
  useEffect(() => {
    let isMounted = true;
    const updateStats = async () => {
      try {
        const stats = await fetchP2PoolStats(chain);
        if (isMounted) setP2PoolStats(stats);
        if (walletAddress) {
          const info = await fetchMinerStats(chain, walletAddress);
          if (isMounted) setMinerInfo(info);
        }
      } catch {
        // Silent fallback
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [chain, walletAddress]);

  // Mining Engine Execution Loop
  useEffect(() => {
    if (!status.isMining) return;

    addLog('XMRIG', 'info', `XMRig thread workers started (${status.activeThreads} ARM threads assigned)`);
    addLog('XMRIG', 'info', `Connected to stratum pool: ${status.targetPool}`);

    const timer = setInterval(() => {
      setStatus(prev => {
        const baseThreadRate = 210; // ~210 H/s per modern ARM core
        const jitter = (Math.random() - 0.5) * 45;
        const currentHs = Math.max(80, (prev.activeThreads * baseThreadRate) + jitter);
        
        const newTotal = prev.totalHashes + Math.round(currentHs);
        const newUptime = prev.uptimeSeconds + 1;
        const newPeak = Math.max(prev.peakHashrate, currentHs);

        // Calculate smooth rolling averages
        const new10s = prev.hashrate10s === 0 ? currentHs : prev.hashrate10s * 0.85 + currentHs * 0.15;
        const new60s = prev.hashrate60s === 0 ? currentHs : prev.hashrate60s * 0.95 + currentHs * 0.05;
        const new15m = prev.hashrate15m === 0 ? currentHs : prev.hashrate15m * 0.98 + currentHs * 0.02;

        // Occasional simulated share submit to P2Pool stratum
        let newAccepted = prev.acceptedShares;
        let newRejected = prev.rejectedShares;

        if (Math.random() < 0.04) { // ~Every 25 seconds
          const isAccepted = Math.random() > 0.03;
          if (isAccepted) {
            newAccepted += 1;
            shareSuccessHaptic();
            addLog(
              'P2POOL',
              'success',
              `accepted (${newAccepted}/${newRejected}) diff ${(p2poolStats.difficulty / 1e6).toFixed(1)}M (${Math.round(30 + Math.random() * 40)}ms)`
            );
          } else {
            newRejected += 1;
            addLog('P2POOL', 'warn', `share rejected by stratum (stale diff check)`);
          }
        }

        return {
          ...prev,
          hashrate10s: new10s,
          hashrate60s: new60s,
          hashrate15m: new15m,
          peakHashrate: newPeak,
          totalHashes: newTotal,
          uptimeSeconds: newUptime,
          acceptedShares: newAccepted,
          rejectedShares: newRejected,
        };
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      addLog('XMRIG', 'warn', 'XMRig worker threads stopped.');
    };
  }, [status.isMining, status.activeThreads, status.targetPool, p2poolStats.difficulty, addLog, shareSuccessHaptic]);

  // Toggle Mining
  const handleToggleMining = () => {
    setStatus(prev => {
      const nextMining = !prev.isMining;
      if (!nextMining) {
        return {
          ...prev,
          isMining: false,
          hashrate10s: 0,
        };
      }
      return {
        ...prev,
        isMining: true,
      };
    });
  };

  // Toggle Chain (Mini <-> Main)
  const handleToggleChain = () => {
    const nextChain = chain === 'mini' ? 'main' : 'mini';
    setChain(nextChain);
    setStatus(prev => ({ ...prev, chain: nextChain }));
    addLog('P2POOL', 'info', `Switched active sidechain to P2Pool ${nextChain.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-slate-950 font-mono text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — Cached data and local ARM configurations available</span>
        </div>
      )}

      {/* Global Gupax Header */}
      <Header
        chain={chain}
        onToggleChain={handleToggleChain}
        isMining={status.isMining}
        isP2PoolConnected={status.isP2PoolConnected}
        isNodeConnected={status.isNodeConnected}
      />

      {/* Navigation (Desktop Horizontal Tabs + Mobile Bottom Bar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMining={status.isMining}
        activeSharesCount={minerInfo.sharesInWindow}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            status={status}
            p2poolStats={p2poolStats}
            minerInfo={minerInfo}
            onToggleMining={handleToggleMining}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'miner' && (
          <MinerTab
            status={status}
            onToggleMining={handleToggleMining}
            onUpdateThreads={threads => {
              setStatus(prev => ({ ...prev, activeThreads: threads }));
              addLog('ANDROID', 'info', `Updated CPU thread allocation to ${threads} threads`);
            }}
            onUpdatePool={pool => {
              setStatus(prev => ({ ...prev, targetPool: pool }));
              addLog('P2POOL', 'info', `Stratum pool updated to ${pool}`);
            }}
            onUpdateWallet={wallet => {
              setStatus(prev => ({ ...prev, walletAddress: wallet }));
              setWalletAddress(wallet);
            }}
            onLog={addLog}
          />
        )}

        {activeTab === 'p2pool' && (
          <P2PoolTab
            chain={chain}
            onChangeChain={newChain => {
              setChain(newChain);
              setStatus(prev => ({ ...prev, chain: newChain }));
              addLog('P2POOL', 'info', `Active chain switched to ${newChain.toUpperCase()}`);
            }}
            p2poolStats={p2poolStats}
            minerInfo={minerInfo}
            walletAddress={walletAddress}
            onUpdateWallet={setWalletAddress}
            onRefreshMinerInfo={setMinerInfo}
          />
        )}

        {activeTab === 'config' && (
          <AndroidConfigTab
            walletAddress={walletAddress}
            targetPool={status.targetPool}
            chain={chain}
            activeThreads={status.activeThreads}
          />
        )}

        {activeTab === 'nodes' && (
          <NodesTab
            currentTargetPool={status.targetPool}
            onSelectPool={pool => {
              setStatus(prev => ({ ...prev, targetPool: pool }));
            }}
            chain={chain}
            onLog={addLog}
          />
        )}

        {activeTab === 'console' && (
          <ConsoleTab
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}
      </main>
    </div>
  );
}
