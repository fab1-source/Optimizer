import React, { useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  Layers,
  Settings2,
  CheckSquare,
  Scissors,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { OptimizationResult, StockSheet, PackedSheet } from '../types';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  stock?: StockSheet;
  jobSerial?: string;
  jobTitle?: string;
  client?: string;
  activeSheetIndex?: number;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  result,
  stock,
  jobSerial = 'JOB-1001',
  jobTitle = 'Glass Cutting Order',
  client,
  activeSheetIndex = 0,
}) => {
  if (!isOpen || !result) return null;

  const totalSheets = result.sheets.length;

  // Print selection options
  const [printScope, setPrintScope] = useState<'all' | 'current' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(totalSheets, 10));

  // Layout presentation toggles
  const [includeVisualLayout, setIncludeVisualLayout] = useState(true);
  const [includePieceTable, setIncludePieceTable] = useState(true);
  const [includeCutSteps, setIncludeCutSteps] = useState(true);
  const [colorMode, setColorMode] = useState<'monochrome' | 'color'>('monochrome');
  const [showPdfTip, setShowPdfTip] = useState(false);

  // Compute the sheets to print based on scope
  const selectedSheets: PackedSheet[] = React.useMemo(() => {
    if (printScope === 'current') {
      const idx = Math.min(Math.max(0, activeSheetIndex), totalSheets - 1);
      return result.sheets[idx] ? [result.sheets[idx]] : result.sheets.slice(0, 1);
    }
    if (printScope === 'range') {
      const start = Math.max(1, Math.min(rangeStart, totalSheets));
      const end = Math.max(start, Math.min(rangeEnd, totalSheets));
      return result.sheets.slice(start - 1, end);
    }
    return result.sheets;
  }, [printScope, activeSheetIndex, rangeStart, rangeEnd, result.sheets, totalSheets]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setShowPdfTip(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:z-auto">
      <div className="bg-[#141820] print:bg-white text-[#e2e8f0] print:text-black border border-[#2d3748] print:border-none rounded-lg shadow-2xl max-w-5xl w-full flex flex-col max-h-[95vh] print:max-h-none overflow-hidden print:overflow-visible font-sans">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-3 border-b border-[#2d3748] bg-[#0c0f14] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-950/70 border border-amber-700/60 flex items-center justify-center text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Print Sheet Layouts & Export PDF</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 font-mono">
                  {jobSerial}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate high-resolution shop floor cutting layouts and breakout schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="bg-[#1e293b] hover:bg-[#334155] text-amber-300 hover:text-amber-200 border border-amber-600/70 text-xs px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition cursor-pointer shadow-xs"
              title="Export all selected sheet layouts to PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Save / Export PDF</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 font-semibold transition cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Layouts</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a202c] transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Print Configuration Controls (Scope & Toggles) */}
        <div className="p-2.5 bg-[#10151f] border-b border-[#2d3748] flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Scope Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider font-mono">
              Sheets to Print:
            </span>
            <div className="flex bg-[#181f2c] p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition cursor-pointer ${
                  printScope === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Sheets ({totalSheets})
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('current')}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition cursor-pointer ${
                  printScope === 'current'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Current Sheet (#{activeSheetIndex + 1})
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('range')}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition cursor-pointer ${
                  printScope === 'range'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Page Range
              </button>
            </div>

            {printScope === 'range' && (
              <div className="flex items-center gap-1 font-mono text-xs ml-1">
                <span>From</span>
                <input
                  type="number"
                  min="1"
                  max={totalSheets}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-[#181f2c] border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                />
                <span>to</span>
                <input
                  type="number"
                  min={rangeStart}
                  max={totalSheets}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Math.max(rangeStart, Number(e.target.value)))}
                  className="w-12 bg-[#181f2c] border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                />
              </div>
            )}
          </div>

          {/* Layout Options Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVisualLayout}
                onChange={(e) => setIncludeVisualLayout(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">2D Layout Diagrams</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includePieceTable}
                onChange={(e) => setIncludePieceTable(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Piece Cut Table</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCutSteps}
                onChange={(e) => setIncludeCutSteps(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Cut Sequences</span>
            </label>

            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                type="button"
                onClick={() => setColorMode(colorMode === 'monochrome' ? 'color' : 'monochrome')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer border ${
                  colorMode === 'monochrome'
                    ? 'bg-slate-800 text-slate-200 border-slate-600'
                    : 'bg-blue-950 text-blue-300 border-blue-800'
                }`}
                title="Toggle between ink-saving black & white and full color"
              >
                {colorMode === 'monochrome' ? 'Ink-Saving (B&W)' : 'Full Color'}
              </button>
            </div>
          </div>
        </div>

        {/* Informative Tip when Export PDF is triggered */}
        {showPdfTip && (
          <div className="px-4 py-2 bg-amber-950/70 border-b border-amber-700/60 text-amber-200 text-xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>PDF Export Tip:</strong> In the print preview window that appears, select{' '}
                <strong>"Save as PDF"</strong> as your Destination printer, then click Save.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPdfTip(false)}
              className="text-amber-400 hover:text-white text-xs cursor-pointer ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Printable Document Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 print:p-0 bg-[#0a0d13] print:bg-white text-slate-200 print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-[#2d3748] print:border-gray-800 pb-3 flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-blue-950 print:bg-gray-200 border border-blue-700 print:border-gray-800 text-blue-300 print:text-black font-mono text-xs font-bold">
                  {jobSerial}
                </span>
                <h1 className="text-lg font-bold tracking-tight text-white print:text-black uppercase">
                  {jobTitle}
                </h1>
              </div>
              {client && (
                <div className="text-xs text-slate-300 print:text-gray-800 mt-1">
                  <strong>Client / Project:</strong> {client}
                </div>
              )}
              <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">
                Guillotine Glass Straight-Line Score & Snap Layout • Shop Floor Production Ticket
              </p>
            </div>

            <div className="text-right text-xs space-y-1 font-mono text-slate-300 print:text-gray-900">
              <div>
                <span className="text-slate-400 print:text-gray-600">Date:</span> {currentDate}
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Total Selected:</span>{' '}
                <strong>
                  {selectedSheets.length} of {totalSheets} sheet(s)
                </strong>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Overall Yield:</span>{' '}
                <strong className="text-emerald-400 print:text-black">
                  {result.overallYield}%
                </strong>
              </div>
            </div>
          </div>

          {/* Sheets List */}
          {selectedSheets.map((sheet) => (
            <div
              key={sheet.sheetId}
              className="border border-[#2d3748] print:border-gray-600 rounded-lg p-3 sm:p-4 space-y-3.5 break-after-page bg-[#141820] print:bg-white print:shadow-none shadow-md"
              style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
            >
              {/* Sheet Sub-Header */}
              <div className="flex flex-wrap justify-between items-center bg-[#0c0f14] print:bg-gray-100 p-2.5 rounded border border-[#2d3748] print:border-gray-400 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 print:text-black uppercase tracking-wide">
                    Sheet #{sheet.sheetIndex} of {totalSheets} — {sheet.width} × {sheet.height} mm
                  </span>
                  {sheet.trimMargin > 0 && (
                    <span className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                      (Trim: {sheet.trimMargin} mm)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-300 print:text-gray-700">
                    Panes: <strong>{sheet.placedPieces.length}</strong>
                  </span>
                  <span className="font-bold text-emerald-400 print:text-green-800">
                    Yield: {sheet.yieldPercentage}%
                  </span>
                  <span className="text-slate-400 print:text-gray-600 text-[11px]">
                    Scrap: {((sheet.scrapArea / sheet.sheetArea) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Visual 2D SVG Cutting Plan */}
              {includeVisualLayout && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-700 font-mono flex items-center justify-between">
                    <span>2D Cutting Layout Diagram:</span>
                    <span>Guillotine Cuts: {sheet.cutLines.length}</span>
                  </div>
                  <div className="border border-[#2d3748] print:border-gray-800 rounded bg-white overflow-hidden">
                    <PrintableSheetSvg sheet={sheet} colorMode={colorMode} />
                  </div>
                </div>
              )}

              {/* Cut List Table for this sheet */}
              {includePieceTable && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-700 font-mono">
                    Placed Pieces Cut Schedule ({sheet.placedPieces.length} panes):
                  </div>
                  <div className="overflow-x-auto border border-[#2d3748] print:border-gray-400 rounded">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-[#0c0f14] print:bg-gray-100 border-b border-[#2d3748] print:border-gray-400 text-slate-400 print:text-gray-800 text-[10px] uppercase">
                          <th className="py-1 px-2 w-8 text-center">#</th>
                          <th className="py-1 px-2">Label / Item</th>
                          <th className="py-1 px-2 font-bold">Cut Size (W × H mm)</th>
                          <th className="py-1 px-2">Position (X, Y)</th>
                          <th className="py-1 px-2 text-center">Orientation</th>
                          <th className="py-1 px-2 text-center w-16">Cut Verified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2d3748]/60 print:divide-gray-300">
                        {sheet.placedPieces.map((piece, pIdx) => (
                          <tr key={piece.id} className="print:text-black">
                            <td className="py-1 px-2 text-center text-slate-400 print:text-gray-600">
                              {pIdx + 1}
                            </td>
                            <td className="py-1 px-2 font-sans font-medium text-slate-200 print:text-black">
                              {piece.label}
                            </td>
                            <td className="py-1 px-2 font-bold text-blue-400 print:text-black">
                              {piece.width} × {piece.height} mm
                            </td>
                            <td className="py-1 px-2 text-slate-400 print:text-gray-600">
                              X:{piece.x}, Y:{piece.y}
                            </td>
                            <td className="py-1 px-2 text-center text-[10px] text-slate-400 print:text-gray-600">
                              {piece.rotated ? 'Rotated 90°' : 'Standard'}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span className="inline-block w-4 h-4 border border-slate-500 print:border-black rounded-xs"></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Guillotine Cut Sequence Lines */}
              {includeCutSteps && sheet.cutLines.length > 0 && (
                <div className="pt-2 border-t border-[#2d3748] print:border-gray-300">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-700 font-mono mb-1">
                    Sequenced Guillotine Straight Cuts ({sheet.cutLines.length} cuts):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1 text-[10px] font-mono">
                    {sheet.cutLines.map((cut) => (
                      <div
                        key={cut.id}
                        className="bg-[#0c0f14] print:bg-gray-50 border border-[#2d3748] print:border-gray-300 px-1.5 py-0.5 rounded text-slate-300 print:text-black flex justify-between items-center"
                      >
                        <span className="font-bold text-amber-400 print:text-red-700">
                          #{cut.stepNumber}
                        </span>
                        <span className="text-[9px]">
                          {cut.orientation === 'horizontal' ? 'H Rip' : 'V Cross'} @{' '}
                          {cut.orientation === 'horizontal' ? `Y=${cut.y1}` : `X=${cut.x1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Shop Sign-Off Footer */}
          <div className="pt-4 border-t-2 border-[#2d3748] print:border-gray-800 flex justify-between text-xs text-slate-400 print:text-black font-mono">
            <div className="space-y-3">
              <div>Table Operator: _______________________</div>
              <div>Quality Inspector: ____________________</div>
            </div>
            <div className="space-y-3 text-right">
              <div>Production Date: ____________________</div>
              <div>Breakout Inspection: [ ] Pass  [ ] Fail</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * High-Resolution Print/PDF-Optimized 2D Sheet SVG
 */
const PrintableSheetSvg: React.FC<{
  sheet: PackedSheet;
  colorMode: 'monochrome' | 'color';
}> = ({ sheet, colorMode }) => {
  const svgWidth = sheet.width;
  const svgHeight = sheet.height;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto block select-none bg-white"
      style={{ maxHeight: '440px' }}
    >
      <defs>
        {/* Scrap Hatch Pattern */}
        <pattern
          id={`printHatch-${uniqueId}`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* Stock Sheet Boundary */}
      <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />

      {/* Trim Margin Boundary */}
      {sheet.trimMargin > 0 && (
        <rect
          x={sheet.trimMargin}
          y={sheet.trimMargin}
          width={sheet.usableWidth}
          height={sheet.usableHeight}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
      )}

      {/* Waste & Scrap Areas */}
      {sheet.wasteAreas.map((waste, idx) => {
        if (waste.isReusable) {
          return (
            <g key={waste.id || `print-waste-reusable-${idx}`}>
              <rect
                x={waste.x}
                y={waste.y}
                width={waste.width}
                height={waste.height}
                fill={colorMode === 'color' ? '#dcfce7' : '#f1f5f9'}
                stroke="#16a34a"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              {waste.width > 200 && waste.height > 120 && (
                <text
                  x={waste.x + waste.width / 2}
                  y={waste.y + waste.height / 2}
                  fill="#15803d"
                  fontSize={Math.max(14, Math.min(26, waste.width / 15))}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="sans-serif"
                >
                  REUSABLE {Math.round(waste.width)} × {Math.round(waste.height)}
                </text>
              )}
            </g>
          );
        }

        return (
          <rect
            key={waste.id || `print-waste-scrap-${idx}`}
            x={waste.x}
            y={waste.y}
            width={waste.width}
            height={waste.height}
            fill={`url(#printHatch-${uniqueId})`}
            stroke="#94a3b8"
            strokeWidth="1"
          />
        );
      })}

      {/* Placed Glass Panes */}
      {sheet.placedPieces.map((piece, idx) => {
        const paneFill =
          colorMode === 'color' ? piece.color || '#e0f2fe' : '#ffffff';
        const paneStroke = '#0f172a';
        const fontSize = Math.max(14, Math.min(32, piece.width / 14));

        return (
          <g key={piece.id || `print-pane-${idx}`}>
            <rect
              x={piece.x}
              y={piece.y}
              width={piece.width}
              height={piece.height}
              fill={paneFill}
              fillOpacity={colorMode === 'color' ? 0.75 : 1}
              stroke={paneStroke}
              strokeWidth="2.5"
            />

            {/* Pane Text Tag & Dimension */}
            {piece.width >= 120 && piece.height >= 70 && (
              <text
                x={piece.x + piece.width / 2}
                y={piece.y + piece.height / 2 - (piece.height > 120 ? fontSize * 0.6 : 0)}
                fill="#0f172a"
                fontSize={fontSize}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="sans-serif"
              >
                {piece.label}
              </text>
            )}

            {piece.width >= 120 && piece.height >= 120 && (
              <text
                x={piece.x + piece.width / 2}
                y={piece.y + piece.height / 2 + fontSize * 0.8}
                fill="#334155"
                fontSize={fontSize * 0.85}
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {Math.round(piece.width)} × {Math.round(piece.height)} mm
                {piece.rotated ? ' ⟳' : ''}
              </text>
            )}

            {/* Sequence index badge */}
            <circle
              cx={piece.x + 16}
              cy={piece.y + 16}
              r="11"
              fill="#0f172a"
            />
            <text
              x={piece.x + 16}
              y={piece.y + 16}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {idx + 1}
            </text>
          </g>
        );
      })}

      {/* Guillotine Score Lines */}
      {sheet.cutLines.map((cut, idx) => {
        const isHoriz = cut.orientation === 'horizontal';
        const midX = isHoriz ? cut.x1 + cut.length / 2 : cut.x1;
        const midY = isHoriz ? cut.y1 : cut.y1 + cut.length / 2;

        return (
          <g key={cut.id || `print-cut-${cut.stepNumber}-${idx}`}>
            <line
              x1={cut.x1}
              y1={cut.y1}
              x2={cut.x2}
              y2={cut.y2}
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeDasharray={cut.level > 1 ? '8 4' : 'none'}
            />
            {/* Step badge */}
            <circle cx={midX} cy={midY} r="10" fill="#dc2626" />
            <text
              x={midX}
              y={midY}
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {cut.stepNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
