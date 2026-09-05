import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GlassPiece,
  StockSheet,
  OptimizerSettings,
  OptimizationResult,
  Job,
  JobStatus,
} from './types';
import {
  DEFAULT_PIECES,
  DEFAULT_STOCK_SHEETS,
  COLOR_PALETTE,
} from './utils/presets';
import { optimizeGlassCutting } from './utils/optimizer';
import { Header } from './components/Header';
import { JobDashboard } from './components/JobDashboard';
import { GlassPieceTable } from './components/GlassPieceTable';
import { StockConfig } from './components/StockConfig';
import { SheetVisualizer } from './components/SheetVisualizer';
import { CutPlanDetails } from './components/CutPlanDetails';
import { ExcelPasteModal } from './components/ExcelPasteModal';
import { CncExportModal } from './components/CncExportModal';
import { PrintTicketModal } from './components/PrintTicketModal';
import { ServerConnectionModal } from './components/ServerConnectionModal';
import { UserLoginModal } from './components/UserLoginModal';
import { AppUser } from './types';
import { DEFAULT_ACTIVE_USER } from './data/users';
import {
  fetchServerInfo,
  fetchJobsFromServer,
  saveJobToServer,
  toggleJobLockOnServer,
  ServerInfo,
} from './utils/apiClient';
import { Layers, Sliders, Box, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'glass_optimizer_jobs_v2';

// Preloaded initial jobs
const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1001',
    serialNumber: 'JOB-1001',
    title: 'Commercial Glazing - Example Specification',
    client: 'Interglass Architectural',
    notes: 'Specification with multiple glass sizes: 1628x1060, 767x1092, 760x1060, 1720x2090',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'optimized',
    pieces: DEFAULT_PIECES,
    stockInventory: DEFAULT_STOCK_SHEETS.map((s) => ({ ...s, enabled: false })),
    settings: {
      kerf: 0,
      trimMargin: 0,
      allowRotationGlobal: true,
      strategy: 'auto-best',
      minReusableWidth: 400,
      minReusableHeight: 400,
    },
    result: null,
  },
  {
    id: 'job-1002',
    serialNumber: 'JOB-1002',
    title: 'Residential Balcony & Windows Batch',
    client: 'Skyline Contractors',
    notes: 'Mixed panels for high-rise residential building',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'draft',
    pieces: [
      {
        id: 'p-201',
        label: 'Balustrade Glass 1800x950',
        width: 1800,
        height: 950,
        qty: 4,
        allowRotation: true,
        color: '#0f3460',
      },
      {
        id: 'p-202',
        label: 'Window Fixed 1250x1400',
        width: 1250,
        height: 1400,
        qty: 6,
        allowRotation: true,
        color: '#164e63',
      },
      {
        id: 'p-203',
        label: 'Top Transom 650x1250',
        width: 650,
        height: 1250,
        qty: 4,
        allowRotation: true,
        color: '#1e3a8a',
      },
    ],
    stockInventory: DEFAULT_STOCK_SHEETS.map((s) => ({ ...s, enabled: false })),
    settings: {
      kerf: 0,
      trimMargin: 0,
      allowRotationGlobal: true,
      strategy: 'auto-best',
      minReusableWidth: 400,
      minReusableHeight: 400,
    },
    result: null,
  },
];

export default function App() {
  // Navigation: defaults directly to 'dashboard' so users open on the Dashboard
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('dashboard');

  // Active User Profile (User 1, User 2, or User 3)
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const saved = localStorage.getItem('active_glazing_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ACTIVE_USER;
  });

  // Central Company Server & LAN state
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginBanner, setLoginBanner] = useState<string | null>(null);

  // Jobs state with persistence
  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((j: any, idx: number) => ({
            id: j?.id || `job-${1000 + idx + 1}`,
            serialNumber: j?.serialNumber || `JOB-${1000 + idx + 1}`,
            title: j?.title || `Cutting Order #${idx + 1}`,
            client: j?.client || '',
            notes: j?.notes || '',
            createdAt: j?.createdAt || new Date().toISOString(),
            updatedAt: j?.updatedAt || new Date().toISOString(),
            status: j?.status || 'draft',
            locked: Boolean(j?.locked),
            lockedBy: j?.lockedBy || undefined,
            createdBy: j?.createdBy || 'User 1 (Admin)',
            pieces: Array.isArray(j?.pieces) ? j.pieces : [],
            stockInventory: Array.isArray(j?.stockInventory)
              ? j.stockInventory
              : DEFAULT_STOCK_SHEETS.map((s) => ({ ...s, enabled: false })),
            settings: j?.settings || {
              kerf: 0,
              trimMargin: 0,
              allowRotationGlobal: true,
              strategy: 'auto-best',
              minReusableWidth: 400,
              minReusableHeight: 400,
            },
            result: j?.result || null,
          }));
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_JOBS;
  });

  // Fetch Central Server Database on mount & sync
  useEffect(() => {
    fetchServerInfo().then((info) => {
      if (info) {
        setServerInfo(info);
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    });

    fetchJobsFromServer(jobs).then(({ jobs: serverJobs, online }) => {
      setServerOnline(online);
      if (serverJobs && serverJobs.length > 0) {
        setJobs(serverJobs);
        if (!serverJobs.some((j) => j.id === activeJobId)) {
          setActiveJobId(serverJobs[0].id);
        }
      }
    });
  }, []);

  // Handle User Log On / Profile Switch
  // Requirement: After logging on from User 1 or any other user, it MUST open on dashboard!
  const handleLoginUser = (user: AppUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('active_glazing_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    setIsLoginModalOpen(false);
    setCurrentView('dashboard'); // ALWAYS open on dashboard!
    setLoginBanner(`Logged on as ${user.name} (${user.role.toUpperCase()}) • Opened on Jobs Dashboard`);
    setTimeout(() => setLoginBanner(null), 4500);
  };

  // Active job ID (defaults to first job)
  const [activeJobId, setActiveJobId] = useState<string>(() => {
    return INITIAL_JOBS[0].id;
  });

  // Save jobs to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      // ignore
    }
  }, [jobs]);

  // Find active job object
  const activeJob = jobs.find((j) => j && j.id === activeJobId) || jobs[0] || INITIAL_JOBS[0];

  // Lock / Unlock toggle handler
  const handleToggleLock = async (jobId?: string) => {
    const targetId = jobId || activeJob.id;
    const targetJob = jobs.find((j) => j.id === targetId);
    if (!targetJob) return;

    const nextLockState = !targetJob.locked;
    const lockUserName = currentUser.name;

    // Optimistic local update
    setJobs((prevJobs) =>
      prevJobs.map((j) =>
        j.id === targetId
          ? {
              ...j,
              locked: nextLockState,
              lockedBy: nextLockState ? lockUserName : undefined,
              updatedAt: new Date().toISOString(),
            }
          : j
      )
    );

    // Sync to centralized server
    try {
      await toggleJobLockOnServer(targetId, nextLockState, lockUserName);
    } catch (err) {
      console.warn('Failed to sync lock status to server:', err);
    }
  };

  // Workspace sub-tab (Pieces vs Stock & Tolerances)
  const [leftTab, setLeftTab] = useState<'pieces' | 'stock'>('pieces');
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Modals
  const [isExcelPasteOpen, setIsExcelPasteOpen] = useState(false);
  const [isCncExportOpen, setIsCncExportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Helper to update active job in jobs array & sync to server
  const updateActiveJob = useCallback(
    (updater: (prev: Job) => Job) => {
      setJobs((prevJobs) => {
        const next = prevJobs.map((j) => {
          if (j.id === activeJob.id) {
            const updated = updater(j);
            // Async sync to server
            saveJobToServer(updated);
            return updated;
          }
          return j;
        });
        return next;
      });
    },
    [activeJob?.id]
  );

  // Run Optimization Calculation
  const runOptimization = useCallback(() => {
    if (!activeJob) return;
    setIsOptimizing(true);

    requestAnimationFrame(() => {
      try {
        const calculated = optimizeGlassCutting(
          activeJob.stockInventory,
          activeJob.pieces,
          activeJob.settings
        );

        updateActiveJob((j) => ({
          ...j,
          result: calculated,
          status: 'optimized',
          updatedAt: new Date().toISOString(),
        }));

        setActiveSheetIndex(0);
      } catch (err) {
        console.error('Optimization error:', err);
      } finally {
        setIsOptimizing(false);
      }
    });
  }, [activeJob, updateActiveJob]);

  // Trigger optimization if active job has no result yet
  useEffect(() => {
    if (activeJob && !activeJob.result && activeJob.pieces.length > 0) {
      runOptimization();
    }
  }, [activeJob?.id]);

  // Handlers for active job updates
  const handleUpdatePieces = (newPieces: GlassPiece[]) => {
    updateActiveJob((j) => ({
      ...j,
      pieces: newPieces,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateStockInventory = (newInventory: StockSheet[]) => {
    updateActiveJob((j) => ({
      ...j,
      stockInventory: newInventory,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateSettings = (newSettings: OptimizerSettings) => {
    updateActiveJob((j) => ({
      ...j,
      settings: newSettings,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleStatusChange = (status: JobStatus) => {
    updateActiveJob((j) => ({
      ...j,
      status,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Excel paste import
  const handleExcelImport = (importedPieces: GlassPiece[], replace: boolean) => {
    const updated = replace ? importedPieces : [...activeJob.pieces, ...importedPieces];
    handleUpdatePieces(updated);

    // Auto-run optimization on paste
    setTimeout(() => {
      try {
        const calculated = optimizeGlassCutting(
          activeJob.stockInventory,
          updated,
          activeJob.settings
        );
        updateActiveJob((j) => ({
          ...j,
          pieces: updated,
          result: calculated,
          status: 'optimized',
          updatedAt: new Date().toISOString(),
        }));
        setActiveSheetIndex(0);
      } catch (e) {
        console.error(e);
      }
    }, 100);
  };

  // Dashboard Job Actions
  const handleOpenJob = (jobId: string) => {
    setActiveJobId(jobId);
    setCurrentView('workspace');
  };

  const handleCreateJob = (newJobData: Partial<Job>) => {
    const newJob: Job = {
      id: `job-${Date.now()}`,
      serialNumber: newJobData.serialNumber || `JOB-${1000 + jobs.length + 1}`,
      title: newJobData.title || `Cutting Order #${jobs.length + 1}`,
      client: newJobData.client,
      notes: newJobData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      pieces: newJobData.pieces || [],
      stockInventory:
        newJobData.stockInventory ||
        DEFAULT_STOCK_SHEETS.map((s) => ({ ...s, enabled: false })),
      settings: {
        kerf: 0,
        trimMargin: 0,
        allowRotationGlobal: true,
        strategy: 'auto-best',
        minReusableWidth: 400,
        minReusableHeight: 400,
      },
      result: null,
    };

    setJobs((prev) => [newJob, ...prev]);
    setActiveJobId(newJob.id);
    setCurrentView('workspace');

    // Sync to company server
    saveJobToServer(newJob);

    // Run initial calculation if pieces exist
    if (newJob.pieces.length > 0) {
      setTimeout(() => {
        try {
          const res = optimizeGlassCutting(
            newJob.stockInventory,
            newJob.pieces,
            newJob.settings
          );
          setJobs((prev) =>
            prev.map((j) =>
              j.id === newJob.id ? { ...j, result: res, status: 'optimized' } : j
            )
          );
        } catch (e) {
          console.error(e);
        }
      }, 100);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (jobs.length <= 1) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (activeJobId === jobId) {
      const remaining = jobs.filter((j) => j.id !== jobId);
      if (remaining.length > 0) {
        setActiveJobId(remaining[0].id);
      }
    }
  };

  const handleDuplicateJob = (job: Job) => {
    // Generate next serial
    let highestNum = 1000;
    jobs.forEach((j) => {
      const match = j.serialNumber.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > highestNum) highestNum = num;
      }
    });

    const dup: Job = {
      ...job,
      id: `job-${Date.now()}`,
      serialNumber: `JOB-${highestNum + 1}`,
      title: `${job.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pieces: job.pieces.map((p, idx) => ({
        ...p,
        id: `p-${Date.now()}-${idx}`,
      })),
    };

    setJobs((prev) => [dup, ...prev]);
    setActiveJobId(dup.id);
  };

  // Active job values
  const activeStocks = (activeJob?.stockInventory || []).filter((s) => s.enabled === true);
  const primaryStock = activeStocks[0] || activeJob?.stockInventory?.[0] || DEFAULT_STOCK_SHEETS[0];
  const totalQuantity = (activeJob?.pieces || []).reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

  // Summarize optimized sheets by (Qty & Size) for clear top-right visibility
  // MUST execute before any conditional return to adhere to React Rules of Hooks
  const optimizedSheetsSummary = useMemo(() => {
    if (!activeJob?.result?.sheets || activeJob.result.sheets.length === 0) return [];
    const map = new Map<string, { name: string; width: number; height: number; count: number }>();
    activeJob.result.sheets.forEach((s) => {
      const key = `${s.width}x${s.height}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        const cleanName = s.sheetName.replace(/\s*#\d+.*$/, '');
        map.set(key, {
          name: cleanName,
          width: s.width,
          height: s.height,
          count: 1,
        });
      }
    });
    return Array.from(map.values());
  }, [activeJob?.result?.sheets]);

  // If on dashboard view, render JobDashboard
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#0f1115] text-[#e2e8f0] flex flex-col font-sans">
        {loginBanner && (
          <div className="fixed top-3 right-4 z-50 bg-blue-900/95 border border-blue-400 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{loginBanner}</span>
          </div>
        )}

        <JobDashboard
          jobs={jobs}
          onOpenJob={handleOpenJob}
          onCreateJob={handleCreateJob}
          onDuplicateJob={handleDuplicateJob}
          onToggleLock={handleToggleLock}
          onReturnToWorkspace={() => setCurrentView('workspace')}
          currentUser={currentUser}
          onSwitchUser={handleLoginUser}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          serverOnline={serverOnline}
          onOpenServerModal={() => setIsServerModalOpen(true)}
        />

        {/* Central Server LAN Connection Modal */}
        <ServerConnectionModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
          serverInfo={serverInfo}
          serverOnline={serverOnline}
          currentUser={currentUser}
          onSwitchUser={handleLoginUser}
        />

        {/* User Login & Switch Account Modal */}
        <UserLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLoginUser}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e8f0] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {loginBanner && (
        <div className="fixed top-3 right-4 z-50 bg-blue-900/95 border border-blue-400 text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{loginBanner}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        jobSerial={activeJob.serialNumber}
        jobTitle={activeJob.title}
        jobStatus={activeJob.status}
        isLocked={activeJob.locked}
        lockedBy={activeJob.lockedBy}
        onToggleLock={() => handleToggleLock(activeJob.id)}
        currentUser={currentUser}
        onSwitchUser={handleLoginUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        serverOnline={serverOnline}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onBackToDashboard={() => setCurrentView('dashboard')}
        onRunOptimization={runOptimization}
        onOpenExcelPaste={() => setIsExcelPasteOpen(true)}
        onOpenCncExport={() => setIsCncExportOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        onStatusChange={handleStatusChange}
        isOptimizing={isOptimizing}
        totalPieces={totalQuantity}
        totalSheetsUsed={activeJob.result?.totalSheetsUsed}
        overallYield={activeJob.result?.overallYield}
        optimizedSheetsSummary={optimizedSheetsSummary}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-2 sm:p-3 flex flex-col gap-2.5">
        {/* Uncrowded Stock Inventory Status Bar */}
        <div className="bg-[#141820] border border-[#2d3748] rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Selected Stock Sheets:
            </span>
            {activeStocks.length === 0 ? (
              <span className="text-amber-400 font-mono text-[11px] bg-amber-950/50 border border-amber-800/80 px-2 py-0.5 rounded font-bold">
                ⚠️ None selected. Please check your available sheet sizes in "Stock Sheets".
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeStocks.map((stk) => (
                  <span
                    key={stk.id}
                    className="px-2 py-0.5 rounded bg-[#1c2432] border border-blue-900/60 text-blue-300 font-mono text-[11px] font-semibold"
                  >
                    {stk.width} × {stk.height} mm
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Top Right of Status Bar: Optimized Sheets (Qty & Size) */}
          {optimizedSheetsSummary.length > 0 ? (
            <div className="flex items-center gap-2 bg-[#121c2b] border border-blue-500/80 px-2.5 py-1 rounded shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 font-mono">
                Optimized Sheets (Qty & Size):
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {optimizedSheetsSummary.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-[#1a2538] border border-blue-400/50 px-2 py-0.5 rounded font-bold text-slate-100"
                  >
                    <span className="text-emerald-400 font-extrabold bg-emerald-950 px-1 py-0.2 rounded">
                      {item.count}×
                    </span>
                    <span className="text-amber-300 font-extrabold">
                      {item.width} × {item.height} mm
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>
                Kerf: <strong className="text-slate-200 font-mono">{activeJob.settings.kerf} mm</strong>
              </span>
              <span>•</span>
              <span>
                Trim Margin:{' '}
                <strong className="text-slate-200 font-mono">
                  {activeJob.settings.trimMargin} mm
                </strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-medium">Guillotine Slicing</span>
            </div>
          )}
        </div>

        {/* Primary Two-Column Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
          {/* Left Column: Glass Pieces Input Table & Stock Settings (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {/* Tab switch for Left Column */}
            <div className="flex bg-[#141820] p-0.5 rounded border border-[#2d3748]">
              <button
                type="button"
                onClick={() => setLeftTab('pieces')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  leftTab === 'pieces'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cut List ({activeJob.pieces.length} sizes)</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('stock')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  leftTab === 'stock'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Stock Sheets ({activeStocks.length})</span>
              </button>
            </div>

            {leftTab === 'pieces' ? (
              <GlassPieceTable
                pieces={activeJob.pieces}
                onUpdatePieces={handleUpdatePieces}
                stocks={activeJob.stockInventory}
                selectedPieceId={hoveredPieceId}
                onSelectPiece={setHoveredPieceId}
                onOpenExcelPaste={() => setIsExcelPasteOpen(true)}
                isLocked={activeJob.locked}
              />
            ) : (
              <StockConfig
                stockInventory={activeJob.stockInventory}
                onUpdateStockInventory={handleUpdateStockInventory}
                settings={activeJob.settings}
                onUpdateSettings={handleUpdateSettings}
                isLocked={activeJob.locked}
              />
            )}
          </div>

          {/* Right Column: Visualizer Cutting Map & Production Details (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            {/* Visual Cutting Sheet Map */}
            <SheetVisualizer
              sheets={activeJob.result?.sheets || []}
              activeSheetIndex={activeSheetIndex}
              onSelectSheet={setActiveSheetIndex}
              hoveredPieceId={hoveredPieceId}
              onHoverPiece={setHoveredPieceId}
              stock={primaryStock}
              onOpenPrint={() => setIsPrintOpen(true)}
            />

            {/* Detailed Production & Execution Plan */}
            <CutPlanDetails
              result={activeJob.result}
              activeSheetIndex={activeSheetIndex}
              onSelectSheet={setActiveSheetIndex}
              stock={primaryStock}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2d3748] bg-[#0f1115] py-2 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px]">
            {activeJob.serialNumber} • {activeJob.title} • 2D Glass Guillotine Optimizer
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="text-blue-400 hover:text-blue-300 transition underline underline-offset-2 cursor-pointer"
            >
              ← Back to Jobs Dashboard
            </button>
            <span>•</span>
            <span className="text-slate-400">CNC CAM Export: DXF • G-Code • CSV</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExcelPasteModal
        isOpen={isExcelPasteOpen}
        onClose={() => setIsExcelPasteOpen(false)}
        onImport={handleExcelImport}
        existingCount={activeJob.pieces.length}
      />

      <CncExportModal
        isOpen={isCncExportOpen}
        onClose={() => setIsCncExportOpen(false)}
        result={activeJob.result}
        stock={primaryStock}
        jobSerial={activeJob.serialNumber}
      />

      <PrintTicketModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        result={activeJob.result}
        stock={primaryStock}
        jobSerial={activeJob.serialNumber}
        jobTitle={activeJob.title}
        client={activeJob.client}
        activeSheetIndex={activeSheetIndex}
      />

      {/* Central Server LAN Connection Modal */}
      <ServerConnectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        serverInfo={serverInfo}
        serverOnline={serverOnline}
        currentUser={currentUser}
        onSwitchUser={handleLoginUser}
      />

      {/* User Login & Switch Account Modal */}
      <UserLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLoginUser}
        currentUser={currentUser}
      />
    </div>
  );
}
