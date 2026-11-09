import React from 'react';
import { X, Keyboard, Check } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastKeyPressed?: string | null;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  lastKeyPressed,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 - 6', desc: 'Jump directly to Tab (Status, Miner, P2Pool, ARM Config, Nodes, Console)' },
    { key: '← / →', desc: 'Navigate between adjacent tabs' },
    { key: 'Space or M', desc: 'Start / Stop XMRig worker mining engine' },
    { key: 'C', desc: 'Toggle P2Pool sidechain between Mini and Main' },
    { key: '+ / -', desc: 'Increase or decrease active CPU mining threads' },
    { key: '? or H', desc: 'Open / Close this Keyboard Shortcuts help guide' },
    { key: 'Esc', desc: 'Close dialog or unfocus active text inputs' },
  ];

  return (
    <div 
      id="keyboard-shortcuts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          id="btn-close-shortcuts-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Keyboard Controls</h2>
            <p className="text-xs text-slate-400 font-mono">Full hardware & Bluetooth keyboard navigation supported</p>
          </div>
        </div>

        {/* Live Keypress Feedback Indicator */}
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Keyboard Input:
          </span>
          <span className="text-orange-400 font-bold px-2 py-0.5 rounded bg-orange-950/50 border border-orange-800/40">
            {lastKeyPressed ? `Key: [ ${lastKeyPressed} ]` : 'Waiting for keystroke...'}
          </span>
        </div>

        <div className="space-y-2 mb-6">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-orange-400 font-bold whitespace-nowrap shadow-sm text-[11px]">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Shortcuts disabled while typing in text inputs</span>
          <button
            id="btn-confirm-shortcuts"
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};
