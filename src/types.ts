export interface GlassPiece {
  id: string;
  label: string;
  width: number;
  height: number;
  qty: number;
  allowRotation: boolean;
  notes?: string;
  color?: string;
}

export interface StockSheet {
  id: string;
  name: string;
  width: number;
  height: number;
  qty: number; // 0 or Infinity for unlimited
  cost?: number;
  enabled?: boolean; // whether this sheet size is available for multi-stock optimization
}

export type JobStatus = 'draft' | 'optimized' | 'ready_for_cnc' | 'completed';

export interface AppUser {
  id: string; // 'user1', 'user2', 'user3'
  name: string; // e.g. 'User 1 (Admin)'
  role: 'admin' | 'planner' | 'operator';
  canLock: boolean;
  canEdit: boolean;
  color: string;
}

export interface Job {
  id: string;
  serialNumber: string; // e.g. "GLS-001"
  title: string;
  client?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  pieces: GlassPiece[];
  stockInventory: StockSheet[];
  settings: OptimizerSettings;
  result: OptimizationResult | null;
  locked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
}

export type CNCFormat = 'dxf' | 'gcode' | 'csv' | 'json';

export interface OptimizerSettings {
  kerf: number; // blade/score cut allowance in mm (default 0 or 2)
  trimMargin: number; // edge trim margin in mm (e.g. 10mm for clean edges)
  allowRotationGlobal: boolean;
  strategy: 'auto-best' | 'guillotine-bssf' | 'guillotine-baf' | 'shelf-ffd';
  minReusableWidth: number; // e.g. 400mm
  minReusableHeight: number; // e.g. 400mm
}

export interface PlacedPiece {
  id: string;
  pieceId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  originalWidth: number;
  originalHeight: number;
  area: number;
  color: string;
  sequenceIndex: number;
}

export interface CutLine {
  id: string;
  stepNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  orientation: 'horizontal' | 'vertical';
  length: number;
  level: number; // 1 = primary rip, 2 = cross, 3 = tertiary
  label: string;
}

export interface WasteArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  isReusable: boolean;
}

export interface PackedSheet {
  sheetIndex: number;
  sheetId: string;
  sheetName: string;
  width: number;
  height: number;
  usableWidth: number;
  usableHeight: number;
  trimMargin: number;
  placedPieces: PlacedPiece[];
  cutLines: CutLine[];
  wasteAreas: WasteArea[];
  totalGlassArea: number; // mm²
  sheetArea: number; // mm²
  yieldPercentage: number;
  scrapArea: number;
  reusableArea: number;
}

export interface UnplacedItem {
  piece: GlassPiece;
  remainingQty: number;
}

export interface OptimizationResult {
  sheets: PackedSheet[];
  unplacedPieces: UnplacedItem[];
  totalGlassArea: number; // mm²
  totalStockArea: number; // mm²
  overallYield: number; // %
  totalWasteArea: number; // mm²
  totalScrapArea: number; // mm²
  totalReusableArea: number; // mm²
  totalSheetsUsed: number;
  totalPiecesPlaced: number;
  totalPiecesRequested: number;
  executionTimeMs: number;
  algorithmUsed: string;
}
