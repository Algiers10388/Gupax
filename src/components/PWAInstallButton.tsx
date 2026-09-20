import React, { useState } from 'react';
import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed, show small badge
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Gupax App Installed</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-sm transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // Fallback for Android or iOS users where prompt isn't immediately ready
  return (
    <>
      <button
        id="pwa-guide-btn"
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition"
      >
        <Smartphone className="w-3.5 h-3.5 text-orange-400" />
        <span>Install PWA</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center gap-2 text-orange-400 mb-3">
              <Smartphone className="w-5 h-5" />
              <h3 className="text-base font-semibold text-white">Install Gupax on Android / Mobile</h3>
            </div>
            
            {isIOS ? (
              <p className="text-sm text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <div className="text-xs text-slate-300 space-y-2">
                <p>To run Gupax as a fullscreen native app on Android:</p>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 font-sans">
                  <p>1. Open Chrome menu (<strong>⋮</strong> three dots in top right).</p>
                  <p>2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                  <p>3. Gupax will launch standalone with persistent wakelock & background telemetry.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-lg bg-orange-600 hover:bg-orange-500 py-2 text-xs font-semibold text-white transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
