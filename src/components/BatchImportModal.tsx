import React, { useState } from 'react';
import { X, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { GlassPiece } from '../types';
import { COLOR_PALETTE } from '../utils/presets';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (pieces: GlassPiece[]) => void;
  existingCount: number;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingCount,
}) => {
  const [rawText, setRawText] = useState(
    '1628\t1060\t2\tPanel 1628x1060\n767\t1092\t2\tPanel 767x1092\n760\t1060\t2\tPanel 760x1060\n1720\t2090\t2\tPanel 1720x2090'
  );
  const [replaceExisting, setReplaceExisting] = useState(false);

  if (!isOpen) return null;

  // Parse raw text into GlassPiece array
  const parseRows = (): GlassPiece[] => {
    const lines = rawText.trim().split(/\r?\n/);
    const parsed: GlassPiece[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Split by tab, comma, or multiple spaces
      const parts = trimmed.split(/[\t,;]+/).map((s) => s.trim());

      // Try parsing width & height
      let width = 0;
      let height = 0;
      let qty = 1;
      let label = '';

      if (parts.length >= 2) {
        width = parseFloat(parts[0]);
        height = parseFloat(parts[1]);

        if (parts.length >= 3 && !isNaN(parseFloat(parts[2]))) {
          qty = parseInt(parts[2], 10) || 1;
          label = parts.slice(3).join(' ') || `Imported ${width}x${height}`;
        } else {
          label = parts.slice(2).join(' ') || `Imported ${width}x${height}`;
        }
      }

      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        parsed.push({
          id: `imp-${Date.now()}-${idx}`,
          label: label || `Piece ${width}x${height}`,
          width: Math.round(width),
          height: Math.round(height),
          qty: Math.max(1, qty),
          allowRotation: true,
          color: COLOR_PALETTE[(existingCount + idx) % COLOR_PALETTE.length],
        });
      }
    });

    return parsed;
  };

  const previewPieces = parseRows();

  const handleConfirm = () => {
    if (previewPieces.length > 0) {
      onImport(previewPieces);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#141820] border border-[#2d3748] rounded shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden text-[#e2e8f0]">
        {/* Header */}
        <div className="p-3 border-b border-[#2d3748] flex items-center justify-between bg-[#0f1115]">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase tracking-wider">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Glass Sizes (Excel / TSV / CSV)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a202c] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto font-mono text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-sans">
              Paste rows from Excel (Columns: Width [tab] Height [tab] Qty [tab] Label):
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#2d3748] rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              placeholder="1628&#9;1060&#9;2&#9;Panel A&#10;767&#9;1092&#9;2&#9;Panel B"
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-2 font-sans">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded border-[#2d3748] bg-[#0f1115] text-blue-600 focus:ring-0"
              />
              <span>Replace existing pieces list</span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between font-sans">
              <span>Preview Parsed Items ({previewPieces.length})</span>
              {previewPieces.length === 0 && (
                <span className="text-rose-400 flex items-center gap-1 normal-case font-mono">
                  <AlertCircle className="w-3 h-3" /> No valid rows detected
                </span>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto border border-[#2d3748] rounded bg-[#0f1115] text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#1a202c] text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 border-b border-[#2d3748]">
                  <tr>
                    <th className="py-1.5 px-2.5">Width</th>
                    <th className="py-1.5 px-2.5">Height</th>
                    <th className="py-1.5 px-2.5">Qty</th>
                    <th className="py-1.5 px-2.5">Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d3748]/50 text-slate-300 font-mono">
                  {previewPieces.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#1a202c]/40">
                      <td className="py-1 px-2.5 text-slate-200">{p.width} mm</td>
                      <td className="py-1 px-2.5 text-slate-200">{p.height} mm</td>
                      <td className="py-1 px-2.5 text-blue-400 font-bold">{p.qty}</td>
                      <td className="py-1 px-2.5 font-sans text-slate-300">{p.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0f1115] border-t border-[#2d3748] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs text-slate-400 hover:text-white rounded border border-[#2d3748] hover:bg-[#1a202c] transition font-mono uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={previewPieces.length === 0}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold font-mono uppercase rounded transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Import {previewPieces.length} Sizes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
