import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Check, AlertCircle, Copy, ClipboardPaste, ArrowRight } from 'lucide-react';
import { GlassPiece } from '../types';
import { parseExcelClipboard, ParseResult } from '../utils/excelParser';

interface ExcelPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (pieces: GlassPiece[], replace: boolean) => void;
  existingCount: number;
}

const SAMPLE_EXCEL_DATA = `Qty\tWidth\tHeight\tLabel\tNotes
2\t1628\t1060\tFront Balcony Glass\tDouble glazed
4\t767\t1092\tBedroom Window A\tTinted grey
2\t760\t1060\tBathroom Transom\tFrosted finish
2\t1720\t2090\tPatio Sliding Door\tClear laminated
6\t850\t1200\tSide Window Panels\tStandard float
3\t1100\t1450\tOffice Partition\tTempered safety`;

export const ExcelPasteModal: React.FC<ExcelPasteModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCount,
}) => {
  const [rawText, setRawText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Auto-parse on rawText change
  useEffect(() => {
    if (rawText.trim()) {
      const res = parseExcelClipboard(rawText, replaceExisting ? 0 : existingCount);
      setParseResult(res);
    } else {
      setParseResult(null);
    }
  }, [rawText, replaceExisting, existingCount]);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
        }
      }
    } catch {
      // Clipboard access might be blocked by iframe; user can paste directly into textarea
    }
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_EXCEL_DATA);
  };

  const handleConfirm = () => {
    if (parseResult && parseResult.pieces.length > 0) {
      onImport(parseResult.pieces, replaceExisting);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#141820] border border-[#2d3748] rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2d3748] flex items-center justify-between bg-[#181d26]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Paste Multiple Sizes from Excel / CSV
              </h2>
              <p className="text-[11px] text-slate-400">
                Copy rows from your spreadsheet (Excel, Google Sheets) and paste here.
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
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1b212c] p-2.5 rounded border border-[#2d3748]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded flex items-center gap-1.5 transition text-[11px] shadow-xs cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste from Clipboard</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-2.5 py-1 bg-[#242c3b] hover:bg-[#2d3748] text-slate-300 font-medium rounded transition text-[11px] border border-slate-700 cursor-pointer"
              >
                Insert Sample Excel Data
              </button>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Standard Format: QTY • Width • Height • Label
            </span>
          </div>

          {/* Raw Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Paste Area (Ctrl+V / Cmd+V)
              </label>
              {rawText && (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste cells directly from Excel here (Format: QTY [Tab] Width [Tab] Height [Tab] Label)..."
              rows={5}
              className="w-full bg-[#0d1017] border border-slate-700 rounded p-2.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-blue-500 placeholder-slate-600 leading-relaxed selection:bg-blue-600"
            />
          </div>

          {/* Live Parsing Preview */}
          {parseResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">
                    Detected Sizes Preview:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-400 font-mono text-[11px]">
                    {parseResult.pieces.length} sizes ({parseResult.totalPieces} pcs total)
                  </span>
                </div>
                {parseResult.warnings.length > 0 && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {parseResult.warnings.length} warning(s)
                  </span>
                )}
              </div>

              {parseResult.pieces.length > 0 ? (
                <div className="border border-[#2d3748] rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-[#181d26] text-slate-400 border-b border-[#2d3748] sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1.5 font-semibold">#</th>
                        <th className="px-2.5 py-1.5 font-semibold">Label / Tag</th>
                        <th className="px-2.5 py-1.5 font-semibold">Width (mm)</th>
                        <th className="px-2.5 py-1.5 font-semibold">Height (mm)</th>
                        <th className="px-2.5 py-1.5 font-semibold text-center">Qty</th>
                        <th className="px-2.5 py-1.5 font-semibold text-right">Area (m²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222a38]">
                      {parseResult.pieces.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-[#181e28]">
                          <td className="px-2.5 py-1 text-slate-500">{idx + 1}</td>
                          <td className="px-2.5 py-1 font-sans text-slate-200 truncate max-w-[140px]">
                            {p.label}
                          </td>
                          <td className="px-2.5 py-1 text-blue-300 font-bold">{p.width}</td>
                          <td className="px-2.5 py-1 text-blue-300 font-bold">{p.height}</td>
                          <td className="px-2.5 py-1 text-center text-emerald-300 font-bold">
                            {p.qty}
                          </td>
                          <td className="px-2.5 py-1 text-right text-slate-400">
                            {((p.width * p.height * p.qty) / 1000000).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded text-rose-300 text-xs">
                  {parseResult.errors[0] || 'Could not detect valid glass dimensions. Check numbers and formatting.'}
                </div>
              )}
            </div>
          )}

          {/* Import Mode Option */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 text-xs">
              <input
                type="radio"
                name="importMode"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Append to existing glass sizes ({existingCount})</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 text-xs">
              <input
                type="radio"
                name="importMode"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-amber-300">Replace current cut list completely</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-[#2d3748] bg-[#181d26] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!parseResult || parseResult.pieces.length === 0}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded flex items-center gap-1.5 transition text-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              Import {parseResult ? `${parseResult.totalPieces} Pieces` : 'Sizes'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
