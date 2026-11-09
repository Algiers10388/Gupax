import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GupaxTab, 
  P2PoolChain, 
  MiningStatus, 
  P2PoolLiveStats, 
  MinerShareInfo, 
  LogEntry,
  HashratePoint
} from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardTab } from './components/DashboardTab';
import { MinerTab } from './components/MinerTab';
import { P2PoolTab } from './components/P2PoolTab';
import { AndroidConfigTab } from './components/AndroidConfigTab';
import { NodesTab } from './components/NodesTab';
import { ConsoleTab } from './components/ConsoleTab';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { fetchP2PoolStats, fetchMinerStats, DEMO_WALLETS } from './services/p2poolApi';
import { useHaptics } from './hooks/useHaptics';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

const generateInitialHashrateHistory = (): HashratePoint[] => {
  const points: HashratePoint[] = [];
  const now = Date.now();
  for (let i = 35; i >= 0; i--) {
    const t = new Date(now - i * 1000);
    points.push({
      timestamp: t.getTime(),
      timeLabel: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      hashrate: 0,
      hasShare: false,
    });
  }
  return points;
};

export default function App() {
  const isOnline = useOnlineStatus();
  const { shareSuccessHaptic, blockFoundHaptic } = useHaptics();

  // Navigation & Mode
  const [activeTab, setActiveTab] = useState<GupaxTab>('dashboard');
  const [chain, setChain] = useState<P2PoolChain>('mini');
  const [walletAddress, setWalletAddress] = useState<string>(DEMO_WALLETS[0].address);
  const [hashrateHistory, setHashrateHistory] = useState<HashratePoint[]>(generateInitialHashrateHistory);

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
        let isShareFound = false;

        if (Math.random() < 0.04) { // ~Every 25 seconds
          const isAccepted = Math.random() > 0.03;
          if (isAccepted) {
            newAccepted += 1;
            isShareFound = true;
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

        // Stream real-time telemetry into hashrateHistory
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHashrateHistory(prevHistory => {
          const nextPt: HashratePoint = {
            timestamp: now.getTime(),
            timeLabel,
            hashrate: Math.round(currentHs * 10) / 10,
            hasShare: isShareFound,
          };
          const updated = [...prevHistory, nextPt];
          return updated.length > 120 ? updated.slice(updated.length - 120) : updated;
        });

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

  // Modal & Keyboard Navigation State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [toastKeyFeedback, setToastKeyFeedback] = useState<{ key: string; action: string } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const TABS: GupaxTab[] = ['dashboard', 'miner', 'p2pool', 'config', 'nodes', 'console'];
  const TAB_NAMES: Record<GupaxTab, string> = {
    dashboard: 'Status Dashboard [1]',
    miner: 'XMRig Miner [2]',
    p2pool: 'P2Pool Sidechain [3]',
    config: 'ARM Config [4]',
    nodes: 'Stratum Nodes [5]',
    console: 'Console Logs [6]',
  };

  const showKeyFeedback = useCallback((keyName: string, actionName: string) => {
    setLastKeyPressed(keyName);
    setToastKeyFeedback({ key: keyName, action: actionName });
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
      setToastKeyFeedback(null);
    }, 2400);
  }, []);

  // Toggle Mining
  const handleToggleMining = useCallback(() => {
    setStatus(prev => {
      const nextMining = !prev.isMining;
      if (!nextMining) {
        setHashrateHistory(hist => {
          const now = new Date();
          return [
            ...hist.slice(-119),
            {
              timestamp: now.getTime(),
              timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              hashrate: 0,
              hasShare: false,
            }
          ];
        });
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
  }, []);

  // Toggle Chain (Mini <-> Main)
  const handleToggleChain = useCallback(() => {
    setChain(prev => {
      const nextChain = prev === 'mini' ? 'main' : 'mini';
      setStatus(s => ({ ...s, chain: nextChain }));
      addLog('P2POOL', 'info', `Switched active sidechain to P2Pool ${nextChain.toUpperCase()}`);
      return nextChain;
    });
  }, [addLog]);

  // Global Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );

      // Escape handling
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          showKeyFeedback('Esc', 'Closed Shortcuts Dialog');
          return;
        }
        if (isInput) {
          target.blur();
          showKeyFeedback('Esc', 'Unfocused input field');
          return;
        }
      }

      // If user is currently typing inside an input/textarea/select, do not intercept keys
      if (isInput) return;

      // Tab jumping: 1 - 6
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const tabIdx = parseInt(e.key, 10) - 1;
        const selected = TABS[tabIdx];
        if (selected) {
          setActiveTab(selected);
          showKeyFeedback(e.key, `Switched to ${TAB_NAMES[selected]}`);
        }
        return;
      }

      // Tab navigation: ArrowLeft / ArrowRight
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveTab(prev => {
          const idx = TABS.indexOf(prev);
          const next = TABS[(idx + 1) % TABS.length];
          showKeyFeedback('→', `Switched to ${TAB_NAMES[next]}`);
          return next;
        });
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveTab(prev => {
          const idx = TABS.indexOf(prev);
          const prevTab = TABS[(idx - 1 + TABS.length) % TABS.length];
          showKeyFeedback('←', `Switched to ${TAB_NAMES[prevTab]}`);
          return prevTab;
        });
        return;
      }

      // Mining toggle: Space or M
      if (e.key === ' ' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMining();
        const willBeMining = !status.isMining;
        showKeyFeedback(e.key === ' ' ? 'Space' : e.key.toUpperCase(), willBeMining ? 'Mining Started' : 'Mining Stopped');
        return;
      }

      // Chain toggle: C
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleToggleChain();
        const nextChain = chain === 'mini' ? 'MAIN' : 'MINI';
        showKeyFeedback('C', `Sidechain switched to ${nextChain}`);
        return;
      }

      // Thread adjustments: '+' or '='
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setStatus(prev => {
          const updated = Math.min(8, prev.activeThreads + 1);
          showKeyFeedback('+', `CPU threads set to ${updated}`);
          addLog('ANDROID', 'info', `Keyboard shortcut: Thread count increased to ${updated}`);
          return { ...prev, activeThreads: updated };
        });
        return;
      }

      // Thread adjustments: '-' or '_'
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setStatus(prev => {
          const updated = Math.max(1, prev.activeThreads - 1);
          showKeyFeedback('-', `CPU threads set to ${updated}`);
          addLog('ANDROID', 'info', `Keyboard shortcut: Thread count decreased to ${updated}`);
          return { ...prev, activeThreads: updated };
        });
        return;
      }

      // Help modal: '?' or 'h' / 'H'
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        showKeyFeedback(e.key, 'Toggled Keyboard Shortcuts guide');
        return;
      }

      // Record any other key for live keystroke testing feedback
      setLastKeyPressed(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    status.isMining,
    chain,
    isShortcutsOpen,
    handleToggleMining,
    handleToggleChain,
    showKeyFeedback,
    addLog
  ]);

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
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Navigation (Desktop Horizontal Tabs + Mobile Bottom Bar) */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMining={status.isMining}
        activeSharesCount={minerInfo.sharesInWindow}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardTab
            status={status}
            p2poolStats={p2poolStats}
            minerInfo={minerInfo}
            onToggleMining={handleToggleMining}
            onNavigate={setActiveTab}
            hashrateHistory={hashrateHistory}
            onAuditComplete={result => {
              addLog(
                'AGENT',
                'success',
                `RandomX audit complete: Epoch #${result.epoch} seed #${result.seedHeight.toLocaleString()} verified 100% accurate.`
              );
            }}
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

      {/* Desktop Standard Status Bar with Live Keyboard Hints */}
      <footer className="hidden md:flex items-center justify-between px-6 py-2 bg-slate-950 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 select-none sticky bottom-0 z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Hardware Keyboard Active
          </span>
          <span className="text-slate-700">|</span>
          <span>[1-6] Tabs</span>
          <span>[Space / M] Mine</span>
          <span>[C] Chain</span>
          <span>[+/-] Threads</span>
          <span>[←/→] Navigate</span>
        </div>
        <button
          id="btn-footer-shortcuts"
          onClick={() => setIsShortcutsOpen(true)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-orange-400 border border-slate-700/60 transition cursor-pointer"
        >
          <span>Press [?] Shortcuts Guide</span>
        </button>
      </footer>

      {/* Real-time Keypress Feedback Indicator Toast */}
      {toastKeyFeedback && (
        <div 
          id="keyboard-feedback-toast"
          className="fixed bottom-16 md:bottom-12 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-orange-500/50 shadow-2xl backdrop-blur-md text-xs font-mono text-slate-100 animate-slide-up"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <kbd className="px-2 py-0.5 rounded bg-orange-600/20 border border-orange-500/40 text-orange-400 font-bold">
            {toastKeyFeedback.key}
          </kbd>
          <span className="text-slate-300 font-medium">{toastKeyFeedback.action}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        lastKeyPressed={lastKeyPressed}
      />
    </div>
  );
}
