import React, { useState } from 'react';
import {
  X,
  Cpu,
  Download,
  Copy,
  Check,
  FileCode,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { OptimizationResult, StockSheet, CNCFormat } from '../types';
import {
  generateSheetDXF,
  generateSheetGCode,
  generateCNCCutListCSV,
} from '../utils/cncExport';

interface CncExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  stock: StockSheet;
  jobSerial?: string;
}

export const CncExportModal: React.FC<CncExportModalProps> = ({
  isOpen,
  onClose,
  result,
  stock,
  jobSerial = 'JOB-1001',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<CNCFormat>('dxf');
  const [selectedSheetIdx, setSelectedSheetIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [machineBrand, setMachineBrand] = useState<'generic' | 'bottero' | 'hegla' | 'intermac' | 'lisec'>('generic');

  if (!isOpen || !result || result.sheets.length === 0) return null;

  const currentSheet = result.sheets[selectedSheetIdx] || result.sheets[0];

  // Generate code according to selected format
  let exportCode = '';
  let filename = '';
  let mimeType = 'text/plain';

  if (selectedFormat === 'dxf') {
    exportCode = generateSheetDXF(currentSheet, jobSerial);
    filename = `${jobSerial}_Sheet_${currentSheet.sheetIndex}_${currentSheet.width}x${currentSheet.height}.dxf`;
    mimeType = 'application/dxf';
  } else if (selectedFormat === 'gcode') {
    exportCode = generateSheetGCode(currentSheet, jobSerial);
    filename = `${jobSerial}_Sheet_${currentSheet.sheetIndex}.nc`;
    mimeType = 'text/plain';
  } else if (selectedFormat === 'csv') {
    exportCode = generateCNCCutListCSV(result, jobSerial);
    filename = `${jobSerial}_CNC_Cutting_List.csv`;
    mimeType = 'text/csv';
  } else if (selectedFormat === 'json') {
    exportCode = JSON.stringify(
      {
        jobSerial,
        machineBrand,
        exportedAt: new Date().toISOString(),
        totalSheets: result.sheets.length,
        yieldPercentage: result.overallYield,
        sheet: currentSheet,
      },
      null,
      2
    );
    filename = `${jobSerial}_Sheet_${currentSheet.sheetIndex}.json`;
    mimeType = 'application/json';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportCode], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllSheets = () => {
    result.sheets.forEach((sheet, idx) => {
      setTimeout(() => {
        let code = '';
        let ext = 'dxf';
        if (selectedFormat === 'dxf') {
          code = generateSheetDXF(sheet, jobSerial);
          ext = 'dxf';
        } else if (selectedFormat === 'gcode') {
          code = generateSheetGCode(sheet, jobSerial);
          ext = 'nc';
        } else {
          code = generateCNCCutListCSV(result, jobSerial);
          ext = 'csv';
        }
        const fname = `${jobSerial}_Sheet_${sheet.sheetIndex}_${sheet.width}x${sheet.height}.${ext}`;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#141820] border border-[#2d3748] rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2d3748] flex items-center justify-between bg-[#181d26]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-950 border border-blue-700/50 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Export to CNC Glass Cutting Machines
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700 text-blue-300 font-mono text-[10px]">
                  {jobSerial}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generate production files with guillotine scoring layers, snap coordinates, and machine toolpaths.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Top Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Format Selection */}
            <div className="bg-[#1a202c] p-3 rounded border border-[#2d3748]">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dxf', label: 'AutoCAD DXF', ext: '.dxf' },
                  { id: 'gcode', label: 'ISO G-Code', ext: '.nc' },
                  { id: 'csv', label: 'Cutting CSV', ext: '.csv' },
                  { id: 'json', label: 'Digital JSON', ext: '.json' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id as CNCFormat)}
                    className={`px-2 py-1.5 rounded text-left font-mono text-xs transition border cursor-pointer ${
                      selectedFormat === fmt.id
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs font-bold'
                        : 'bg-[#141820] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>{fmt.label}</div>
                    <div className="text-[10px] opacity-70">{fmt.ext}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Machine Table Profile */}
            <div className="bg-[#1a202c] p-3 rounded border border-[#2d3748]">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Cutting Table System
              </label>
              <select
                value={machineBrand}
                onChange={(e) => setMachineBrand(e.target.value as any)}
                className="w-full bg-[#141820] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="generic">Generic ISO G-Code / CNC Router</option>
                <option value="bottero">Bottero Glass (352 BCS / 340 LAM)</option>
                <option value="hegla">Hegla Formline / Optimax</option>
                <option value="intermac">Intermac Genius / Primus</option>
                <option value="lisec">Lisec ESM / ESL Cutting Lines</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Layers: <span className="text-rose-400 font-mono">CUTS_PRIMARY_RIP</span>,{' '}
                <span className="text-purple-400 font-mono">CUTS_CROSS</span>,{' '}
                <span className="text-cyan-400 font-mono">GLASS_PARTS</span>.
              </p>
            </div>

            {/* Sheet Selector */}
            <div className="bg-[#1a202c] p-3 rounded border border-[#2d3748]">
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Active Stock Sheet
              </label>
              <select
                value={selectedSheetIdx}
                onChange={(e) => setSelectedSheetIdx(Number(e.target.value))}
                className="w-full bg-[#141820] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                {result.sheets.map((s, idx) => (
                  <option key={s.sheetId} value={idx}>
                    Sheet #{s.sheetIndex}: {s.width} × {s.height} mm ({s.yieldPercentage}%)
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Pieces: <strong className="text-slate-200 font-mono">{currentSheet.placedPieces.length}</strong></span>
                <span>Cuts: <strong className="text-slate-200 font-mono">{currentSheet.cutLines.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Code Inspection Viewer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Program Code Preview ({filename})
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-0.5 bg-[#202734] hover:bg-[#2a3445] text-slate-300 rounded border border-slate-700 text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="w-full bg-[#0d1017] border border-[#2d3748] rounded p-3 font-mono text-[11px] text-emerald-300 max-h-60 overflow-y-auto overflow-x-auto leading-relaxed selection:bg-blue-600">
              {exportCode}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-[#2d3748] bg-[#181d26] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-xs cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {result.sheets.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllSheets}
                className="px-3 py-1.5 bg-[#202734] hover:bg-[#2a3445] text-slate-200 border border-slate-700 font-medium rounded flex items-center gap-1.5 transition text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All {result.sheets.length} Sheets</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded flex items-center gap-1.5 transition text-xs shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selectedFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
