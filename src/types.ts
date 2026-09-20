/**
 * Types and interfaces for Gupax for Android
 */

export type GupaxTab = 'dashboard' | 'miner' | 'p2pool' | 'config' | 'nodes' | 'console';

export type P2PoolChain = 'mini' | 'main';

export interface MiningStatus {
  isMining: boolean;
  isP2PoolConnected: boolean;
  isNodeConnected: boolean;
  hashrate10s: number;
  hashrate60s: number;
  hashrate15m: number;
  peakHashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  totalHashes: number;
  uptimeSeconds: number;
  activeThreads: number;
  targetPool: string;
  chain: P2PoolChain;
  walletAddress: string;
}

export interface P2PoolLiveStats {
  chain: P2PoolChain;
  sidechainHeight: number;
  mainchainHeight: number;
  poolHashrate: number; // in H/s
  networkHashrate: number; // in H/s
  difficulty: number;
  activeMiners: number;
  blockRewardXMR: number;
  lastBlockFoundTime: string;
  blocksFound24h: number;
  pplnsWindowBlocks: number;
}

export interface MinerShareInfo {
  address: string;
  sharesInWindow: number;
  totalSharesFound: number;
  lastShareTimestamp: number;
  hashrateEstimate: number;
  unpaidBalanceXMR: number;
  totalPaidXMR: number;
  estimatedNextPayout: string;
}

export interface AndroidSoCProfile {
  id: string;
  name: string;
  manufacturer: string;
  totalCores: number;
  recommendedThreads: number;
  coreLayout: {
    prime: number;
    performance: number;
    efficiency: number;
  };
  cpuAffinityMask: string;
  notes: string;
}

export interface NodeEndpoint {
  id: string;
  name: string;
  host: string;
  port: number;
  type: 'p2pool' | 'daemon';
  chain?: P2PoolChain;
  location: string;
  latencyMs?: number | 'timeout' | 'checking';
  isOfficial?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'GUPAX' | 'P2POOL' | 'XMRIG' | 'DAEMON' | 'ANDROID';
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  isSupported: boolean;
}
