import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  PackedSheet,
  PlacedPiece,
  CutLine,
  StockSheet,
} from '../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  LayoutGrid,
  Box,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { SingleSheetSvg } from './SingleSheetSvg';

interface SheetVisualizerProps {
  sheets: PackedSheet[];
  activeSheetIndex: number;
  onSelectSheet: (index: number) => void;
  hoveredPieceId?: string | null;
  onHoverPiece?: (id: string | null) => void;
  stock: StockSheet;
  onOpenPrint?: () => void;
}

export const SheetVisualizer: React.FC<SheetVisualizerProps> = ({
  sheets,
  activeSheetIndex,
  onSelectSheet,
  hoveredPieceId,
  onHoverPiece,
  onOpenPrint,
}) => {
  const currentSheet = sheets[activeSheetIndex];

  // View Mode: 'single' focus view vs 'multi' side-by-side view
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single');

  // Multi-View cluster control: number of sheets shown at once
  const [sheetsPerPage, setSheetsPerPage] = useState<number | 'all'>(4);
  const [multiViewPage, setMultiViewPage] = useState<number>(0);

  // Visual toggles
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showOffcutLabels, setShowOffcutLabels] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [inspectPiece, setInspectPiece] = useState<PlacedPiece | null>(null);

  // Step-by-Step Guillotine Cut Simulator (single view)
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(999);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset simulation when sheet changes
  useEffect(() => {
    if (currentSheet) {
      setCurrentStep(currentSheet.cutLines.length || 999);
      setSimulationActive(false);
      setIsPlaying(false);
    }
  }, [activeSheetIndex, sheets]);

  // Simulation playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentSheet) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= currentSheet.cutLines.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentSheet]);

  // Summarize optimized sheets by (Qty & Size) for clear top-right display
  const optimizedSheetsSummary = useMemo(() => {
    if (!sheets || sheets.length === 0) return [];
    const map = new Map<string, { name: string; width: number; height: number; count: number }>();
    sheets.forEach((s) => {
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
  }, [sheets]);

  if (!currentSheet) {
    return (
      <div className="bg-[#141820] border border-[#2d3748] rounded p-12 text-center text-slate-500 font-mono text-xs shadow-sm">
        No cutting plan calculated yet. Click "GENERATE CUT PLAN" to optimize.
      </div>
    );
  }

  // Filter cut lines based on simulation step
  const visibleCutLines = simulationActive
    ? currentSheet.cutLines.filter((cl) => cl.stepNumber <= currentStep)
    : currentSheet.cutLines;

  // Pagination calculations for Multi-View
  const totalSheets = sheets.length;
  const pageSize = sheetsPerPage === 'all' ? totalSheets : sheetsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalSheets / pageSize));
  const startIdx = multiViewPage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalSheets);
  const visibleSheetsInMultiView = sheets.slice(startIdx, endIdx);

  return (
    <div className="bg-[#141820] border border-[#2d3748] rounded shadow-sm flex flex-col overflow-hidden text-[#e2e8f0]">
      {/* Visualizer Header: View Selector & TOP RIGHT Optimized Sheets Summary */}
      <div className="p-2.5 border-b border-[#2d3748] bg-[#0c0f14] flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Single vs Multi-View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#161c26] p-0.5 rounded border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Single Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('multi')}
              className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'multi'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Multi-View (Side-by-Side)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            ({sheets.length} {sheets.length === 1 ? 'Sheet' : 'Sheets'} total)
          </span>
        </div>

        {/* TOP RIGHT: Optimized Sheets (Qty & Size) Clearly Displayed and Easy to Find */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#131b28] border-2 border-blue-500/70 rounded-md px-3 py-1.5 flex items-center gap-2.5 shadow-md">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-300 font-mono tracking-wider">
              <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Optimized Sheets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {optimizedSheetsSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 bg-[#1b263b] border border-blue-400/50 px-2 py-0.5 rounded font-mono text-xs font-bold text-white shadow-xs"
                >
                  <span className="bg-blue-600 text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded shadow-2xs">
                    {item.count}×
                  </span>
                  <span className="text-amber-300 font-extrabold tracking-wide">
                    {item.width} × {item.height} mm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mode-Specific Sub-Header Bar */}
      {viewMode === 'single' ? (
        /* Single View Sub-Bar: Sheet Carousel & Controls */
        <div className="p-2 border-b border-[#2d3748] bg-[#0f1115] flex flex-wrap items-center justify-between gap-2">
          {/* Sheet Carousel / Selector */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectSheet(Math.max(0, activeSheetIndex - 1))}
              disabled={activeSheetIndex === 0}
              className="p-1 rounded bg-[#1e2533] hover:bg-[#2d3748] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Previous sheet"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1">
              {sheets.map((s, idx) => (
                <button
                  key={s.sheetId}
                  type="button"
                  onClick={() => onSelectSheet(idx)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded transition flex items-center gap-1.5 cursor-pointer ${
                    idx === activeSheetIndex
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#1e2533] text-slate-400 hover:text-slate-200 hover:bg-[#2d3748]'
                  }`}
                >
                  <span>Sheet {idx + 1}</span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded ${
                      idx === activeSheetIndex ? 'bg-blue-700 text-blue-100' : 'bg-[#0f1115] text-slate-400'
                    }`}
                  >
                    {s.yieldPercentage}%
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSelectSheet(Math.min(sheets.length - 1, activeSheetIndex + 1))}
              disabled={activeSheetIndex === sheets.length - 1}
              className="p-1 rounded bg-[#1e2533] hover:bg-[#2d3748] text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Next sheet"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Controls & Toggles */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Cut Lines */}
            <button
              type="button"
              onClick={() => setShowCutLines(!showCutLines)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border transition cursor-pointer ${
                showCutLines
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  : 'bg-[#1e2533] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Show or hide straight guillotine cut lines"
            >
              <Scissors className="w-2.5 h-2.5" />
              <span>Cut Lines</span>
            </button>

            {/* Toggle Dimensions */}
            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border transition cursor-pointer ${
                showDimensions
                  ? 'bg-blue-950/40 border-blue-800/80 text-blue-300'
                  : 'bg-[#1e2533] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Show dimensions text on glass panels"
            >
              <span>Dims</span>
            </button>

            {/* Toggle Usable Offcuts */}
            <button
              type="button"
              onClick={() => setShowOffcutLabels(!showOffcutLabels)}
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border transition cursor-pointer ${
                showOffcutLabels
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-[#1e2533] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Highlight reusable glass offcuts"
            >
              <span>Offcuts</span>
            </button>

            {/* Zoom controls */}
            <div className="flex items-center border border-slate-700 rounded bg-[#1e2533]">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.2))}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="px-1 text-[10px] text-slate-300 font-mono w-9 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1 text-slate-400 hover:text-white border-l border-slate-700 transition cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Direct Print / PDF Button */}
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-700/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition cursor-pointer shadow-xs ml-1"
                title="Print sheet layouts or export to PDF"
              >
                <Printer className="w-3 h-3 text-amber-400" />
                <span>Print / PDF</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Multi-View Sub-Bar: Clutter reduction options (Number of sheets shown) & Pagination */
        <div className="px-3 py-2 bg-[#0f1115] border-b border-[#2d3748] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
          {/* Number of sheets shown selector to reduce cluster */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-sans">
              Sheets shown on page (reduce clutter):
            </span>
            <div className="flex items-center gap-1">
              {[2, 4, 6, 'all'].map((limit) => (
                <button
                  key={limit}
                  type="button"
                  onClick={() => {
                    setSheetsPerPage(limit as any);
                    setMultiViewPage(0);
                  }}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition border cursor-pointer ${
                    sheetsPerPage === limit
                      ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-xs'
                      : 'bg-[#181e28] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {limit === 'all' ? `All (${totalSheets})` : `${limit} Sheets`}
                </button>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                Showing {startIdx + 1}–{endIdx} of {totalSheets}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMultiViewPage((p) => Math.max(0, p - 1))}
                  disabled={multiViewPage === 0}
                  className="px-2 py-0.5 rounded bg-[#1e2533] hover:bg-[#2d3748] disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition text-[11px] cursor-pointer"
                >
                  ‹ Prev
                </button>
                <span className="px-2 py-0.5 bg-[#10141d] border border-slate-700 rounded text-[11px] text-slate-300">
                  Page {multiViewPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setMultiViewPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={multiViewPage >= totalPages - 1}
                  className="px-2 py-0.5 rounded bg-[#1e2533] hover:bg-[#2d3748] disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition text-[11px] cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}

          {/* Quick toggle for lines and dims in multi-view */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border transition cursor-pointer ${
                showDimensions
                  ? 'bg-blue-950/40 border-blue-800/80 text-blue-300'
                  : 'bg-[#1e2533] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Dims
            </button>
            <button
              type="button"
              onClick={() => setShowCutLines(!showCutLines)}
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border transition cursor-pointer ${
                showCutLines
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  : 'bg-[#1e2533] border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Cuts
            </button>

            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-700/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition cursor-pointer shadow-xs ml-1"
                title="Print all sheet layouts or export to PDF"
              >
                <Printer className="w-3 h-3 text-amber-400" />
                <span>Print / PDF</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Simulator Toolbar (Only in Single View) */}
      {viewMode === 'single' && (
        <div className="px-3 py-1.5 bg-[#0b0e13] border-b border-[#2d3748] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Scissors className="w-3 h-3 text-rose-400" />
              Guillotine Seq:
            </span>
            <button
              type="button"
              onClick={() => {
                setSimulationActive(true);
                setCurrentStep(0);
                setIsPlaying(true);
              }}
              className="px-2 py-0.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded font-mono text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Simulate</span>
            </button>

            {simulationActive && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 bg-[#1e2533] hover:bg-[#2d3748] rounded text-slate-300 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.max(0, p - 1));
                  }}
                  disabled={currentStep <= 0}
                  className="p-1 bg-[#1e2533] hover:bg-[#2d3748] disabled:opacity-30 rounded text-slate-300 transition cursor-pointer"
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5">
                  Cut {currentStep} / {currentSheet.cutLines.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.min(currentSheet.cutLines.length, p + 1));
                  }}
                  disabled={currentStep >= currentSheet.cutLines.length}
                  className="p-1 bg-[#1e2533] hover:bg-[#2d3748] disabled:opacity-30 rounded text-slate-300 transition cursor-pointer"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulationActive(false);
                    setIsPlaying(false);
                    setCurrentStep(currentSheet.cutLines.length);
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline font-mono ml-1 cursor-pointer"
                >
                  Show All
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Primary Rip
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f97316]"></span> Secondary Cross
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span> Tertiary
            </span>
          </div>
        </div>
      )}

      {/* MAIN VIEW AREA: Either Single Focus Canvas OR Multi-View Side-by-Side Grid */}
      {viewMode === 'single' ? (
        /* SINGLE SHEET CANVAS */
        <div
          ref={containerRef}
          className="p-3 sm:p-4 flex-1 flex items-center justify-center bg-[#0a0d12] overflow-auto min-h-[460px]"
        >
          <div
            className="relative transition-transform duration-150 origin-center"
            style={{
              transform: `scale(${zoomScale})`,
              width: '100%',
              maxWidth: '920px',
            }}
          >
            <SingleSheetSvg
              sheet={currentSheet}
              showCutLines={showCutLines}
              showDimensions={showDimensions}
              showOffcutLabels={showOffcutLabels}
              visibleCutLines={visibleCutLines}
              hoveredPieceId={hoveredPieceId}
              inspectPiece={inspectPiece}
              onHoverPiece={onHoverPiece}
              onSelectPiece={(p) => setInspectPiece(p)}
              maxHeight="680px"
              interactive={true}
            />
          </div>
        </div>
      ) : (
        /* MULTI-VIEW: SIDE-BY-SIDE ALL SHEETS GRID */
        <div className="p-3.5 bg-[#0a0d12] overflow-y-auto max-h-[720px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleSheetsInMultiView.map((sheet, idx) => {
              const actualSheetIndex = startIdx + idx;
              const isSelected = actualSheetIndex === activeSheetIndex;

              return (
                <div
                  key={sheet.sheetId}
                  className={`bg-[#12161f] border rounded-lg overflow-hidden flex flex-col transition shadow-md ${
                    isSelected
                      ? 'border-blue-500 shadow-blue-900/30'
                      : 'border-[#2d3748] hover:border-slate-600'
                  }`}
                >
                  {/* Sheet Card Header */}
                  <div className="px-3 py-2 bg-[#161c27] border-b border-[#2d3748] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700 text-blue-200 text-xs font-bold font-mono">
                        Sheet {actualSheetIndex + 1} of {sheets.length}
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-mono">
                        {sheet.width} × {sheet.height} mm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
                        {sheet.yieldPercentage}% Yield
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSheet(actualSheetIndex);
                          setViewMode('single');
                        }}
                        className="p-1 rounded bg-[#1e2533] hover:bg-blue-600 hover:text-white text-slate-400 transition cursor-pointer flex items-center gap-1 text-[10px] font-mono px-1.5"
                        title="Open in Single Focus View"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                    </div>
                  </div>

                  {/* Render Sheet SVG Canvas */}
                  <div className="p-2.5 flex-1 flex items-center justify-center bg-[#07090d]">
                    <SingleSheetSvg
                      sheet={sheet}
                      showCutLines={showCutLines}
                      showDimensions={showDimensions}
                      showOffcutLabels={showOffcutLabels}
                      hoveredPieceId={hoveredPieceId}
                      onHoverPiece={onHoverPiece}
                      onSelectPiece={(p) => {
                        onSelectSheet(actualSheetIndex);
                        setInspectPiece(p);
                      }}
                      maxHeight="380px"
                      interactive={true}
                    />
                  </div>

                  {/* Sheet Card Footer Metrics */}
                  <div className="px-3 py-1.5 bg-[#0e1219] border-t border-[#2d3748] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div>
                      Panes: <span className="font-bold text-slate-200">{sheet.placedPieces.length}</span>
                    </div>
                    <div>
                      Glass:{' '}
                      <span className="text-slate-200">
                        {(sheet.totalGlassArea / 1000000).toFixed(2)} m²
                      </span>
                    </div>
                    <div>
                      Offcuts:{' '}
                      <span className="text-emerald-400">
                        {(sheet.reusableArea / 1000000).toFixed(2)} m²
                      </span>
                    </div>
                    <div>
                      Scrap:{' '}
                      <span className="text-rose-400 font-bold">
                        {(sheet.scrapArea / 1000000).toFixed(2)} m²
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Sheet Summary & Piece Inspector (Visible in both views) */}
      <div className="p-2.5 bg-[#0c0f14] border-t border-[#2d3748] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-3 text-slate-300">
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Active Sheet Yield:</span>{' '}
            <span className="font-bold text-emerald-400 text-xs">
              {currentSheet.yieldPercentage}%
            </span>
          </div>
          <div className="h-3 w-[1px] bg-[#2d3748]" />
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Panes:</span>{' '}
            <span className="font-semibold text-slate-200">
              {currentSheet.placedPieces.length}
            </span>
          </div>
          <div className="h-3 w-[1px] bg-[#2d3748]" />
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Glass:</span>{' '}
            <span className="text-slate-200">
              {(currentSheet.totalGlassArea / 1000000).toFixed(2)} m²
            </span>
          </div>
          <div className="h-3 w-[1px] bg-[#2d3748]" />
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Offcuts:</span>{' '}
            <span className="text-emerald-400">
              {(currentSheet.reusableArea / 1000000).toFixed(2)} m²
            </span>
          </div>
          <div className="h-3 w-[1px] bg-[#2d3748]" />
          <div>
            <span className="text-slate-500 uppercase text-[10px]">Scrap Waste:</span>{' '}
            <span className="text-rose-400 font-bold">
              {(currentSheet.scrapArea / 1000000).toFixed(2)} m²
            </span>
          </div>
        </div>

        {/* Selected / Hovered Piece Quick Inspector */}
        {inspectPiece ? (
          <div className="flex items-center gap-2 bg-[#1e2533] px-2.5 py-0.5 rounded border border-slate-700 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: inspectPiece.color }}
            />
            <span className="font-bold text-slate-200">{inspectPiece.label}</span>
            <span className="text-amber-300">
              {Math.round(inspectPiece.width)}×{Math.round(inspectPiece.height)} mm
            </span>
            <span className="text-slate-400 text-[10px]">
              Pos: ({Math.round(inspectPiece.x)}, {Math.round(inspectPiece.y)})
            </span>
            {inspectPiece.rotated && (
              <span className="text-cyan-400 bg-cyan-950/60 px-1 py-0.2 rounded text-[9px] uppercase font-bold">
                Rot 90°
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-500">
            Click any glass pane to view placement coordinates & dimensions.
          </span>
        )}
      </div>
    </div>
  );
};
