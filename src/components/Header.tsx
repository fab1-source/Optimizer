import React from 'react';
import {
  ArrowLeft,
  Play,
  FileSpreadsheet,
  Cpu,
  Printer,
  RotateCcw,
  Lock,
  Unlock,
  Server,
  User,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { JobStatus, AppUser } from '../types';
import { SYSTEM_USERS } from '../data/users';

interface HeaderProps {
  jobSerial?: string;
  jobTitle?: string;
  jobStatus?: JobStatus;
  isLocked?: boolean;
  lockedBy?: string;
  onToggleLock?: () => void;
  currentUser?: AppUser;
  onSwitchUser?: (user: AppUser) => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  serverOnline?: boolean;
  onOpenServerModal?: () => void;
  onBackToDashboard: () => void;
  onRunOptimization: () => void;
  onOpenExcelPaste: () => void;
  onOpenCncExport: () => void;
  onOpenPrint: () => void;
  onStatusChange?: (status: JobStatus) => void;
  isOptimizing: boolean;
  totalPieces: number;
  totalSheetsUsed?: number;
  overallYield?: number;
  optimizedSheetsSummary?: Array<{ name: string; width: number; height: number; count: number }>;
}

export const Header: React.FC<HeaderProps> = ({
  jobSerial = 'JOB-1001',
  jobTitle = 'Cutting Job',
  jobStatus = 'draft',
  isLocked = false,
  lockedBy,
  onToggleLock,
  currentUser,
  onSwitchUser,
  onOpenLogin,
  onLogout,
  serverOnline = true,
  onOpenServerModal,
  onBackToDashboard,
  onRunOptimization,
  onOpenExcelPaste,
  onOpenCncExport,
  onOpenPrint,
  onStatusChange,
  isOptimizing,
  totalPieces,
  totalSheetsUsed,
  overallYield,
  optimizedSheetsSummary = [],
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  return (
    <header className="border-b border-[#2d3748] bg-[#141820] px-3 sm:px-4 py-2.5 text-[#e2e8f0] sticky top-0 z-30 shadow-md">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Back to Dashboard & Job Details */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-2.5 py-1.5 bg-[#181e28] hover:bg-[#222a38] text-slate-300 hover:text-white border border-slate-700 rounded flex items-center gap-1.5 transition text-xs font-medium cursor-pointer"
            title="Return to Jobs Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jobs Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-700 text-blue-300 font-mono text-xs font-bold">
              {jobSerial}
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[240px]">
              {jobTitle}
            </span>
            {isLocked && (
              <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/80 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">Locked</span>
              </span>
            )}
          </div>

          {/* Lock / Unlock Toggle Button */}
          {onToggleLock && (
            <button
              type="button"
              onClick={onToggleLock}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition border cursor-pointer ${
                isLocked
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-[#181d26] border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title={isLocked ? `Locked by ${lockedBy || 'User'}. Click to unlock.` : 'Lock job to prevent editing'}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold">Locked ({lockedBy || 'User'})</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Lock Job</span>
                </>
              )}
            </button>
          )}

          {/* Status selector */}
          {onStatusChange && (
            <select
              value={jobStatus}
              onChange={(e) => onStatusChange(e.target.value as JobStatus)}
              disabled={isLocked}
              className="bg-[#181d26] border border-slate-700 rounded px-2 py-0.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 hidden md:block"
            >
              <option value="draft">Draft</option>
              <option value="optimized">Optimized</option>
              <option value="ready_for_cnc">CNC Ready</option>
              <option value="completed">Completed</option>
            </select>
          )}
        </div>

        {/* Center: Live Performance KPI & Optimized Sheets */}
        {overallYield !== undefined && totalSheetsUsed !== undefined && (
          <div className="hidden xl:flex items-center gap-3 bg-[#181d26] border border-[#2d3748] px-3 py-1 rounded text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase">Yield:</span>
              <span
                className={`font-bold ${
                  overallYield >= 90 ? 'text-emerald-400' : 'text-blue-400'
                }`}
              >
                {overallYield}%
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase">Sheets:</span>
              <span className="font-bold text-slate-200">{totalSheetsUsed}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase">Panes:</span>
              <span className="font-bold text-slate-200">{totalPieces}</span>
            </div>

            {/* Clearly show optimized sheets (Qty & Size) */}
            {optimizedSheetsSummary.length > 0 && (
              <>
                <div className="h-3.5 w-px bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-300 text-[10px] uppercase font-bold tracking-wider">
                    Stock:
                  </span>
                  <div className="flex items-center gap-1">
                    {optimizedSheetsSummary.map((stk, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-600/70 text-amber-300 font-bold text-[11px]"
                      >
                        <span className="text-blue-200 mr-0.5">{stk.count}×</span>
                        {stk.width}×{stk.height}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Actions, Server LAN Badge & User Switcher */}
        <div className="flex items-center gap-2">
          {/* Server LAN Connection Status */}
          {onOpenServerModal && (
            <button
              type="button"
              onClick={onOpenServerModal}
              className="px-2 py-1 bg-[#131b26] hover:bg-[#1a2536] border border-blue-800/60 rounded flex items-center gap-1.5 text-xs text-blue-300 font-mono transition cursor-pointer"
              title="Click to view Server IP and connect other PCs on LAN"
            >
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Server LAN</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </button>
          )}

          {/* User Profile Switcher */}
          {currentUser && onSwitchUser && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="px-2.5 py-1 bg-[#181e28] hover:bg-[#222a38] border border-slate-700 rounded flex items-center gap-1.5 text-xs font-mono transition cursor-pointer"
                style={{ borderLeftColor: currentUser.color, borderLeftWidth: '3px' }}
                title="Switch active user profile"
              >
                <User className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-bold text-slate-200">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-[#141820] border border-[#2d3748] rounded shadow-2xl py-1 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 font-mono border-b border-[#2d3748]">
                    Switch User (Access Control)
                  </div>
                  {SYSTEM_USERS.map((usr) => (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(usr);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#1f2633] transition cursor-pointer ${
                        usr.id === currentUser.id ? 'bg-blue-950/50 font-bold text-white' : 'text-slate-300'
                      }`}
                    >
                      <span style={{ color: usr.color }}>{usr.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{usr.role}</span>
                    </button>
                  ))}
                  {onOpenLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full px-3 py-1.5 text-left text-[11px] border-t border-[#2d3748] text-blue-400 hover:text-blue-300 hover:bg-[#1f2633] transition flex items-center justify-between cursor-pointer"
                    >
                      <span>Switch / Log On Account...</span>
                      <User className="w-3 h-3 text-blue-400" />
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-1.5 text-left text-[11px] border-t border-[#2d3748] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>Log Out (Ask for Login)</span>
                      <LogOut className="w-3 h-3 text-rose-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paste from Excel */}
          <button
            type="button"
            onClick={onOpenExcelPaste}
            disabled={isLocked}
            className="px-2.5 py-1.5 bg-[#182a22] hover:bg-[#1f382d] disabled:opacity-40 disabled:pointer-events-none border border-emerald-700/60 text-emerald-300 hover:text-emerald-200 rounded flex items-center gap-1.5 transition text-xs font-medium cursor-pointer shadow-xs"
            title={isLocked ? 'Job is locked against editing' : 'Paste multiple glass sizes directly from Excel'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Paste Excel</span>
          </button>

          {/* Export to CNC */}
          <button
            type="button"
            onClick={onOpenCncExport}
            disabled={!overallYield}
            className="px-2.5 py-1.5 bg-[#1a2236] hover:bg-[#222d47] disabled:opacity-40 disabled:pointer-events-none border border-blue-700/60 text-blue-300 hover:text-blue-200 rounded flex items-center gap-1.5 transition text-xs font-medium cursor-pointer shadow-xs"
            title="Export DXF and G-Code for CNC glass cutting tables"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export CNC</span>
          </button>

          {/* Print Sheet Layouts / Export PDF */}
          <button
            type="button"
            onClick={onOpenPrint}
            disabled={!overallYield}
            className="px-2.5 py-1.5 bg-[#201d16] hover:bg-[#2c261c] disabled:opacity-40 disabled:pointer-events-none border border-amber-700/60 text-amber-300 hover:text-amber-200 rounded flex items-center gap-1.5 transition text-xs font-medium cursor-pointer shadow-xs"
            title="Print sheet layouts or export to PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Primary: Run Optimization */}
          <button
            type="button"
            onClick={onRunOptimization}
            disabled={isOptimizing || totalPieces === 0 || isLocked}
            className="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded flex items-center gap-1.5 transition text-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
            title={isLocked ? 'Job is locked against editing' : 'Run Guillotine Optimization'}
          >
            {isOptimizing ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Optimize Stock</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

