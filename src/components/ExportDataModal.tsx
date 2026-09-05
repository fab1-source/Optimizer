import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Code2 } from 'lucide-react';
import { OptimizationResult, StockSheet } from '../types';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  stock: StockSheet;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  result,
  stock,
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  // Generate CSV data
  const generateCSV = (): string => {
    const rows: string[] = [
      'Sheet_Number,Stock_Width,Stock_Height,Piece_Sequence,Piece_Label,X,Y,Cut_Width,Cut_Height,Rotated,Area_M2',
    ];

    result.sheets.forEach((sheet) => {
      sheet.placedPieces.forEach((p) => {
        const areaM2 = (p.area / 1000000).toFixed(4);
        rows.push(
          `${sheet.sheetIndex},${sheet.width},${sheet.height},${p.sequenceIndex},"${p.label}",${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.width)},${Math.round(p.height)},${p.rotated ? 'YES' : 'NO'},${areaM2}`
        );
      });
    });

    return rows.join('\n');
  };

  // Generate JSON data
  const generateJSON = (): string => {
    return JSON.stringify(
      {
        meta: {
          exportDate: new Date().toISOString(),
          totalSheetsUsed: result.totalSheetsUsed,
          overallYieldPercentage: result.overallYield,
          totalGlassAreaM2: (result.totalGlassArea / 1000000).toFixed(2),
          stockSheetDimensions: `${stock.width}x${stock.height}`,
          algorithm: result.algorithmUsed,
        },
        sheets: result.sheets.map((s) => ({
          sheetIndex: s.sheetIndex,
          dimensions: { width: s.width, height: s.height },
          yieldPercentage: s.yieldPercentage,
          placedPieces: s.placedPieces.map((p) => ({
            sequence: p.sequenceIndex,
            label: p.label,
            x: Math.round(p.x),
            y: Math.round(p.y),
            width: Math.round(p.width),
            height: Math.round(p.height),
            rotated: p.rotated,
          })),
          cutsSequence: s.cutLines.map((c) => ({
            step: c.stepNumber,
            orientation: c.orientation,
            type: c.level === 1 ? 'rip' : 'cross',
            x1: Math.round(c.x1),
            y1: Math.round(c.y1),
            x2: Math.round(c.x2),
            y2: Math.round(c.y2),
            length: Math.round(c.length),
          })),
          reusableOffcuts: s.wasteAreas
            .filter((w) => w.isReusable)
            .map((w) => ({
              x: Math.round(w.x),
              y: Math.round(w.y),
              width: Math.round(w.width),
              height: Math.round(w.height),
            })),
        })),
      },
      null,
      2
    );
  };

  const exportContent = format === 'csv' ? generateCSV() : generateJSON();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `glass-cutplan-${Date.now()}.${format}`;
    const blob = new Blob([exportContent], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#141820] border border-[#2d3748] rounded shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden text-[#e2e8f0] font-mono">
        {/* Header */}
        <div className="p-3 border-b border-[#2d3748] flex items-center justify-between bg-[#0f1115]">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Cutting Plan Data</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a202c] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-3 py-1.5 bg-[#0f1115] border-b border-[#2d3748] flex gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`py-1 text-[10px] font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              format === 'csv'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>CSV (Spreadsheet / CNC)</span>
          </button>
          <button
            type="button"
            onClick={() => setFormat('json')}
            className={`py-1 text-[10px] font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              format === 'json'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>JSON Structure</span>
          </button>
        </div>

        {/* Preview box */}
        <div className="p-3 flex-1 overflow-y-auto bg-[#0f1115]">
          <pre className="p-2.5 bg-[#141820] rounded border border-[#2d3748] font-mono text-[10px] text-slate-300 overflow-x-auto max-h-72">
            {exportContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0f1115] border-t border-[#2d3748] flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2533] hover:bg-[#283244] border border-[#2d3748] text-slate-300 text-[11px] transition uppercase font-bold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-[11px] text-slate-400 hover:text-white rounded border border-[#2d3748] hover:bg-[#1a202c] transition uppercase"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold uppercase transition"
            >
              <Download className="w-3 h-3" />
              <span>Download .{format.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
