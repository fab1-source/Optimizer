import React from 'react';
import {
  Layers,
  Shield,
  ArrowRight,
  Server,
  HardDrive,
  Users,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Cpu,
  Printer,
} from 'lucide-react';
import { AppUser } from '../types';
import { SYSTEM_USERS } from '../data/users';
import { ServerInfo } from '../utils/apiClient';

interface LoginScreenProps {
  onSelectUser: (user: AppUser) => void;
  serverInfo?: ServerInfo | null;
  serverOnline?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSelectUser,
  serverInfo,
  serverOnline = true,
}) => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-3xl w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand & Server Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-xl shadow-blue-950/40">
            <Layers className="w-9 h-9" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              2D Glass Cutting Stock Optimizer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Company Central Server • Multi-PC Workshop Production System
            </p>
          </div>

          {/* Server Connection Status Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131923] border border-slate-700/80 text-xs font-mono text-slate-300 shadow-inner">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                serverOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-white">
              {serverOnline ? 'Central Server Online' : 'Local Standalone Mode'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              Database: <code className="text-blue-300 font-bold">./data/jobs.json</code>
            </span>
            {serverInfo?.primaryUrl && (
              <>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">
                  LAN Port: <code className="text-emerald-300 font-bold">3000</code>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Login Selection Card */}
        <div className="bg-[#121620] border border-[#273244] rounded-2xl shadow-2xl p-5 sm:p-7 space-y-5">
          <div className="border-b border-[#232d3d] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Select Account to Log On
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose your role to open the centralized <strong>Jobs Dashboard</strong>
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Auto-opens on Dashboard
            </span>
          </div>

          {/* User Account Selection Buttons */}
          <div className="grid grid-cols-1 gap-3.5">
            {SYSTEM_USERS.map((usr) => {
              return (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => onSelectUser(usr)}
                  className="p-4 rounded-xl border border-slate-700/80 bg-[#161c28] hover:bg-[#1d2536] hover:border-blue-500/80 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left group cursor-pointer shadow-md hover:shadow-blue-950/30"
                  style={{ borderLeftWidth: '5px', borderLeftColor: usr.color }}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold font-mono shrink-0 shadow-inner"
                      style={{
                        backgroundColor: `${usr.color}25`,
                        color: usr.color,
                        border: `1px solid ${usr.color}50`,
                      }}
                    >
                      {usr.id.toUpperCase().replace('USER', 'U')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-white text-base group-hover:text-blue-300 transition">
                          {usr.name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: `${usr.color}20`,
                            color: usr.color,
                            border: `1px solid ${usr.color}40`,
                          }}
                        >
                          {usr.role}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {usr.id === 'user1' && (
                          <>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Shield className="w-3.5 h-3.5 text-blue-400" />
                              Full Administrative Control
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              Lock & Unlock Orders
                            </span>
                          </>
                        )}
                        {usr.id === 'user2' && (
                          <>
                            <span className="flex items-center gap-1 text-slate-300">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                              Cut Lists & Excel Import
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-blue-400" />
                              2D Guillotine Optimizer
                            </span>
                          </>
                        )}
                        {usr.id === 'user3' && (
                          <>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Layers className="w-3.5 h-3.5 text-amber-400" />
                              Workshop Cutting Diagram
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Printer className="w-3.5 h-3.5 text-purple-400" />
                              Print Tickets & CNC CAM
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-blue-400 group-hover:text-white bg-blue-950/40 group-hover:bg-blue-600 px-3.5 py-2 rounded-lg border border-blue-800/60 group-hover:border-blue-500 transition-all shrink-0">
                    <span>Log On as {usr.name}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Permanent Storage Guarantee Note */}
          <div className="rounded-xl bg-[#0f131c] border border-slate-800/80 p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
            <Server className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-slate-300 font-semibold">
                Centralized Server Persistence & Permanent Job Retention
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All jobs are stored permanently on this server in{' '}
                <code className="text-blue-300 font-mono font-bold">./data/jobs.json</code>.
                Deleting jobs is permanently disabled to protect production records. You can lock completed
                jobs to prevent further edits.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-PC LAN Guide Box */}
        <div className="bg-[#10141d]/70 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-700/60 text-blue-300 text-[10px] font-bold uppercase">
              Multi-PC LAN
            </span>
            <span>
              Connected PCs (PC 1 to PC 4) can open:{' '}
              <span className="text-white font-bold">
                {serverInfo?.primaryUrl || 'http://<SERVER-IP>:3000'}
              </span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Node.js Port 3000 • Simultaneous Multi-User Access
          </div>
        </div>
      </div>
    </div>
  );
};
