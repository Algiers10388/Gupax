import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  ArrowDown, 
  Filter 
} from 'lucide-react';
import { LogEntry } from '../types';

interface ConsoleTabProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({ logs, onClearLogs }) => {
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterSource !== 'ALL' && log.source !== filterSource) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.source}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceColor = (source: LogEntry['source']) => {
    switch (source) {
      case 'GUPAX':
        return 'text-purple-400 font-bold';
      case 'P2POOL':
        return 'text-cyan-400 font-bold';
      case 'XMRIG':
        return 'text-emerald-400 font-bold';
      case 'DAEMON':
        return 'text-sky-400 font-bold';
      case 'ANDROID':
        return 'text-amber-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-amber-300';
      case 'success':
        return 'text-emerald-300';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 font-mono">
      {/* Console Controls Header */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold text-white uppercase">Gupax Live Process Terminal</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1 text-xs rounded border transition cursor-pointer flex items-center gap-1 ${
                autoScroll
                  ? 'bg-orange-950/60 border-orange-800 text-orange-400 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              <span>Scroll Lock</span>
            </button>

            <button
              onClick={copyLogs}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClearLogs}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-red-950/80 hover:text-red-400 text-slate-400 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Clear terminal stream"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 text-xs">
          <div className="flex-1 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'GUPAX', 'P2POOL', 'XMRIG', 'DAEMON', 'ANDROID'].map(src => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  filterSource === src
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Retro Monospace Terminal Output Box */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 shadow-inner min-h-[380px] max-h-[550px] overflow-y-auto space-y-1.5 text-xs text-slate-300 leading-relaxed font-mono selection:bg-orange-500/40">
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-600 text-xs italic">
            No matching log lines
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 px-1 rounded transition">
              <span className="text-slate-600 select-none text-[11px] shrink-0">
                {log.timestamp}
              </span>
              <span className={`shrink-0 ${getSourceColor(log.source)}`}>
                [{log.source}]
              </span>
              <span className={`break-all ${getLevelColor(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
