import React, { useState } from 'react';
import {
  Settings2,
  Box,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  RotateCw,
  Lock,
} from 'lucide-react';
import { StockSheet, OptimizerSettings } from '../types';
import { DEFAULT_STOCK_SHEETS } from '../utils/presets';

interface StockConfigProps {
  stockInventory: StockSheet[];
  onUpdateStockInventory: (newInventory: StockSheet[]) => void;
  settings: OptimizerSettings;
  onUpdateSettings: (newSettings: OptimizerSettings) => void;
  isLocked?: boolean;
}

export const StockConfig: React.FC<StockConfigProps> = ({
  stockInventory,
  onUpdateStockInventory,
  settings,
  onUpdateSettings,
  isLocked = false,
}) => {
  const [newName, setNewName] = useState('');
  const [newWidth, setNewWidth] = useState<number | ''>('');
  const [newHeight, setNewHeight] = useState<number | ''>('');
  const [newQty, setNewQty] = useState<number | ''>(10);

  // Toggle enable/disable for a stock sheet
  const handleToggleEnable = (id: string) => {
    const updated = stockInventory.map((s) =>
      s.id === id ? { ...s, enabled: !(s.enabled ?? true) } : s
    );
    onUpdateStockInventory(updated);
  };

  // Update specific sheet field
  const handleUpdateSheet = (id: string, field: keyof StockSheet, value: any) => {
    const updated = stockInventory.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    );
    onUpdateStockInventory(updated);
  };

  // Remove sheet size
  const handleRemoveSheet = (id: string) => {
    if (stockInventory.length <= 1) return; // Keep at least one
    onUpdateStockInventory(stockInventory.filter((s) => s.id !== id));
  };

  // Add new sheet size
  const handleAddStockSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) return;

    const newSheet: StockSheet = {
      id: `stock-${Date.now()}`,
      name: newName.trim() || `Sheet ${newWidth}×${newHeight}`,
      width: Number(newWidth),
      height: Number(newHeight),
      qty: newQty === '' || Number(newQty) <= 0 ? 10 : Number(newQty),
      enabled: true,
    };

    onUpdateStockInventory([...stockInventory, newSheet]);
    setNewName('');
    setNewWidth('');
    setNewHeight('');
    setNewQty(10);
  };

  // Add standard preset if missing
  const handleAddPreset = (preset: StockSheet) => {
    const exists = stockInventory.some(
      (s) => s.width === preset.width && s.height === preset.height
    );
    if (!exists) {
      onUpdateStockInventory([
        ...stockInventory,
        { ...preset, id: `stock-${Date.now()}`, enabled: true },
      ]);
    } else {
      // Re-enable if it was disabled
      onUpdateStockInventory(
        stockInventory.map((s) =>
          s.width === preset.width && s.height === preset.height
            ? { ...s, enabled: true }
            : s
        )
      );
    }
  };

  // Select all stock sheets
  const handleSelectAll = () => {
    onUpdateStockInventory(stockInventory.map((s) => ({ ...s, enabled: true })));
  };

  // Deselect all stock sheets
  const handleDeselectAll = () => {
    onUpdateStockInventory(stockInventory.map((s) => ({ ...s, enabled: false })));
  };

  const activeCount = stockInventory.filter((s) => s.enabled === true).length;

  return (
    <div className="bg-[#141820] border border-[#2d3748] rounded p-3 sm:p-4 shadow-sm flex flex-col gap-4 text-[#e2e8f0]">
      {/* Lock banner if locked */}
      {isLocked && (
        <div className="bg-amber-950/80 border border-amber-700/60 rounded p-2.5 flex items-center gap-2 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Job Locked:</strong> Stock sheet inventory and cutting tolerances are locked. Unlock the job in the header to modify stock parameters.
          </span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#2d3748] pb-2.5">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-400" />
          <div>
            <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Stock Sheet Inventory
            </h2>
            <p className="text-[11px] text-slate-400">
              Check the sheet sizes you have in stock. The optimizer tests them to minimize wastage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              activeCount > 0
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                : 'text-amber-400 bg-amber-950/60 border-amber-800/60 font-semibold'
            }`}
          >
            {activeCount} of {stockInventory.length} Checked
          </span>
        </div>
      </div>

      {/* Warning banner if none selected */}
      {activeCount === 0 && !isLocked && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded p-2.5 flex items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>All sheet sizes are currently deselected. Please check your stock sheet sizes below.</span>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[10px] uppercase tracking-wider shrink-0 transition"
          >
            Check All
          </button>
        </div>
      )}

      {/* Stock Sheets List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Available Sizes
            </span>
            {!isLocked && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono"
                >
                  Check All
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[10px] text-slate-400 hover:text-slate-300 underline font-mono"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          {/* Quick preset additions */}
          {!isLocked && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Quick Add:</span>
              {DEFAULT_STOCK_SHEETS.slice(0, 3).map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => handleAddPreset(ps)}
                  className="text-[10px] px-1.5 py-0.5 bg-[#1a202c] hover:bg-[#252d3d] border border-slate-700 rounded text-slate-300 transition"
                >
                  +{ps.width}×{ps.height}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {stockInventory.map((sheet) => {
            const isEnabled = sheet.enabled ?? true;
            return (
              <div
                key={sheet.id}
                className={`p-2 rounded border transition flex items-center justify-between gap-2 text-xs font-mono ${
                  isEnabled
                    ? 'bg-[#181e28] border-[#2d3a4f] text-slate-200'
                    : 'bg-[#11141b] border-[#222834] text-slate-500 opacity-60'
                }`}
              >
                {/* Enable toggle checkbox */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleToggleEnable(sheet.id)}
                  className="flex items-center gap-2 cursor-pointer text-left disabled:cursor-not-allowed"
                >
                  {isEnabled ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-sans font-medium text-xs text-slate-200">
                      {sheet.name}
                    </div>
                    <div className="text-[11px] text-blue-400 font-mono">
                      {sheet.width} × {sheet.height} mm
                    </div>
                  </div>
                </button>

                {/* Quantity & Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      disabled={isLocked}
                      value={sheet.qty > 0 && sheet.qty < 9000 ? sheet.qty : ''}
                      placeholder="∞"
                      onChange={(e) =>
                        handleUpdateSheet(
                          sheet.id,
                          'qty',
                          e.target.value === '' ? 9999 : Math.max(1, Number(e.target.value))
                        )
                      }
                      className="w-14 bg-[#11141b] border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {stockInventory.length > 1 && !isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSheet(sheet.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                      title="Remove this stock sheet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Sheet Size Form */}
        <form
          onSubmit={handleAddStockSheet}
          className="bg-[#12161f] border border-[#2d3748] rounded p-2.5 flex flex-wrap items-center gap-2 text-xs"
        >
          <div className="flex-1 min-w-[110px]">
            <input
              type="text"
              placeholder="Name (optional)"
              disabled={isLocked}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              placeholder="Width"
              disabled={isLocked}
              value={newWidth}
              onChange={(e) => setNewWidth(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full bg-[#181d26] border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="w-16">
            <input
              type="number"
              placeholder="Qty"
              disabled={isLocked}
              value={newQty}
              onChange={(e) => setNewQty(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#181d26] border border-slate-700 rounded px-1.5 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isLocked || !newWidth || !newHeight}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded flex items-center gap-1 transition text-xs shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            <span>Add Size</span>
          </button>
        </form>
      </div>

      {/* Cutting Specs & Tolerances */}
      <div className="border-t border-[#2d3748] pt-3 space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Settings2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Cutting Tolerances & Offcuts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
              Blade / Score Kerf (mm)
            </label>
            <input
              type="number"
              step={0.5}
              min={0}
              max={10}
              disabled={isLocked}
              value={settings.kerf}
              onChange={(e) =>
                onUpdateSettings({ ...settings, kerf: Math.max(0, Number(e.target.value)) })
              }
              className="w-full bg-[#1e2533] border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[9px] text-slate-500">0mm for score & snap</span>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
              Trim Margin (mm)
            </label>
            <input
              type="number"
              step={1}
              min={0}
              max={50}
              disabled={isLocked}
              value={settings.trimMargin}
              onChange={(e) =>
                onUpdateSettings({ ...settings, trimMargin: Math.max(0, Number(e.target.value)) })
              }
              className="w-full bg-[#1e2533] border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-[9px] text-slate-500">Edge clean cut</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#181d26] p-2 rounded border border-[#2d3748]">
          <div className="flex items-center gap-2">
            <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <span className="text-xs text-slate-200 font-medium">Allow 90° Piece Rotation</span>
              <p className="text-[10px] text-slate-500">Rotates pieces to pack sheets with highest yield.</p>
            </div>
          </div>
          <input
            type="checkbox"
            disabled={isLocked}
            checked={settings.allowRotationGlobal}
            onChange={(e) =>
              onUpdateSettings({ ...settings, allowRotationGlobal: e.target.checked })
            }
            className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
            Optimization Engine Strategy
          </label>
          <select
            disabled={isLocked}
            value={settings.strategy}
            onChange={(e) =>
              onUpdateSettings({ ...settings, strategy: e.target.value as any })
            }
            className="w-full bg-[#1e2533] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="auto-best">Ensemble Auto-Best (10 Guillotine Heuristics)</option>
            <option value="guillotine-bssf">Guillotine Best Short Side Fit (BSSF)</option>
            <option value="guillotine-baf">Guillotine Best Area Fit (BAF)</option>
            <option value="shelf-ffd">Guillotine Shelf First-Fit Decreasing (FFD)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
