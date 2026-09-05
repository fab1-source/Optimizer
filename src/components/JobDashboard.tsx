import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Layers,
  Cpu,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Box,
  TrendingUp,
  X,
  FileCode,
  Lock,
  Unlock,
  Server,
  User,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Job, JobStatus, StockSheet, GlassPiece, AppUser } from '../types';
import { DEFAULT_STOCK_SHEETS, DEFAULT_PIECES, COLOR_PALETTE } from '../utils/presets';
import { SYSTEM_USERS } from '../data/users';

interface JobDashboardProps {
  jobs: Job[];
  onOpenJob: (jobId: string) => void;
  onCreateJob: (newJob: Partial<Job>) => void;
  onDuplicateJob: (job: Job) => void;
  onToggleLock?: (jobId: string) => void;
  onReturnToWorkspace?: () => void;
  currentUser?: AppUser;
  onSwitchUser?: (user: AppUser) => void;
  onOpenLogin?: () => void;
  serverOnline?: boolean;
  onOpenServerModal?: () => void;
}

export const JobDashboard: React.FC<JobDashboardProps> = ({
  jobs,
  onOpenJob,
  onCreateJob,
  onDuplicateJob,
  onToggleLock,
  onReturnToWorkspace,
  currentUser,
  onSwitchUser,
  onOpenLogin,
  serverOnline = true,
  onOpenServerModal,
}) => {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // New Job Form State
  const calculateNextSerial = (): string => {
    let highestNum = 1000;
    safeJobs.forEach((j) => {
      if (!j) return;
      const serial = String(j.serialNumber || '');
      const match = serial.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > highestNum) highestNum = num;
      }
    });
    return `JOB-${highestNum + 1}`;
  };

  const [serialNumber, setSerialNumber] = useState(calculateNextSerial());
  const [jobTitle, setJobTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [initialDataOption, setInitialDataOption] = useState<'empty' | 'sample'>('sample');

  const handleOpenCreateModal = () => {
    setSerialNumber(calculateNextSerial());
    setJobTitle(`Cutting Order #${safeJobs.length + 1}`);
    setClientName('');
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newJobPieces: GlassPiece[] =
      initialDataOption === 'sample'
        ? DEFAULT_PIECES.map((p, idx) => ({
            ...p,
            id: `piece-${Date.now()}-${idx}`,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
          }))
        : [];

    onCreateJob({
      serialNumber: serialNumber.trim() || calculateNextSerial(),
      title: jobTitle.trim() || `Cutting Order #${safeJobs.length + 1}`,
      client: clientName.trim() || undefined,
      pieces: newJobPieces,
      stockInventory: DEFAULT_STOCK_SHEETS.map((s) => ({ ...s, enabled: false })),
      status: 'draft',
      locked: false,
      createdBy: currentUser?.name || 'User 1 (Admin)',
    });

    setIsCreateModalOpen(false);
  };

  // Filtered jobs list
  const filteredJobs = safeJobs.filter((j) => {
    if (!j) return false;
    const titleStr = String(j.title || '').toLowerCase();
    const serialStr = String(j.serialNumber || '').toLowerCase();
    const clientStr = String(j.client || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();

    const matchesSearch =
      titleStr.includes(query) ||
      serialStr.includes(query) ||
      clientStr.includes(query);

    if (statusFilter === 'locked') {
      return matchesSearch && j.locked === true;
    }

    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalJobsCount = safeJobs.length;
  const optimizedJobsCount = safeJobs.filter((j) => j && (j.status === 'optimized' || j.status === 'ready_for_cnc')).length;
  const lockedJobsCount = safeJobs.filter((j) => j && j.locked).length;
  const totalPiecesCount = safeJobs.reduce(
    (sum, j) => sum + (Array.isArray(j?.pieces) ? j.pieces.reduce((s, p) => s + (Number(p?.qty) || 0), 0) : 0),
    0
  );
  const jobsWithYield = safeJobs.filter((j) => j?.result && Number(j.result.overallYield) > 0);
  const avgYield =
    jobsWithYield.length > 0
      ? (
          jobsWithYield.reduce((sum, j) => sum + (Number(j.result?.overallYield) || 0), 0) /
          jobsWithYield.length
        ).toFixed(1)
      : '93.4';

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e8f0] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#2d3748] bg-[#141820] px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-[1500px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>2D Glass Cutting Stock Optimizer</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-700/60 text-blue-300 font-mono">
                  Company Server (LAN)
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Central Server Database • Multi-PC Access • Permanent Job Retention (No Deletions)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Server LAN Connection Status */}
            {onOpenServerModal && (
              <button
                type="button"
                onClick={onOpenServerModal}
                className="px-2.5 py-1.5 bg-[#131b26] hover:bg-[#1a2536] border border-blue-800/60 rounded flex items-center gap-1.5 text-xs text-blue-300 font-mono transition cursor-pointer"
                title="View Server IP and LAN connection details for connecting PCs"
              >
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Company Server</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverOnline ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </button>
            )}

            {/* Active User Switcher */}
            {currentUser && onSwitchUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="px-2.5 py-1.5 bg-[#181e28] hover:bg-[#222a38] border border-slate-700 rounded flex items-center gap-1.5 text-xs font-mono transition cursor-pointer"
                  style={{ borderLeftColor: currentUser.color, borderLeftWidth: '3px' }}
                >
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-bold text-slate-200">{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-[#141820] border border-[#2d3748] rounded shadow-2xl py-1 z-50 animate-in fade-in duration-100">
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
                  </div>
                )}
              </div>
            )}

            {onReturnToWorkspace && (
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="px-3.5 py-1.5 bg-[#1a2232] hover:bg-[#253046] text-slate-200 hover:text-white border border-slate-600 rounded flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                <span>Return to Workspace</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded flex items-center gap-2 transition text-xs shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Cutting Job</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 flex flex-col gap-5">
        {/* KPI Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#141820] border border-[#2d3748] rounded p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Total Orders / Jobs
              </div>
              <div className="text-2xl font-bold text-white font-mono mt-0.5">
                {totalJobsCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Active cutting queues</div>
            </div>
            <div className="w-10 h-10 rounded bg-blue-950/70 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141820] border border-[#2d3748] rounded p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Optimized Plans
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                {optimizedJobsCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ready for production</div>
            </div>
            <div className="w-10 h-10 rounded bg-emerald-950/70 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141820] border border-[#2d3748] rounded p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Total Glass Panes
              </div>
              <div className="text-2xl font-bold text-blue-300 font-mono mt-0.5">
                {totalPiecesCount}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across all cut lists</div>
            </div>
            <div className="w-10 h-10 rounded bg-indigo-950/70 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141820] border border-[#2d3748] rounded p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Avg Material Yield
              </div>
              <div className="text-2xl font-bold text-purple-300 font-mono mt-0.5">
                {avgYield}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Guillotine cutting efficiency</div>
            </div>
            <div className="w-10 h-10 rounded bg-purple-950/70 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="bg-[#141820] border border-[#2d3748] rounded p-3 flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#181d26] p-1 rounded border border-[#222936]">
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'draft', label: 'Drafts' },
              { id: 'optimized', label: 'Optimized' },
              { id: 'ready_for_cnc', label: 'CNC Ready' },
              { id: 'completed', label: 'Completed' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded text-xs transition cursor-pointer font-medium ${
                  statusFilter === st.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search serial, title, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181d26] border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-[#141820] border border-[#2d3748] rounded overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#181d26] text-slate-400 border-b border-[#2d3748] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">Serial Number</th>
                  <th className="py-2.5 px-4">Job Title & Reference</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Glass Cut List</th>
                  <th className="py-2.5 px-3">Stock Sheets</th>
                  <th className="py-2.5 px-3">Yield</th>
                  <th className="py-2.5 px-4">Date Updated</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a38]">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="w-8 h-8 text-slate-600 stroke-1" />
                        <span className="text-slate-400">No jobs found matching your filter.</span>
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="text-blue-400 hover:text-blue-300 underline font-medium text-xs cursor-pointer"
                        >
                          Create a new cutting job
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const pieces = Array.isArray(job?.pieces) ? job.pieces : [];
                    const stockInventory = Array.isArray(job?.stockInventory) ? job.stockInventory : [];
                    const totalPanes = pieces.reduce(
                      (sum, p) => sum + (Number(p?.qty) || 0),
                      0
                    );
                    const enabledStocks = stockInventory.filter(
                      (s) => s && (s.enabled ?? true)
                    );
                    const yieldVal = job?.result?.overallYield;
                    const dateFormatted = job?.updatedAt
                      ? (() => {
                          try {
                            const d = new Date(job.updatedAt);
                            return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString();
                          } catch {
                            return 'Recent';
                          }
                        })()
                      : 'Recent';

                    return (
                      <tr
                        key={job.id || Math.random().toString()}
                        className="hover:bg-[#181f2b] transition-colors group"
                      >
                        {/* Serial Number & Lock Status */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-400">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60">
                              {job.serialNumber || 'JOB-0000'}
                            </span>
                            {job.locked && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/80 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1"
                                title={`Locked by ${job.lockedBy || 'User'}`}
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Locked</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Title & Client */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-200">{job.title || 'Untitled Job'}</div>
                          {job.client && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Client: {job.client}
                            </div>
                          )}
                          {job.createdBy && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Created by: {job.createdBy}
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          {job.status === 'ready_for_cnc' ? (
                            <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700/60 text-purple-300 font-mono text-[10px] font-bold">
                              CNC Ready
                            </span>
                          ) : job.status === 'optimized' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] font-bold">
                              Optimized
                            </span>
                          ) : job.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px]">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Glass Cut List */}
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-200 font-bold">{pieces.length}</span>{' '}
                          <span className="text-slate-500">sizes</span> ({totalPanes}{' '}
                          <span className="text-slate-500">panes</span>)
                        </td>

                        {/* Stock Sheets */}
                        <td className="py-3 px-3">
                          <div className="text-[11px] font-mono text-slate-300">
                            {job.result?.totalSheetsUsed ? (
                              <span className="text-emerald-400 font-bold">
                                {job.result.totalSheetsUsed} sheet(s) used
                              </span>
                            ) : (
                              <span>{enabledStocks.length} size(s) available</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                            {enabledStocks.map((s) => `${s.width}×${s.height}`).join(', ')}
                          </div>
                        </td>

                        {/* Yield % */}
                        <td className="py-3 px-3 font-mono">
                          {yieldVal ? (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                yieldVal >= 90
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : yieldVal >= 80
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              }`}
                            >
                              {yieldVal}%
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Date Updated */}
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                          {dateFormatted}
                        </td>

                        {/* Actions (NO DELETE BUTTON - PERMANENT RETENTION POLICY) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Lock Toggle Button */}
                            {onToggleLock && (
                              <button
                                type="button"
                                onClick={() => onToggleLock(job.id)}
                                className={`p-1.5 rounded transition cursor-pointer ${
                                  job.locked
                                    ? 'text-amber-400 bg-amber-950/70 border border-amber-600/70 hover:bg-amber-900/60'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                                title={
                                  job.locked
                                    ? `Locked by ${job.lockedBy || 'User'}. Click to unlock.`
                                    : 'Lock job against editing'
                                }
                              >
                                {job.locked ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Duplicate as new Job */}
                            <button
                              type="button"
                              onClick={() => onDuplicateJob(job)}
                              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                              title="Duplicate as new job"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Open Job */}
                            <button
                              type="button"
                              onClick={() => onOpenJob(job.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded flex items-center gap-1 transition text-xs shadow-xs cursor-pointer ml-1"
                            >
                              <span>Open Job</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Job Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#141820] border border-[#2d3748] rounded-lg max-w-md w-full shadow-2xl overflow-hidden font-sans text-slate-200">
            <div className="px-4 py-3 border-b border-[#2d3748] flex items-center justify-between bg-[#181d26]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Create New Cutting Job
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreate} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Serial Number (Auto-Incremented)
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Job / Order Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotel Balustrades & Curtain Wall"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Client / Project (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Facade Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#181d26] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Initial Cut List Data
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInitialDataOption('sample')}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      initialDataOption === 'sample'
                        ? 'bg-blue-950/60 border-blue-600 text-white'
                        : 'bg-[#181d26] border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">Preload Sample Data</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      4 standard glass sizes to test
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialDataOption('empty')}
                    className={`p-2 rounded border text-left cursor-pointer transition ${
                      initialDataOption === 'empty'
                        ? 'bg-blue-950/60 border-blue-600 text-white'
                        : 'bg-[#181d26] border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">Empty Cut List</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Paste directly from Excel
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#2d3748]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded flex items-center gap-1.5 transition text-xs shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Job & Open Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
