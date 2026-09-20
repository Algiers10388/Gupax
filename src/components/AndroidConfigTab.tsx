import React, { useState } from 'react';
import { 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ShieldAlert, 
  Battery, 
  Flame, 
  HelpCircle,
  Smartphone,
  Sliders,
  ChevronRight,
  FileCode2,
  Package
} from 'lucide-react';
import { ANDROID_SOC_PROFILES } from '../data/socProfiles';
import { AndroidSoCProfile, P2PoolChain } from '../types';

interface AndroidConfigTabProps {
  walletAddress: string;
  targetPool: string;
  chain: P2PoolChain;
  activeThreads: number;
}

export const AndroidConfigTab: React.FC<AndroidConfigTabProps> = ({
  walletAddress,
  targetPool,
  chain,
  activeThreads,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('snapdragon-8gen2');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedPip, setCopiedPip] = useState(false);
  const [selectedCores, setSelectedCores] = useState<number[]>([1, 2, 3, 4]); // Cores 1-4 for A715/A710

  const currentProfile = ANDROID_SOC_PROFILES.find(p => p.id === selectedProfileId) || ANDROID_SOC_PROFILES[0];

  // Toggle individual CPU core
  const toggleCore = (coreIndex: number) => {
    if (selectedCores.includes(coreIndex)) {
      if (selectedCores.length > 1) {
        setSelectedCores(selectedCores.filter(c => c !== coreIndex));
      }
    } else {
      setSelectedCores([...selectedCores, coreIndex].sort((a, b) => a - b));
    }
  };

  // Calculate hex CPU affinity mask from selected cores
  const calculateAffinity = (cores: number[]) => {
    let mask = 0;
    cores.forEach(c => {
      mask |= (1 << c);
    });
    return `0x${mask.toString(16)}`;
  };

  const affinityHex = calculateAffinity(selectedCores);

  // Generate Termux 1-click startup command
  const termuxScript = `#!/data/data/com.termux/files/usr/bin/bash
# ==========================================
# GUPAX MOBILE - Android XMRig / P2Pool Setup
# ==========================================
pkg update -y && pkg install -y git wget proot clang cmake make libuv

# Acquire Android WakeLock (prevents OS sleep)
termux-wake-lock

# Download / Compile XMRig for ARM64 Android
if [ ! -d "xmrig" ]; then
  git clone https://github.com/xmrig/xmrig.git
  mkdir -p xmrig/build && cd xmrig/build
  cmake .. -DWITH_HWLOC=OFF -DWITH_OPENCL=OFF -DWITH_CUDA=OFF
  make -j\$(nproc)
else
  cd xmrig/build
fi

# Launch XMRig tuned for ${currentProfile.name}
./xmrig \\
  -o ${targetPool || 'p2pmd.xmrvsbeast.com:3333'} \\
  -u ${walletAddress || 'YOUR_MONERO_WALLET_ADDRESS'} \\
  -p "gupax-android" \\
  -a rx/0 \\
  -t ${selectedCores.length} \\
  --cpu-affinity ${affinityHex} \\
  --http-enabled \\
  --http-port 18088 \\
  --http-host 0.0.0.0
`;

  // Generate XMRig config.json
  const generatedConfig = {
    autosave: true,
    "cpu": {
      "enabled": true,
      "huge-pages": false,
      "hw-aes": null,
      "priority": null,
      "memory-pool": false,
      "yield": true,
      "max-threads-hint": 100,
      "asm": true,
      "argon2-impl": null,
      "rx": selectedCores.map(c => [1, c]),
      "rx/wow": selectedCores.map(c => [1, c]),
      "cn-lite": false
    },
    "opencl": { "enabled": false },
    "cuda": { "enabled": false },
    "pools": [
      {
        "algo": "rx/0",
        "coin": "monero",
        "url": targetPool || "p2pmd.xmrvsbeast.com:3333",
        "user": walletAddress || "888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkFxbANsAnJYPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H",
        "pass": "gupax-android",
        "rig-id": null,
        "nicehash": false,
        "keepalive": true,
        "enabled": true,
        "tls": false
      }
    ],
    "http": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 18088,
      "access-token": null,
      "restricted": true
    }
  };

  const copyToClipboard = (text: string, isConfig: boolean) => {
    navigator.clipboard.writeText(text);
    if (isConfig) {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const downloadConfigFile = () => {
    const blob = new Blob([JSON.stringify(generatedConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 font-mono">
      {/* Introduction Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-bold text-white uppercase">Android ARM64 SoC Optimization Suite</h2>
        </div>
        <p className="text-xs text-slate-400 font-sans mt-1">
          Unlike desktop x86 CPUs, Android phones use <strong>big.LITTLE</strong> heterogeneous architectures. 
          Selecting the correct core affinity prevents overheating, avoids throttling, and keeps the Android interface responsive.
        </p>
      </div>

      {/* SoC Profile Selector */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 text-xs">
        <label className="block text-slate-300 font-bold uppercase tracking-wider">
          Step 1: Select Your Android Processor (SoC):
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ANDROID_SOC_PROFILES.map(soc => (
            <button
              key={soc.id}
              onClick={() => {
                setSelectedProfileId(soc.id);
                // set recommended cores based on profile
                if (soc.id.includes('8gen3') || soc.id.includes('8gen2')) {
                  setSelectedCores([1, 2, 3, 4]);
                } else if (soc.id.includes('888')) {
                  setSelectedCores([1, 2, 3]);
                } else {
                  setSelectedCores([2, 3, 4, 5]);
                }
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                selectedProfileId === soc.id
                  ? 'bg-orange-950/40 border-orange-500/80 text-orange-200 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-bold text-white text-[12px]">{soc.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{soc.manufacturer} • {soc.totalCores} Cores</div>
              <div className="text-[10px] text-orange-400 mt-1">Recommended: {soc.recommendedThreads} Threads</div>
            </button>
          ))}
        </div>

        {/* Profile Notes */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
          <strong className="text-orange-400">Tuning Note: </strong>
          <span className="font-sans">{currentProfile.notes}</span>
        </div>

        {/* Big.LITTLE Interactive Visual Core Map */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-bold uppercase">
              Step 2: Interactive CPU Core Allocation ({selectedCores.length} Cores Active, Mask: {affinityHex})
            </span>
            <span className="text-slate-400 text-[11px]">Click core to toggle</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
            {Array.from({ length: 8 }).map((_, idx) => {
              const isSelected = selectedCores.includes(idx);
              const isPrime = idx === 0 && currentProfile.coreLayout.prime > 0;
              const isEfficiency = idx >= 6;

              return (
                <button
                  key={idx}
                  onClick={() => toggleCore(idx)}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-orange-600 border-orange-400 text-white font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs">Core {idx}</span>
                  <span className="text-[9px] mt-0.5 opacity-80">
                    {isPrime ? 'Prime' : isEfficiency ? 'Eff' : 'Perf'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-600 inline-block" /> Active for XMRig
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-800 inline-block" /> Free for Android OS & UI
            </span>
          </div>
        </div>
      </div>

      {/* 1-Click Termux Script */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase">Termux 1-Click Mining Script</span>
          </div>
          <button
            onClick={() => copyToClipboard(termuxScript, false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-sans">
          Paste into Termux on your Android phone. Includes <code>termux-wake-lock</code> to keep mining with your screen off, plus embedded HTTP server for remote Gupax monitoring.
        </p>

        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-[11px] text-emerald-300 font-mono leading-relaxed">
          {termuxScript}
        </pre>
      </div>

      {/* XMRig config.json Generator */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-white uppercase">Generated config.json (XMRig for Android)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(generatedConfig, null, 2), true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={downloadConfigFile}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-[11px] text-amber-200/90 font-mono max-h-48 leading-relaxed">
          {JSON.stringify(generatedConfig, null, 2)}
        </pre>
      </div>

      {/* Pip Install & Standalone Python Application (Google Drive / Terminal Ready) */}
      <div className="rounded-xl bg-slate-900 border border-amber-500/30 p-5 space-y-4 text-xs shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase text-sm tracking-wide">Install with PIP (Python Package)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">v1.0.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Install as a system terminal command (<code className="text-amber-300 font-mono">gupax</code>) using Python's standard <code className="text-amber-300 font-mono">pip install</code>. No web browser needed.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a
              href="/gupax_mobile-1.0.0-py3-none-any.whl"
              download="gupax_mobile-1.0.0-py3-none-any.whl"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm"
              title="Download standard Python Wheel for pip install"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Wheel (.whl)</span>
            </a>
            <a
              href="/gupax_mobile-1.0.0.tar.gz"
              download="gupax_mobile-1.0.0.tar.gz"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
              title="Download source tarball for pip install"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Source (.tar.gz)</span>
            </a>
            <a
              href="/gupax_mobile.py"
              download="gupax_mobile.py"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
              title="Download standalone single-file python script"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Script (.py)</span>
            </a>
          </div>
        </div>

        {/* Pip Install Command Code Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Terminal PIP Installation:
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText('pip install gupax_mobile-1.0.0-py3-none-any.whl\n# Or run:\ngupax');
                setCopiedPip(true);
                setTimeout(() => setCopiedPip(false), 2000);
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition"
            >
              {copiedPip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPip ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-[11px] text-amber-200 font-mono leading-relaxed">
{`# 1. Install the downloaded package with pip
pip install gupax_mobile-1.0.0-py3-none-any.whl

# 2. Launch Gupax from anywhere in your terminal!
gupax

# (Or run as a module without installing)
python3 -m gupax_mobile`}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-bold text-amber-400">Android (Termux) Setup:</div>
            <p className="text-slate-400 font-sans">
              1. Run: <code className="text-amber-300 font-mono">pkg install python</code><br />
              2. Download or upload the <code className="text-amber-300 font-mono">.whl</code> to your device.<br />
              3. Run: <code className="text-amber-300 font-mono">pip install gupax_mobile-1.0.0-py3-none-any.whl</code><br />
              4. Type <code className="text-emerald-300 font-mono">gupax</code> to launch the interactive terminal UI.
            </p>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-bold text-amber-400">Google Drive / Colab / PC:</div>
            <p className="text-slate-400 font-sans">
              1. Upload the <code className="text-amber-300 font-mono">.whl</code> or <code className="text-amber-300 font-mono">.py</code> to your Google Drive folder.<br />
              2. In terminal/Colab: <code className="text-amber-300 font-mono">!pip install /path/to/gupax_mobile-1.0.0-py3-none-any.whl</code><br />
              3. Terminal controls: Press <kbd className="px-1 bg-slate-800 rounded">1-6</kbd> for tabs, <kbd className="px-1 bg-slate-800 rounded">Space</kbd> to mine, <kbd className="px-1 bg-slate-800 rounded">Q</kbd> to quit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
