import React, { useState } from 'react';
import {
  OptimizationResult,
  PackedSheet,
  CutLine,
  StockSheet,
} from '../types';
import {
  PieChart,
  Layers,
  Scissors,
  BookmarkCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Maximize,
  CheckCircle2,
  Recycle,
} from 'lucide-react';

interface CutPlanDetailsProps {
  result: OptimizationResult | null;
  activeSheetIndex: number;
  onSelectSheet: (index: number) => void;
  stock: StockSheet;
}

export const CutPlanDetails: React.FC<CutPlanDetailsProps> = ({
  result,
  activeSheetIndex,
  onSelectSheet,
  stock,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cuts' | 'offcuts'>('overview');

  if (!result || result.sheets.length === 0) {
    return null;
  }

  const activeSheet = result.sheets[activeSheetIndex] || result.sheets[0];

  const totalGlassM2 = (result.totalGlassArea / 1000000).toFixed(2);
  const totalStockM2 = (result.totalStockArea / 1000000).toFixed(2);
  const totalScrapM2 = (result.totalScrapArea / 1000000).toFixed(2);
  const totalReusableM2 = (result.totalReusableArea / 1000000).toFixed(2);

  return (
    <div className="bg-[#141820] border border-[#2d3748] rounded shadow-sm flex flex-col text-[#e2e8f0]">
      {/* Top Metrics Banner */}
      <div className="p-3 border-b border-[#2d3748] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#0f1115]">
        {/* Yield % */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Overall Yield
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {result.overallYield}%
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            {100 - result.overallYield > 0 ? `${(100 - result.overallYield).toFixed(1)}% waste` : '0.0% waste'}
          </div>
        </div>

        {/* Sheets Used */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Stock Sheets
          </div>
          <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
            {result.totalSheetsUsed} <span className="text-xs text-slate-500 font-normal">sheet{result.totalSheetsUsed > 1 ? 's' : ''}</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            {stock.width}×{stock.height} mm
          </div>
        </div>

        {/* Total Glass Cut */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Net Glass Area
          </div>
          <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
            {totalGlassM2} <span className="text-xs text-slate-500 font-normal">m²</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            {result.totalPiecesPlaced}/{result.totalPiecesRequested} panes placed
          </div>
        </div>

        {/* Gross Stock Area */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Gross Stock Area
          </div>
          <div className="text-lg font-bold font-mono text-slate-300 mt-0.5">
            {totalStockM2} <span className="text-xs text-slate-500 font-normal">m²</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Raw float stock
          </div>
        </div>

        {/* Reusable Offcut */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Recycle className="w-2.5 h-2.5" />
            <span>Usable Offcut</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
            {totalReusableM2} <span className="text-xs text-slate-500 font-normal">m²</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Inventory saved
          </div>
        </div>

        {/* Scrap Area */}
        <div className="bg-[#141820] p-2.5 rounded border border-[#2d3748]">
          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
            Scrap Waste
          </div>
          <div className="text-lg font-bold font-mono text-rose-300 mt-0.5">
            {totalScrapM2} <span className="text-xs text-slate-500 font-normal">m²</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Cullet / trim
          </div>
        </div>
      </div>

      {/* Unplaced Pieces Warning if any */}
      {result.unplacedPieces.length > 0 && (
        <div className="p-2.5 bg-amber-950/40 border-b border-amber-900/50 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-xs text-amber-200 font-mono">
            <span className="font-bold uppercase">Notice:</span> {result.unplacedPieces.length} item(s) could not fit within the available stock sheets.
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <div className="px-3 border-b border-[#2d3748] flex items-center justify-between bg-[#0f1115]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sheet Breakdown ({result.sheets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cuts')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1 ${
              activeTab === 'cuts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>Cut Sequence (Sheet #{activeSheetIndex + 1})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offcuts')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1 ${
              activeTab === 'offcuts'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Recycle className="w-3 h-3 text-emerald-400" />
            <span>Offcut Inventory</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden md:flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>{result.executionTimeMs}ms • {result.algorithmUsed}</span>
        </div>
      </div>

      {/* Tab 1: Sheet Breakdown */}
      {activeTab === 'overview' && (
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {result.sheets.map((sheet, idx) => {
            const isCurrent = idx === activeSheetIndex;
            const glassM2 = (sheet.totalGlassArea / 1000000).toFixed(2);
            const reusableCount = sheet.wasteAreas.filter((w) => w.isReusable).length;

            return (
              <div
                key={sheet.sheetId}
                onClick={() => onSelectSheet(idx)}
                className={`p-3 rounded border cursor-pointer transition flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-[#161f30] border-blue-500/80 shadow-sm'
                    : 'bg-[#0f1115] border-[#2d3748] hover:border-slate-600 hover:bg-[#141820]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                        Sheet #{idx + 1}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-blue-600/30 text-blue-300 px-1 py-0.2 rounded font-mono font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {sheet.yieldPercentage}%
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 mb-2 font-mono">
                    {sheet.width} × {sheet.height} mm
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Panes placed:</span>
                      <span className="font-semibold text-slate-200">{sheet.placedPieces.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Glass Area:</span>
                      <span className="text-slate-200">{glassM2} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Guillotine Cuts:</span>
                      <span className="text-slate-200">{sheet.cutLines.length} cuts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Usable offcuts:</span>
                      <span className="text-emerald-400">{reusableCount} piece{reusableCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Micro preview strip */}
                <div className="mt-2.5 pt-2 border-t border-[#2d3748] flex items-center justify-between text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  <span>View map</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Cut Execution Sequence (Shop floor table) */}
      {activeTab === 'cuts' && (
        <div className="p-3">
          <div className="mb-2.5 flex items-center justify-between text-xs font-mono">
            <div className="text-slate-400">
              Guillotine cut order for <span className="text-white font-semibold">Sheet #{activeSheetIndex + 1}</span> ({activeSheet.width}×{activeSheet.height} mm):
            </div>
            <div className="text-slate-500">
              Total {activeSheet.cutLines.length} cuts
            </div>
          </div>

          <div className="overflow-x-auto max-h-[360px] border border-[#2d3748] rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#1a202c] text-slate-500 uppercase text-[10px] font-bold tracking-widest sticky top-0 border-b border-[#2d3748]">
                <tr>
                  <th className="py-2 px-2.5 w-14">Step</th>
                  <th className="py-2 px-2.5 w-24">Type</th>
                  <th className="py-2 px-2.5 w-24">Axis</th>
                  <th className="py-2 px-2.5">Coordinate Span</th>
                  <th className="py-2 px-2.5 w-24 text-right">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3748]/50">
                {activeSheet.cutLines.map((cut) => (
                  <tr key={cut.id} className="hover:bg-[#1a202c]/50 transition-colors">
                    <td className="py-1.5 px-2.5 font-bold text-white">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#1e2533] text-[10px] font-mono border border-slate-700">
                        {cut.stepNumber}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          cut.level === 1
                            ? 'bg-red-950/60 text-red-300 border border-red-800/60'
                            : cut.level === 2
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                        }`}
                      >
                        {cut.level === 1 ? 'Rip' : cut.level === 2 ? 'Cross' : 'Trim'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 capitalize text-slate-300">
                      {cut.orientation}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-300 text-[11px]">
                      {cut.label} ([{Math.round(cut.x1)}, {Math.round(cut.y1)}] → [{Math.round(cut.x2)}, {Math.round(cut.y2)}])
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-blue-300 font-bold">
                      {Math.round(cut.length)} mm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reusable Offcuts Inventory */}
      {activeTab === 'offcuts' && (
        <div className="p-3">
          <div className="mb-2.5 text-xs text-slate-400 font-mono">
            Offcut pieces meeting threshold (≥{stock.width > 2000 ? '400' : '200'}mm) to return to stock:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {result.sheets.flatMap((s, sIdx) =>
              s.wasteAreas
                .filter((w) => w.isReusable)
                .map((offcut) => (
                  <div
                    key={offcut.id}
                    className="p-2.5 bg-[#091814] border border-[#164e3c] rounded flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Recycle className="w-3 h-3" />
                        <span>Sheet #{sIdx + 1} Offcut</span>
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                        {Math.round(offcut.width)} × {Math.round(offcut.height)} mm
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {((offcut.width * offcut.height) / 1000000).toFixed(2)} m²
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase border border-emerald-800">
                        Usable
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
