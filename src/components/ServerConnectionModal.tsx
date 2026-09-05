import React, { useState } from 'react';
import {
  Server,
  Network,
  Users,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Monitor,
  HardDrive
} from 'lucide-react';
import { ServerInfo } from '../utils/apiClient';
import { AppUser } from '../types';
import { SYSTEM_USERS } from '../data/users';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverInfo: ServerInfo | null;
  serverOnline: boolean;
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isOpen,
  onClose,
  serverInfo,
  serverOnline,
  currentUser,
  onSwitchUser,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const primaryUrl = serverInfo?.primaryUrl || `http://localhost:3000`;
  const localIps = serverInfo?.localIps || ['127.0.0.1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#141820] border border-[#2d3748] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans text-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#181d26] border-b border-[#2d3748] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-950/80 border border-blue-600/50 flex items-center justify-center text-blue-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Company Central Server & Multi-PC Setup</span>
                {serverOnline ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online & Synchronized
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Local Mode
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                1 Company Server • 4 Connected Client PCs • Centralized Data Storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Active User Switcher */}
          <div className="bg-[#181e28] border border-blue-900/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Current Active User / Role:
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-bold font-mono"
                style={{ backgroundColor: `${currentUser.color}25`, color: currentUser.color, border: `1px solid ${currentUser.color}60` }}
              >
                {currentUser.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {SYSTEM_USERS.map((usr) => {
                const isCurrent = usr.id === currentUser.id;
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => onSwitchUser(usr)}
                    className={`p-2.5 rounded border text-left transition flex flex-col gap-1 cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-950/70 border-blue-500 text-white shadow-sm'
                        : 'bg-[#12161f] border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs" style={{ color: usr.color }}>
                        {usr.name}
                      </span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Role: {usr.role.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {usr.role === 'admin' && 'Full control, lock & unlock'}
                      {usr.role === 'planner' && 'Create jobs, edit cut lists'}
                      {usr.role === 'operator' && 'View, print tickets, CNC cuts'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Centralized Server Storage */}
          <div className="bg-[#181d26] border border-[#2d3748] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Server Data Storage:
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              All jobs, cutting layouts, glass piece lists, and optimization results are stored centrally on the server at <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">./data/jobs.json</code>.
              When any PC creates or updates a job, all other 4 PCs are updated automatically.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono bg-[#11141b] p-2 rounded border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Job Deletion Protection: Active (Company policy prevents job deletion once created).</span>
            </div>
          </div>

          {/* How to Connect 4 PCs */}
          <div className="bg-[#181d26] border border-[#2d3748] rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Connecting the 4 PCs to this Server:
              </span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-300">
              <p>On your 4 company workstations, open Chrome, Edge, or Firefox and enter this server's LAN address:</p>

              <div className="space-y-1.5">
                {localIps.map((ip) => {
                  const url = `http://${ip}:3000`;
                  const isCopied = copiedUrl === url;
                  return (
                    <div
                      key={ip}
                      className="flex items-center justify-between bg-[#0e1218] border border-blue-900/60 rounded p-2 font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-blue-300 font-bold">{url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(url)}
                        className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 rounded flex items-center gap-1 transition text-[10px] cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Steps */}
            <div className="border-t border-slate-700/60 pt-2.5 space-y-1 text-[11px] text-slate-400">
              <div className="font-bold text-slate-300">How to run on the Server PC:</div>
              <ol className="list-decimal list-inside space-y-1 font-mono text-[10px] text-slate-300">
                <li>Download or <code className="text-amber-300">git clone</code> the project on your company server PC</li>
                <li>Open terminal in project folder and run: <code className="text-emerald-400">npm install</code></li>
                <li>Start the server with: <code className="text-emerald-400">npm run dev</code> (or <code className="text-emerald-400">npm run build && npm start</code>)</li>
                <li>Ensure Windows Defender Firewall permits incoming connections on Port 3000</li>
              </ol>
            </div>
          </div>

          {/* Job Locking Feature */}
          <div className="bg-[#181d26] border border-[#2d3748] rounded-lg p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Locking & Read-Only Protection:
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Use the <strong className="text-amber-300">Lock</strong> button on any job once production is planned. Locked jobs cannot be modified or overwritten by other users, but can be viewed, printed for shop floor execution, and exported to CNC cutting machines safely.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#181d26] border-t border-[#2d3748] flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            Server: {serverInfo?.serverHost || 'Localhost'} • Port: 3000
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
