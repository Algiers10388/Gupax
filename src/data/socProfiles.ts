import { AndroidSoCProfile, NodeEndpoint } from '../types';

export const ANDROID_SOC_PROFILES: AndroidSoCProfile[] = [
  {
    id: 'snapdragon-8gen3',
    name: 'Snapdragon 8 Gen 3 (SM8650)',
    manufacturer: 'Qualcomm',
    totalCores: 8,
    recommendedThreads: 4,
    coreLayout: {
      prime: 1, // Cortex-X4 @ 3.3 GHz
      performance: 5, // 3x Cortex-A720 @ 3.15 GHz + 2x Cortex-A720 @ 2.96 GHz
      efficiency: 2, // Cortex-A520 @ 2.27 GHz
    },
    cpuAffinityMask: '0x3c', // Cores 2, 3, 4, 5
    notes: 'Allocate 4 performance cores. Leave Cortex-X4 prime and Cortex-A520 efficiency cores free to prevent thermal throttling and keep Android UI smooth.',
  },
  {
    id: 'snapdragon-8gen2',
    name: 'Snapdragon 8 Gen 2 (SM8550)',
    manufacturer: 'Qualcomm',
    totalCores: 8,
    recommendedThreads: 4,
    coreLayout: {
      prime: 1, // Cortex-X3 @ 3.2 GHz
      performance: 4, // 2x A715 + 2x A710
      efficiency: 3, // A510
    },
    cpuAffinityMask: '0x1e', // Cores 1, 2, 3, 4
    notes: 'Excellent RandomX efficiency. 4 threads across the A715/A710 cluster yield ~900-1,400 H/s with mild thermals on passive cooling.',
  },
  {
    id: 'snapdragon-888-870',
    name: 'Snapdragon 888 / 870 / 865',
    manufacturer: 'Qualcomm',
    totalCores: 8,
    recommendedThreads: 3,
    coreLayout: {
      prime: 1, // Kryo 680 / 585
      performance: 3, // Kryo Gold
      efficiency: 4, // Kryo Silver
    },
    cpuAffinityMask: '0x0e', // Cores 1, 2, 3
    notes: 'Snapdragon 888 tends to run hot. Limit to 3 threads on Gold cluster. External magnetic fan or desk stand strongly advised for continuous runs.',
  },
  {
    id: 'google-tensor-g3-g4',
    name: 'Google Tensor G3 / G4 (Pixel 8 / 9)',
    manufacturer: 'Google',
    totalCores: 9,
    recommendedThreads: 4,
    coreLayout: {
      prime: 1, // Cortex-X3 / X4
      performance: 4, // Cortex-A715 / A720
      efficiency: 4, // Cortex-A510 / A520
    },
    cpuAffinityMask: '0x1e',
    notes: 'Pixel devices feature tight thermal governors. 4 threads on A715 cluster give optimal balance between ~750 H/s and stable 38°C battery temp.',
  },
  {
    id: 'mediatek-dimensity-9000',
    name: 'MediaTek Dimensity 9000 / 9200 / 9300',
    manufacturer: 'MediaTek',
    totalCores: 8,
    recommendedThreads: 4,
    coreLayout: {
      prime: 1, // Cortex-X2 / X3 / X4
      performance: 3, // Cortex-A710 / A715
      efficiency: 4, // Cortex-A510
    },
    cpuAffinityMask: '0x0e',
    notes: 'Solid ARMv9 execution. Dimensity chips hold stable clocks under sustained workloads with 3-4 threads.',
  },
  {
    id: 'generic-arm64',
    name: 'Generic ARM64 Octa-Core (All Brands)',
    manufacturer: 'Universal ARM',
    totalCores: 8,
    recommendedThreads: 4,
    coreLayout: {
      prime: 0,
      performance: 4,
      efficiency: 4,
    },
    cpuAffinityMask: '0xf0', // Upper 4 cores
    notes: 'Universal safe configuration for any modern Android smartphone or tablet. Balances 50% CPU allocation to prevent phone freeze.',
  },
];

export const CURATED_NODES: NodeEndpoint[] = [
  {
    id: 'p2pool-mini-community',
    name: 'P2Pool Mini Public Stratum (EU)',
    host: 'p2pmd.xmrvsbeast.com',
    port: 3333,
    type: 'p2pool',
    chain: 'mini',
    location: 'Frankfurt, Germany',
    isOfficial: true,
  },
  {
    id: 'p2pool-mini-us',
    name: 'P2Pool Mini Stratum (US East)',
    host: 'us.p2pool.observer',
    port: 3333,
    type: 'p2pool',
    chain: 'mini',
    location: 'Ashburn, USA',
    isOfficial: false,
  },
  {
    id: 'p2pool-main-community',
    name: 'P2Pool Main Public Stratum',
    host: 'p2pool.io',
    port: 3333,
    type: 'p2pool',
    chain: 'main',
    location: 'Amsterdam, NL',
    isOfficial: true,
  },
  {
    id: 'monero-rino-rpc',
    name: 'Rino Community Monero Daemon',
    host: 'node.community.rino.io',
    port: 18081,
    type: 'daemon',
    location: 'Decentralized High-Speed',
    isOfficial: true,
  },
  {
    id: 'monero-xmrpt-rpc',
    name: 'XMR.pt Public Remote Node',
    host: 'node.xmr.pt',
    port: 18081,
    type: 'daemon',
    location: 'Lisbon, Portugal',
    isOfficial: false,
  },
  {
    id: 'gupax-lan-bridge',
    name: 'Local Network Gupax / Desktop PC',
    host: '192.168.1.100',
    port: 3333,
    type: 'p2pool',
    chain: 'mini',
    location: 'Home WiFi / LAN Bridge',
    isOfficial: false,
  },
];
