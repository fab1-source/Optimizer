import React, { useState } from 'react';
import { Plus, Trash2, Copy, AlertTriangle, FileSpreadsheet, RotateCw, Lock } from 'lucide-react';
import { GlassPiece, StockSheet } from '../types';
import { COLOR_PALETTE } from '../utils/presets';

interface GlassPieceTableProps {
  pieces: GlassPiece[];
  onUpdatePieces: (newPieces: GlassPiece[]) => void;
  stocks: StockSheet[];
  selectedPieceId?: string | null;
  onSelectPiece?: (id: string | null) => void;
  onOpenExcelPaste?: () => void;
  isLocked?: boolean;
}

export const GlassPieceTable: React.FC<GlassPieceTableProps> = ({
  pieces,
  onUpdatePieces,
  stocks,
  selectedPieceId,
  onSelectPiece,
  onOpenExcelPaste,
  isLocked = false,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newWidth, setNewWidth] = useState<number | ''>('');
  const [newHeight, setNewHeight] = useState<number | ''>('');
  const [newQty, setNewQty] = useState<number>(1);
  const [newRotation, setNewRotation] = useState<boolean>(true);

  // Maximum dimension among enabled stocks for size validation warning
  const activeStocks = stocks.filter((s) => s.enabled ?? true);
  const maxStockW = Math.max(...activeStocks.map((s) => s.width), 3210);
  const maxStockH = Math.max(...activeStocks.map((s) => s.height), 2250);

  // Handle single item update
  const handleUpdate = (id: string, field: keyof GlassPiece, value: any) => {
    const updated = pieces.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    onUpdatePieces(updated);
  };

  // Handle item deletion
  const handleDelete = (id: string) => {
    onUpdatePieces(pieces.filter((p) => p.id !== id));
  };

  // Handle item duplicate
  const handleDuplicate = (piece: GlassPiece) => {
    const newPiece: GlassPiece = {
      ...piece,
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: `${piece.label} (Copy)`,
      color: COLOR_PALETTE[pieces.length % COLOR_PALETTE.length],
    };
    onUpdatePieces([...pieces, newPiece]);
  };

  // Add new piece
  const handleAddPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) return;

    const newPiece: GlassPiece = {
      id: `p-${Date.now()}`,
      label: newLabel.trim() || `Glass ${newWidth}×${newHeight}`,
      width: Number(newWidth),
      height: Number(newHeight),
      qty: Math.max(1, Number(newQty) || 1),
      allowRotation: newRotation,
      color: COLOR_PALETTE[pieces.length % COLOR_PALETTE.length],
    };

    onUpdatePieces([...pieces, newPiece]);
    setNewLabel('');
    setNewWidth('');
    setNewHeight('');
    setNewQty(1);
  };

  // Capture paste event directly in table container
  const handleContainerPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.includes('\t') || text.includes('\n'))) {
      e.preventDefault();
      if (onOpenExcelPaste) {
        onOpenExcelPaste();
      }
    }
  };

  const totalQuantity = pieces.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
  const totalAreaM2 = (
    pieces.reduce(
      (sum, p) => sum + Number(p.width) * Number(p.height) * (Number(p.qty) || 0),
      0
    ) / 1000000
  ).toFixed(2);

  return (
    <div
      onPaste={handleContainerPaste}
      className="bg-[#141820] border border-[#2d3748] rounded shadow-sm flex flex-col h-full text-[#e2e8f0]"
    >
      {/* Lock banner if locked */}
      {isLocked && (
        <div className="bg-amber-950/80 border-b border-amber-700/60 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Job Locked:</strong> Cut list editing is disabled. Click the unlock button in the header if you need to make changes.
            </span>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="p-3 border-b border-[#2d3748] flex flex-wrap items-center justify-between gap-2 bg-[#181d26]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Required Glass Sizes
            </h2>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-bold">
              {pieces.length} sizes / {totalQuantity} panes
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Net Glass Area: <span className="font-semibold text-slate-200">{totalAreaM2} m²</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenExcelPaste && !isLocked && (
            <button
              type="button"
              onClick={onOpenExcelPaste}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded flex items-center gap-1.5 transition text-xs shadow-xs cursor-pointer"
              title="Copy from Excel or Sheets and paste here"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Paste Excel</span>
            </button>
          )}
          {pieces.length > 0 && !isLocked && (
            <button
              type="button"
              onClick={() => onUpdatePieces([])}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition font-mono px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Manual Size Entry Card (Ideal for 1 or 2 sizes) */}
      <div className="p-3 bg-[#161c26] border-b border-[#2d3748]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Manual Size Entry
            </span>
            <span className="text-[10px] text-slate-400">
              (Quick add for 1 or 2 sizes)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-500 font-mono">Format:</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e2736] text-amber-300 font-mono font-bold">
              QTY — Width — Height
            </span>
          </div>
        </div>

        <form
          onSubmit={handleAddPiece}
          className="bg-[#0f131a] p-2.5 rounded border border-[#2d3748] flex flex-wrap items-end gap-2 text-xs"
        >
          {/* QTY first */}
          <div className="w-16">
            <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 font-mono">
              Qty
            </label>
            <input
              type="number"
              min="1"
              max="99999"
              placeholder="1"
              disabled={isLocked}
              value={newQty}
              onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
              className="w-full bg-[#181f2c] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs text-center font-bold focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Width */}
          <div className="w-24">
            <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 font-mono">
              Width (mm)
            </label>
            <input
              type="number"
              min="10"
              placeholder="e.g. 1200"
              disabled={isLocked}
              value={newWidth}
              onChange={(e) => setNewWidth(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#181f2c] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <span className="text-slate-500 pb-1 font-mono">×</span>

          {/* Height */}
          <div className="w-24">
            <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 font-mono">
              Height (mm)
            </label>
            <input
              type="number"
              min="10"
              placeholder="e.g. 800"
              disabled={isLocked}
              value={newHeight}
              onChange={(e) => setNewHeight(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#181f2c] border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Optional Label */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Label / Tag (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Balcony Door"
              disabled={isLocked}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-[#181f2c] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Rotation checkbox */}
          <div className="flex items-center gap-1.5 pb-1">
            <input
              type="checkbox"
              id="newRotationCheckbox"
              disabled={isLocked}
              checked={newRotation}
              onChange={(e) => setNewRotation(e.target.checked)}
              className="rounded bg-[#181f2c] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="newRotationCheckbox" className="text-[11px] text-slate-300 cursor-pointer select-none">
              Rotate 90°
            </label>
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={isLocked || !newWidth || !newHeight}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded flex items-center gap-1.5 transition text-xs shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Size</span>
          </button>
        </form>

        {/* Quick presets for 1 or 2 sizes */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-500">Quick helpers:</span>
          <button
            type="button"
            onClick={() => setNewQty(1)}
            className={`text-[10px] px-2 py-0.5 rounded border transition font-mono ${
              newQty === 1
                ? 'bg-blue-900/60 border-blue-600 text-blue-200'
                : 'bg-[#181f2c] border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Pane (1 pc)
          </button>
          <button
            type="button"
            onClick={() => setNewQty(2)}
            className={`text-[10px] px-2 py-0.5 rounded border transition font-mono ${
              newQty === 2
                ? 'bg-blue-900/60 border-blue-600 text-blue-200'
                : 'bg-[#181f2c] border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Pair (2 pcs)
          </button>
        </div>
      </div>

      {/* Pieces Table */}
      <div className="overflow-x-auto flex-1 max-h-[380px] divide-y divide-[#2d3748]/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#1a202c] text-slate-400 uppercase tracking-widest text-[10px] font-bold sticky top-0 z-10 border-b border-[#2d3748]">
            <tr>
              <th className="py-2 px-2.5 w-7">#</th>
              <th className="py-2 px-2.5">Label / Tag</th>
              <th className="py-2 px-2 w-24">Width (mm)</th>
              <th className="py-2 px-2 w-24">Height (mm)</th>
              <th className="py-2 px-2 w-16">Qty</th>
              <th className="py-2 px-2 w-14 text-center" title="Allow 90° rotation">
                Rot
              </th>
              <th className="py-2 px-2.5 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3748]/40">
            {pieces.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600 stroke-1" />
                    <span>No glass sizes entered yet.</span>
                    {onOpenExcelPaste && (
                      <button
                        type="button"
                        onClick={onOpenExcelPaste}
                        className="text-emerald-400 hover:text-emerald-300 underline font-medium text-xs cursor-pointer"
                      >
                        Click here to paste multiple sizes from Excel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              pieces.map((piece, index) => {
                const isSelected = selectedPieceId === piece.id;
                // Validation against max available stock dimensions
                const fitsUnrotated = piece.width <= maxStockW && piece.height <= maxStockH;
                const fitsRotated =
                  piece.allowRotation && piece.height <= maxStockW && piece.width <= maxStockH;
                const exceedsStock = !fitsUnrotated && !fitsRotated;

                return (
                  <tr
                    key={piece.id}
                    onMouseEnter={() => onSelectPiece && onSelectPiece(piece.id)}
                    onMouseLeave={() => onSelectPiece && onSelectPiece(null)}
                    className={`group transition-colors ${
                      isSelected ? 'bg-blue-950/40' : 'hover:bg-[#1a202c]/50'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-1.5 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: piece.color || '#1e3a8a' }}
                        />
                        <span className="text-slate-500 font-mono text-[10px]">{index + 1}</span>
                      </div>
                    </td>

                    {/* Label */}
                    <td className="py-1.5 px-2.5">
                      <input
                        type="text"
                        value={piece.label}
                        disabled={isLocked}
                        onChange={(e) => handleUpdate(piece.id, 'label', e.target.value)}
                        className="w-full bg-transparent text-slate-200 focus:bg-[#1e2533] focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="Tag / ID"
                      />
                      {exceedsStock && (
                        <div className="flex items-center gap-1 text-[9px] text-amber-400 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>Exceeds stock ({maxStockW}×{maxStockH})</span>
                        </div>
                      )}
                    </td>

                    {/* Width */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={piece.width}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdate(piece.id, 'width', Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-transparent text-blue-300 font-mono focus:bg-[#1e2533] focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-xs text-right font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Height */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={piece.height}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdate(piece.id, 'height', Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-transparent text-blue-300 font-mono focus:bg-[#1e2533] focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-xs text-right font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min="1"
                        value={piece.qty}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdate(piece.id, 'qty', Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-transparent text-emerald-400 font-mono focus:bg-[#1e2533] focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-xs text-center font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Rotation toggle */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleUpdate(piece.id, 'allowRotation', !piece.allowRotation)}
                        className={`p-1 rounded transition ${
                          piece.allowRotation
                            ? 'text-blue-400 hover:bg-blue-900/30'
                            : 'text-slate-600 hover:text-slate-400'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title={piece.allowRotation ? 'Rotation allowed' : 'Fixed orientation'}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-1.5 px-2.5 text-right">
                      {!isLocked ? (
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(piece)}
                            className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                            title="Duplicate Piece"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(piece.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                            title="Delete Piece"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end pr-1 text-slate-600">
                          <Lock className="w-3 h-3 text-slate-600" title="Locked" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Single Glass Piece Form */}
      <form
        onSubmit={handleAddPiece}
        className="p-2.5 bg-[#181d26] border-t border-[#2d3748] flex flex-wrap items-center gap-2 text-xs"
      >
        <div className="flex-1 min-w-[120px]">
          <input
            type="text"
            placeholder="Label / Tag (e.g. Window A)"
            disabled={isLocked}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full bg-[#141820] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="w-20">
          <input
            type="number"
            placeholder="Width"
            disabled={isLocked}
            value={newWidth}
            onChange={(e) => setNewWidth(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-[#141820] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs text-right disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <span className="text-slate-600 font-mono">×</span>
        <div className="w-20">
          <input
            type="number"
            placeholder="Height"
            disabled={isLocked}
            value={newHeight}
            onChange={(e) => setNewHeight(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-[#141820] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs text-right disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="w-14">
          <input
            type="number"
            placeholder="Qty"
            disabled={isLocked}
            value={newQty}
            min="1"
            onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
            className="w-full bg-[#141820] border border-slate-700 rounded px-1.5 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs text-center font-bold text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={isLocked || !newWidth || !newHeight}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded flex items-center gap-1 transition text-xs shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};
