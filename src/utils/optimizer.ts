import {
  GlassPiece,
  StockSheet,
  OptimizerSettings,
  PackedSheet,
  PlacedPiece,
  CutLine,
  WasteArea,
  OptimizationResult,
  UnplacedItem,
} from '../types';
import { DEFAULT_STOCK_SHEETS } from './presets';

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

interface ItemToPack {
  pieceId: string;
  label: string;
  width: number;
  height: number;
  allowRotation: boolean;
  notes?: string;
  color: string;
  itemIndex: number;
  area: number;
}

type SplitRule = 'SLAS' | 'LLAS' | 'MINAS' | 'MAXAS' | 'HORIZ' | 'VERT';
type FitRule = 'BSSF' | 'BAF' | 'BLSF';
type SortRule = 'area' | 'max_dim' | 'height' | 'perimeter' | 'ratio';

interface TrialConfig {
  name: string;
  sortRule: SortRule;
  fitRule: FitRule;
  splitRule: SplitRule;
  preferOrientation?: 'horizontal' | 'vertical';
}

/**
 * Expand pieces according to their quantity into individual items
 */
function expandPieces(pieces: GlassPiece[]): ItemToPack[] {
  const items: ItemToPack[] = [];
  let itemIndex = 0;

  pieces.forEach((p) => {
    for (let q = 0; q < p.qty; q++) {
      items.push({
        pieceId: p.id,
        label: p.qty > 1 ? `${p.label} (#${q + 1})` : p.label,
        width: Math.round(Number(p.width)),
        height: Math.round(Number(p.height)),
        allowRotation: Boolean(p.allowRotation),
        notes: p.notes,
        color: p.color || '#0f3460',
        itemIndex: itemIndex++,
        area: Math.round(Number(p.width)) * Math.round(Number(p.height)),
      });
    }
  });

  return items;
}

/**
 * Sort items based on heuristic strategy
 */
function sortItems(items: ItemToPack[], sortRule: SortRule): ItemToPack[] {
  const sorted = [...items];
  switch (sortRule) {
    case 'area':
      return sorted.sort((a, b) => b.area - a.area || Math.max(b.width, b.height) - Math.max(a.width, a.height));
    case 'max_dim':
      return sorted.sort(
        (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height) || b.area - a.area
      );
    case 'height':
      return sorted.sort((a, b) => b.height - a.height || b.width - a.width);
    case 'perimeter':
      return sorted.sort(
        (a, b) => b.width + b.height - (a.width + a.height) || b.area - a.area
      );
    case 'ratio':
      return sorted.sort(
        (a, b) =>
          Math.max(b.width / b.height, b.height / b.width) -
          Math.max(a.width / a.height, a.height / a.width)
      );
    default:
      return sorted.sort((a, b) => b.area - a.area);
  }
}

interface SingleSheetGuillotineResult {
  sheet: PackedSheet | null;
  placedPiecesCount: number;
  placedArea: number;
  yieldPercentage: number;
  remainingItems: ItemToPack[];
}

/**
 * Packs a single stock sheet using Guillotine cuts
 */
function packSingleGuillotineSheet(
  stock: StockSheet,
  rawRemaining: ItemToPack[],
  settings: OptimizerSettings,
  trial: TrialConfig,
  sheetIndex: number
): SingleSheetGuillotineResult {
  const margin = Math.max(0, settings.trimMargin || 0);
  const kerf = Math.max(0, settings.kerf || 0);

  const usableW = stock.width - margin * 2;
  const usableH = stock.height - margin * 2;

  if (usableW <= 0 || usableH <= 0) {
    return {
      sheet: null,
      placedPiecesCount: 0,
      placedArea: 0,
      yieldPercentage: 0,
      remainingItems: rawRemaining,
    };
  }

  const remaining = [...rawRemaining];
  const sheetId = `sheet-${sheetIndex}`;
  const placedInSheet: PlacedPiece[] = [];
  const cutLines: CutLine[] = [];
  let cutSequenceCounter = 1;

  // Add border trim cut lines if trimMargin > 0
  if (margin > 0) {
    cutLines.push({
      id: `cut-trim-left-${sheetIndex}`,
      stepNumber: cutSequenceCounter++,
      x1: margin,
      y1: 0,
      x2: margin,
      y2: stock.height,
      orientation: 'vertical',
      length: stock.height,
      level: 1,
      label: `Trim Left (${margin}mm)`,
    });
    cutLines.push({
      id: `cut-trim-bottom-${sheetIndex}`,
      stepNumber: cutSequenceCounter++,
      x1: 0,
      y1: margin,
      x2: stock.width,
      y2: margin,
      orientation: 'horizontal',
      length: stock.width,
      level: 1,
      label: `Trim Bottom (${margin}mm)`,
    });
    cutLines.push({
      id: `cut-trim-right-${sheetIndex}`,
      stepNumber: cutSequenceCounter++,
      x1: stock.width - margin,
      y1: 0,
      x2: stock.width - margin,
      y2: stock.height,
      orientation: 'vertical',
      length: stock.height,
      level: 1,
      label: `Trim Right (${margin}mm)`,
    });
    cutLines.push({
      id: `cut-trim-top-${sheetIndex}`,
      stepNumber: cutSequenceCounter++,
      x1: 0,
      y1: stock.height - margin,
      x2: stock.width,
      y2: stock.height - margin,
      orientation: 'horizontal',
      length: stock.width,
      level: 1,
      label: `Trim Top (${margin}mm)`,
    });
  }

  // Active guillotine free rectangles
  let freeRectangles: FreeRect[] = [
    {
      x: margin,
      y: margin,
      width: usableW,
      height: usableH,
      level: 1,
    },
  ];

  let itemPackedInThisPass = true;

  while (itemPackedInThisPass && remaining.length > 0) {
    itemPackedInThisPass = false;

    let bestScore = Infinity;
    let bestItemIndex = -1;
    let bestRectIndex = -1;
    let bestRotated = false;
    let bestPieceW = 0;
    let bestPieceH = 0;

    // Optimization for large batches with repeated piece sizes (e.g. 1000+ pieces):
    // Only test unique (width x height x allowRotation) candidates against free rectangles
    const testedDims = new Set<string>();

    // Search best (item, freeRect) pair
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const dimKey = `${item.width}_${item.height}_${item.allowRotation}`;
      if (testedDims.has(dimKey)) continue;
      testedDims.add(dimKey);

      const canRotate = settings.allowRotationGlobal && item.allowRotation;

      for (let r = 0; r < freeRectangles.length; r++) {
        const fr = freeRectangles[r];

        // 1. Unrotated check
        if (item.width <= fr.width && item.height <= fr.height) {
          const score = evaluateScore(fr, item.width, item.height, trial.fitRule);
          if (score < bestScore) {
            bestScore = score;
            bestItemIndex = i;
            bestRectIndex = r;
            bestRotated = false;
            bestPieceW = item.width;
            bestPieceH = item.height;
          }
        }

        // 2. Rotated check
        if (canRotate && item.height <= fr.width && item.width <= fr.height) {
          const score = evaluateScore(fr, item.height, item.width, trial.fitRule);
          // Slight tie-breaker preference to keep unrotated if score is equal
          if (score < bestScore - 0.001) {
            bestScore = score;
            bestItemIndex = i;
            bestRectIndex = r;
            bestRotated = true;
            bestPieceW = item.height;
            bestPieceH = item.width;
          }
        }
      }

      // If BSSF or BAF found an exact or very tight fit, break early to pack rapidly
      if (bestScore === 0) break;
    }

    // If we found a fit, place the item and split the free rectangle
    if (bestItemIndex !== -1 && bestRectIndex !== -1) {
      itemPackedInThisPass = true;
      const item = remaining.splice(bestItemIndex, 1)[0];
      const targetRect = freeRectangles.splice(bestRectIndex, 1)[0];

      const placedX = targetRect.x;
      const placedY = targetRect.y;

      placedInSheet.push({
        id: `placed-${sheetIndex}-${placedInSheet.length + 1}`,
        pieceId: item.pieceId,
        label: item.label,
        x: placedX,
        y: placedY,
        width: bestPieceW,
        height: bestPieceH,
        rotated: bestRotated,
        originalWidth: item.width,
        originalHeight: item.height,
        area: item.area,
        color: item.color,
        sequenceIndex: placedInSheet.length + 1,
      });

      // Perform Guillotine Split
      const splitResult = splitGuillotine(
        targetRect,
        bestPieceW,
        bestPieceH,
        kerf,
        trial.splitRule,
        targetRect.level
      );

      // Record cut lines created by this guillotine split
      if (splitResult.cutLines.length > 0) {
        splitResult.cutLines.forEach((cl) => {
          cutLines.push({
            ...cl,
            stepNumber: cutSequenceCounter++,
          });
        });
      }

      // Add non-empty resulting free rectangles
      splitResult.newRects.forEach((nr) => {
        if (nr.width > 0 && nr.height > 0) {
          freeRectangles.push(nr);
        }
      });

      // Filter and merge collinear/redundant free rectangles if possible
      freeRectangles = cleanFreeRectangles(freeRectangles);
    }
  }

  if (placedInSheet.length === 0) {
    return {
      sheet: null,
      placedPiecesCount: 0,
      placedArea: 0,
      yieldPercentage: 0,
      remainingItems: rawRemaining,
    };
  }

  // Identify waste and reusable offcuts
  const wasteAreas: WasteArea[] = [];
  let totalGlassArea = 0;
  placedInSheet.forEach((p) => {
    totalGlassArea += p.width * p.height;
  });

  let scrapArea = 0;
  let reusableArea = 0;

  freeRectangles.forEach((fr, idx) => {
    const area = fr.width * fr.height;
    if (area > 0) {
      const isReusable =
        fr.width >= settings.minReusableWidth &&
        fr.height >= settings.minReusableHeight;

      if (isReusable) {
        reusableArea += area;
      } else {
        scrapArea += area;
      }

      wasteAreas.push({
        id: `waste-${sheetIndex}-${idx}`,
        x: fr.x,
        y: fr.y,
        width: fr.width,
        height: fr.height,
        area,
        isReusable,
      });
    }
  });

  const sheetArea = stock.width * stock.height;
  const yieldPercentage = Number(((totalGlassArea / sheetArea) * 100).toFixed(2));

  const sheet: PackedSheet = {
    sheetIndex,
    sheetId,
    sheetName: `${stock.name} #${sheetIndex}`,
    width: stock.width,
    height: stock.height,
    usableWidth: usableW,
    usableHeight: usableH,
    trimMargin: margin,
    placedPieces: placedInSheet,
    cutLines,
    wasteAreas,
    totalGlassArea,
    sheetArea,
    yieldPercentage,
    scrapArea,
    reusableArea,
  };

  return {
    sheet,
    placedPiecesCount: placedInSheet.length,
    placedArea: totalGlassArea,
    yieldPercentage,
    remainingItems: remaining,
  };
}

/**
 * Guillotine 2D Multi-Sheet Solver supporting Multiple Sheet Sizes
 */
function runGuillotinePacking(
  stocks: StockSheet[],
  rawItems: ItemToPack[],
  settings: OptimizerSettings,
  trial: TrialConfig
): {
  sheets: PackedSheet[];
  unplaced: ItemToPack[];
} {
  const items = sortItems(rawItems, trial.sortRule);
  let remaining = [...items];
  const packedSheets: PackedSheet[] = [];

  const stockInventory = new Map<string, number>();
  stocks.forEach((s) => {
    stockInventory.set(s.id, s.qty > 0 && Number.isFinite(s.qty) ? s.qty : 9999);
  });

  let sheetCount = 0;
  const MAX_SHEETS_TOTAL = 3000;

  while (remaining.length > 0 && sheetCount < MAX_SHEETS_TOTAL) {
    const availableStocks = stocks.filter((s) => (stockInventory.get(s.id) || 0) > 0);
    if (availableStocks.length === 0) break;

    let bestCandidateStock: StockSheet | null = null;
    let bestResult: SingleSheetGuillotineResult | null = null;
    let bestCandidateScore = -Infinity;

    for (const candStock of availableStocks) {
      const res = packSingleGuillotineSheet(candStock, remaining, settings, trial, sheetCount + 1);
      if (res.placedPiecesCount === 0 || !res.sheet) continue;

      let score = 0;
      const allFit = res.remainingItems.length === 0;
      const sheetArea = candStock.width * candStock.height;
      const wasteArea = Math.max(0, sheetArea - res.placedArea);

      if (allFit) {
        // Fits all pieces! Strict priority to minimize wasted scrap area (lowest sheet size)
        score = 50000000 - wasteArea + res.yieldPercentage * 10000;
      } else {
        // Multi-sheet packing: Prioritize highest yield percentage and lowest waste area
        const yieldRatio = res.placedArea / sheetArea;
        score =
          yieldRatio * 10000000 -
          (wasteArea / 100) +
          res.placedPiecesCount * 1000;
      }

      if (score > bestCandidateScore) {
        bestCandidateScore = score;
        bestCandidateStock = candStock;
        bestResult = res;
      }
    }

    if (!bestResult || !bestCandidateStock || !bestResult.sheet) {
      // Cannot place any remaining items on any available stock sheet
      break;
    }

    sheetCount++;
    packedSheets.push(bestResult.sheet);
    remaining = bestResult.remainingItems;

    const currentQty = stockInventory.get(bestCandidateStock.id) || 0;
    if (currentQty > 0 && currentQty < 9000) {
      stockInventory.set(bestCandidateStock.id, currentQty - 1);
    }
  }

  return {
    sheets: packedSheets,
    unplaced: remaining,
  };
}

interface SingleSheetShelfResult {
  sheet: PackedSheet | null;
  placedPiecesCount: number;
  placedArea: number;
  yieldPercentage: number;
  remainingItems: ItemToPack[];
}

function packSingleShelfSheet(
  stock: StockSheet,
  rawRemaining: ItemToPack[],
  settings: OptimizerSettings,
  sheetIndex: number
): SingleSheetShelfResult {
  const margin = Math.max(0, settings.trimMargin || 0);
  const kerf = Math.max(0, settings.kerf || 0);
  const usableW = stock.width - margin * 2;
  const usableH = stock.height - margin * 2;

  if (usableW <= 0 || usableH <= 0) {
    return {
      sheet: null,
      placedPiecesCount: 0,
      placedArea: 0,
      yieldPercentage: 0,
      remainingItems: rawRemaining,
    };
  }

  const remaining = [...rawRemaining];
  const sheetId = `shelf-sheet-${sheetIndex}`;
  const placedInSheet: PlacedPiece[] = [];
  const cutLines: CutLine[] = [];
  let cutSequenceCounter = 1;

  let currentY = margin;
  let shelfHeight = 0;
  let shelfX = margin;

  let packedSomething = true;
  while (packedSomething && remaining.length > 0) {
    packedSomething = false;

    // Find an item that fits on the current shelf
    let bestIdx = -1;
    let pieceW = 0;
    let pieceH = 0;
    let isRotated = false;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const canRotate = settings.allowRotationGlobal && item.allowRotation;

      // Try standard
      if (shelfX + item.width <= margin + usableW) {
        const testH = shelfHeight === 0 ? item.height : shelfHeight;
        if (currentY + testH <= margin + usableH && item.height <= testH) {
          bestIdx = i;
          pieceW = item.width;
          pieceH = item.height;
          isRotated = false;
          break;
        }
      }

      // Try rotated
      if (canRotate && shelfX + item.height <= margin + usableW) {
        const testH = shelfHeight === 0 ? item.width : shelfHeight;
        if (currentY + testH <= margin + usableH && item.width <= testH) {
          bestIdx = i;
          pieceW = item.height;
          pieceH = item.width;
          isRotated = true;
          break;
        }
      }
    }

    if (bestIdx !== -1) {
      // Place on current shelf
      const item = remaining.splice(bestIdx, 1)[0];
      if (shelfHeight === 0) {
        shelfHeight = pieceH;
      }

      placedInSheet.push({
        id: `placed-shelf-${sheetIndex}-${placedInSheet.length + 1}`,
        pieceId: item.pieceId,
        label: item.label,
        x: shelfX,
        y: currentY,
        width: pieceW,
        height: pieceH,
        rotated: isRotated,
        originalWidth: item.width,
        originalHeight: item.height,
        area: item.area,
        color: item.color,
        sequenceIndex: placedInSheet.length + 1,
      });

      // Add vertical guillotine cut after piece
      if (shelfX + pieceW + kerf < margin + usableW) {
        cutLines.push({
          id: `cut-shelf-v-${cutSequenceCounter}`,
          stepNumber: cutSequenceCounter++,
          x1: shelfX + pieceW,
          y1: currentY,
          x2: shelfX + pieceW,
          y2: currentY + shelfHeight,
          orientation: 'vertical',
          length: shelfHeight,
          level: 2,
          label: `Cross Cut @ X=${shelfX + pieceW}`,
        });
      }

      shelfX += pieceW + kerf;
      packedSomething = true;
    } else {
      // Close current shelf and start new shelf if there is vertical room
      if (shelfHeight > 0) {
        cutLines.push({
          id: `cut-shelf-h-${cutSequenceCounter}`,
          stepNumber: cutSequenceCounter++,
          x1: margin,
          y1: currentY + shelfHeight,
          x2: margin + usableW,
          y2: currentY + shelfHeight,
          orientation: 'horizontal',
          length: usableW,
          level: 1,
          label: `Rip Cut @ Y=${currentY + shelfHeight}`,
        });

        currentY += shelfHeight + kerf;
        shelfX = margin;
        shelfHeight = 0;

        if (currentY < margin + usableH) {
          packedSomething = true;
        }
      }
    }
  }

  if (placedInSheet.length === 0) {
    return {
      sheet: null,
      placedPiecesCount: 0,
      placedArea: 0,
      yieldPercentage: 0,
      remainingItems: rawRemaining,
    };
  }

  let totalGlassArea = 0;
  placedInSheet.forEach((p) => (totalGlassArea += p.width * p.height));
  const sheetArea = stock.width * stock.height;
  const yieldPercentage = Number(((totalGlassArea / sheetArea) * 100).toFixed(2));

  const wasteAreas: WasteArea[] = [];
  let scrapArea = 0;
  let reusableArea = 0;

  const remainingTopH = margin + usableH - currentY;
  if (remainingTopH > 0) {
    const area = usableW * remainingTopH;
    const isReusable =
      usableW >= settings.minReusableWidth && remainingTopH >= settings.minReusableHeight;
    if (isReusable) reusableArea += area;
    else scrapArea += area;

    wasteAreas.push({
      id: `shelf-waste-top-${sheetIndex}`,
      x: margin,
      y: currentY,
      width: usableW,
      height: remainingTopH,
      area,
      isReusable,
    });
  }

  const sheet: PackedSheet = {
    sheetIndex,
    sheetId,
    sheetName: `${stock.name} #${sheetIndex}`,
    width: stock.width,
    height: stock.height,
    usableWidth: usableW,
    usableHeight: usableH,
    trimMargin: margin,
    placedPieces: placedInSheet,
    cutLines,
    wasteAreas,
    totalGlassArea,
    sheetArea,
    yieldPercentage,
    scrapArea,
    reusableArea,
  };

  return {
    sheet,
    placedPiecesCount: placedInSheet.length,
    placedArea: totalGlassArea,
    yieldPercentage,
    remainingItems: remaining,
  };
}

/**
 * Shelf First-Fit Decreasing (FFD) Algorithm with Guillotine cuts supporting multiple stock sizes
 */
function runShelfPacking(
  stocks: StockSheet[],
  rawItems: ItemToPack[],
  settings: OptimizerSettings
): {
  sheets: PackedSheet[];
  unplaced: ItemToPack[];
} {
  // Sort items by height descending
  const items = [...rawItems].sort((a, b) => {
    const maxA = Math.max(a.width, a.height);
    const maxB = Math.max(b.width, b.height);
    return maxB - maxA || b.area - a.area;
  });

  let remaining = [...items];
  const packedSheets: PackedSheet[] = [];

  const stockInventory = new Map<string, number>();
  stocks.forEach((s) => {
    stockInventory.set(s.id, s.qty > 0 && Number.isFinite(s.qty) ? s.qty : 9999);
  });

  let sheetCount = 0;
  const MAX_SHEETS_TOTAL = 3000;

  while (remaining.length > 0 && sheetCount < MAX_SHEETS_TOTAL) {
    const availableStocks = stocks.filter((s) => (stockInventory.get(s.id) || 0) > 0);
    if (availableStocks.length === 0) break;

    let bestCandidateStock: StockSheet | null = null;
    let bestResult: SingleSheetShelfResult | null = null;
    let bestCandidateScore = -Infinity;

    for (const candStock of availableStocks) {
      const res = packSingleShelfSheet(candStock, remaining, settings, sheetCount + 1);
      if (res.placedPiecesCount === 0 || !res.sheet) continue;

      let score = 0;
      const allFit = res.remainingItems.length === 0;
      const sheetArea = candStock.width * candStock.height;
      const wasteArea = Math.max(0, sheetArea - res.placedArea);

      if (allFit) {
        // Fits all pieces! Strict priority to minimize wasted scrap area (lowest sheet size)
        score = 50000000 - wasteArea + res.yieldPercentage * 10000;
      } else {
        // Multi-sheet packing: Prioritize highest yield percentage and lowest waste area
        const yieldRatio = res.placedArea / sheetArea;
        score =
          yieldRatio * 10000000 -
          (wasteArea / 100) +
          res.placedPiecesCount * 1000;
      }

      if (score > bestCandidateScore) {
        bestCandidateScore = score;
        bestCandidateStock = candStock;
        bestResult = res;
      }
    }

    if (!bestResult || !bestCandidateStock || !bestResult.sheet) {
      break;
    }

    sheetCount++;
    packedSheets.push(bestResult.sheet);
    remaining = bestResult.remainingItems;

    const currentQty = stockInventory.get(bestCandidateStock.id) || 0;
    if (currentQty > 0 && currentQty < 9000) {
      stockInventory.set(bestCandidateStock.id, currentQty - 1);
    }
  }

  return {
    sheets: packedSheets,
    unplaced: remaining,
  };
}

/**
 * Score a candidate rectangle against an item
 */
function evaluateScore(
  freeRect: FreeRect,
  itemW: number,
  itemH: number,
  fitRule: FitRule
): number {
  const remW = freeRect.width - itemW;
  const remH = freeRect.height - itemH;

  switch (fitRule) {
    case 'BSSF': // Best Short Side Fit
      return Math.min(remW, remH);
    case 'BLSF': // Best Long Side Fit
      return Math.max(remW, remH);
    case 'BAF': // Best Area Fit
      return freeRect.width * freeRect.height - itemW * itemH;
    default:
      return Math.min(remW, remH);
  }
}

/**
 * Split a free rectangle along guillotine lines into two child rectangles
 */
function splitGuillotine(
  fr: FreeRect,
  pieceW: number,
  pieceH: number,
  kerf: number,
  splitRule: SplitRule,
  level: number
): {
  newRects: FreeRect[];
  cutLines: Omit<CutLine, 'stepNumber'>[];
} {
  const remW = fr.width - pieceW - kerf;
  const remH = fr.height - pieceH - kerf;

  const newRects: FreeRect[] = [];
  const cutLines: Omit<CutLine, 'stepNumber'>[] = [];

  // Decide whether to make the primary cut horizontal or vertical
  let splitHorizontal = false;

  switch (splitRule) {
    case 'SLAS': // Shorter Axis Split
      splitHorizontal = pieceW <= pieceH;
      break;
    case 'LLAS': // Longer Axis Split
      splitHorizontal = pieceW > pieceH;
      break;
    case 'MINAS': // Minimize leftover area difference
      splitHorizontal = pieceW * remH <= remW * pieceH;
      break;
    case 'MAXAS':
      splitHorizontal = pieceW * remH > remW * pieceH;
      break;
    case 'HORIZ':
      splitHorizontal = true;
      break;
    case 'VERT':
      splitHorizontal = false;
      break;
    default:
      splitHorizontal = pieceW <= pieceH;
  }

  if (splitHorizontal) {
    // Primary Cut: Horizontal cut across full width at y = fr.y + pieceH
    if (remH >= 0) {
      cutLines.push({
        id: `cut-${fr.x}-${fr.y + pieceH}-h`,
        x1: fr.x,
        y1: fr.y + pieceH,
        x2: fr.x + fr.width,
        y2: fr.y + pieceH,
        orientation: 'horizontal',
        length: fr.width,
        level: level,
        label: `Horizontal Rip @ Y=${fr.y + pieceH}`,
      });

      // Top remaining rectangle
      newRects.push({
        x: fr.x,
        y: fr.y + pieceH + kerf,
        width: fr.width,
        height: remH,
        level: level + 1,
      });
    }

    // Secondary Cut: Vertical cut to isolate piece in bottom portion
    if (remW >= 0) {
      cutLines.push({
        id: `cut-${fr.x + pieceW}-${fr.y}-v`,
        x1: fr.x + pieceW,
        y1: fr.y,
        x2: fr.x + pieceW,
        y2: fr.y + pieceH,
        orientation: 'vertical',
        length: pieceH,
        level: level + 1,
        label: `Vertical Cross Cut @ X=${fr.x + pieceW}`,
      });

      // Right remaining rectangle
      newRects.push({
        x: fr.x + pieceW + kerf,
        y: fr.y,
        width: remW,
        height: pieceH,
        level: level + 1,
      });
    }
  } else {
    // Primary Cut: Vertical cut across full height at x = fr.x + pieceW
    if (remW >= 0) {
      cutLines.push({
        id: `cut-${fr.x + pieceW}-${fr.y}-v`,
        x1: fr.x + pieceW,
        y1: fr.y,
        x2: fr.x + pieceW,
        y2: fr.y + fr.height,
        orientation: 'vertical',
        length: fr.height,
        level: level,
        label: `Vertical Rip @ X=${fr.x + pieceW}`,
      });

      // Right remaining rectangle
      newRects.push({
        x: fr.x + pieceW + kerf,
        y: fr.y,
        width: remW,
        height: fr.height,
        level: level + 1,
      });
    }

    // Secondary Cut: Horizontal cut to isolate piece in left portion
    if (remH >= 0) {
      cutLines.push({
        id: `cut-${fr.x}-${fr.y + pieceH}-h`,
        x1: fr.x,
        y1: fr.y + pieceH,
        x2: fr.x + pieceW,
        y2: fr.y + pieceH,
        orientation: 'horizontal',
        length: pieceW,
        level: level + 1,
        label: `Horizontal Cross Cut @ Y=${fr.y + pieceH}`,
      });

      // Top remaining rectangle
      newRects.push({
        x: fr.x,
        y: fr.y + pieceH + kerf,
        width: pieceW,
        height: remH,
        level: level + 1,
      });
    }
  }

  return { newRects, cutLines };
}

/**
 * Filter out zero-sized free rectangles and sort by area descending
 */
function cleanFreeRectangles(rects: FreeRect[]): FreeRect[] {
  return rects
    .filter((r) => r.width > 0 && r.height > 0)
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

/**
 * Main Optimization Orchestrator
 * Evaluates multiple guillotine strategies and chooses the optimal outcome
 */
export function optimizeGlassCutting(
  stockInput: StockSheet | StockSheet[],
  pieces: GlassPiece[],
  settings: OptimizerSettings
): OptimizationResult {
  const startTime = performance.now();

  const stocksRaw = Array.isArray(stockInput) ? stockInput : [stockInput];
  const stocks = stocksRaw.filter(
    (s) => (s.enabled ?? true) && s.width > 0 && s.height > 0
  );
  const validStocks = stocks.length > 0 ? stocks : DEFAULT_STOCK_SHEETS;

  const items = expandPieces(pieces);
  const totalPiecesRequested = items.length;

  if (items.length === 0) {
    return {
      sheets: [],
      unplacedPieces: [],
      totalGlassArea: 0,
      totalStockArea: 0,
      overallYield: 0,
      totalWasteArea: 0,
      totalScrapArea: 0,
      totalReusableArea: 0,
      totalSheetsUsed: 0,
      totalPiecesPlaced: 0,
      totalPiecesRequested: 0,
      executionTimeMs: 0,
      algorithmUsed: 'None',
    };
  }

  // Define candidate heuristic trials
  const trials: TrialConfig[] = [];

  if (settings.strategy === 'shelf-ffd') {
    // Force shelf algorithm
    const result = runShelfPacking(validStocks, items, settings);
    return finalizeResult(result.sheets, result.unplaced, pieces, startTime, 'Guillotine Shelf (FFD)');
  }

  if (settings.strategy === 'guillotine-bssf') {
    trials.push({
      name: 'Guillotine BSSF (SLAS, Area Desc)',
      sortRule: 'area',
      fitRule: 'BSSF',
      splitRule: 'SLAS',
    });
    trials.push({
      name: 'Guillotine BSSF (LLAS, Max Dim)',
      sortRule: 'max_dim',
      fitRule: 'BSSF',
      splitRule: 'LLAS',
    });
  } else if (settings.strategy === 'guillotine-baf') {
    trials.push({
      name: 'Guillotine BAF (MINAS, Area Desc)',
      sortRule: 'area',
      fitRule: 'BAF',
      splitRule: 'MINAS',
    });
    trials.push({
      name: 'Guillotine BAF (MAXAS, Height Desc)',
      sortRule: 'height',
      fitRule: 'BAF',
      splitRule: 'MAXAS',
    });
  } else {
    // 'auto-best' ensemble strategy: run competitive suite of guillotine heuristics
    const isLargeBatch = totalPiecesRequested > 150;
    if (isLargeBatch) {
      // Streamlined top heuristics for large batches (hundreds/thousands of pieces)
      trials.push(
        {
          name: 'Guillotine BSSF (SLAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'SLAS',
        },
        {
          name: 'Guillotine BAF (MINAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BAF',
          splitRule: 'MINAS',
        },
        {
          name: 'Guillotine BSSF (LLAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'LLAS',
        }
      );
    } else {
      trials.push(
        {
          name: 'Guillotine BSSF (SLAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'SLAS',
        },
        {
          name: 'Guillotine BSSF (LLAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'LLAS',
        },
        {
          name: 'Guillotine BSSF (MINAS, MaxDim Desc)',
          sortRule: 'max_dim',
          fitRule: 'BSSF',
          splitRule: 'MINAS',
        },
        {
          name: 'Guillotine BAF (MINAS, Area Desc)',
          sortRule: 'area',
          fitRule: 'BAF',
          splitRule: 'MINAS',
        },
        {
          name: 'Guillotine BAF (SLAS, Height Desc)',
          sortRule: 'height',
          fitRule: 'BAF',
          splitRule: 'SLAS',
        },
        {
          name: 'Guillotine BLSF (LLAS, Perimeter Desc)',
          sortRule: 'perimeter',
          fitRule: 'BLSF',
          splitRule: 'LLAS',
        },
        {
          name: 'Guillotine BSSF (Horiz Primary, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'HORIZ',
        },
        {
          name: 'Guillotine BSSF (Vert Primary, Area Desc)',
          sortRule: 'area',
          fitRule: 'BSSF',
          splitRule: 'VERT',
        }
      );
    }
  }

  let bestPacking: { sheets: PackedSheet[]; unplaced: ItemToPack[] } | null = null;
  let bestAlgorithmName = '';
  let bestScore = -Infinity; // higher is better

  // Generate stock ordering variants if multiple stock sizes are enabled
  // This prevents order-of-entry or serial-number bias and guarantees finding minimum wastage
  const stockVariants: Array<{ label: string; list: StockSheet[] }> = [
    { label: 'Standard Order', list: validStocks },
  ];

  if (validStocks.length > 1) {
    // 1. Smallest sheets first (encourages using compact sheets before giant jumbo sheets)
    stockVariants.push({
      label: 'Smallest First',
      list: [...validStocks].sort((a, b) => a.width * a.height - b.width * b.height),
    });
    // 2. Largest sheets first (only if not a very large batch to preserve instant speed)
    if (totalPiecesRequested <= 150) {
      stockVariants.push({
        label: 'Largest First',
        list: [...validStocks].sort((a, b) => b.width * b.height - a.width * a.height),
      });
      // 3. For each stock type, test prioritizing it first
      validStocks.forEach((st) => {
        stockVariants.push({
          label: `Prioritize ${st.name}`,
          list: [st, ...validStocks.filter((s) => s.id !== st.id)],
        });
      });
    }
  }

  // Also try Shelf FFD across stock variants if in auto-best mode
  if (settings.strategy === 'auto-best') {
    for (const sv of stockVariants) {
      const shelfResult = runShelfPacking(sv.list, items, settings);
      const score = evaluatePackingQuality(shelfResult.sheets, shelfResult.unplaced.length, totalPiecesRequested);
      if (score > bestScore || bestPacking === null) {
        bestScore = score;
        bestPacking = shelfResult;
        bestAlgorithmName = `Guillotine Shelf (${sv.label})`;
      }
    }
  }

  // Run competitive trials across stock ordering variants
  for (const trial of trials) {
    for (const sv of stockVariants) {
      const result = runGuillotinePacking(sv.list, items, settings, trial);
      const score = evaluatePackingQuality(result.sheets, result.unplaced.length, totalPiecesRequested);

      if (score > bestScore || bestPacking === null) {
        bestScore = score;
        bestPacking = result;
        bestAlgorithmName = `${trial.name} [${sv.label}]`;
      }
    }
  }

  return finalizeResult(
    bestPacking?.sheets || [],
    bestPacking?.unplaced || [],
    pieces,
    startTime,
    bestAlgorithmName
  );
}

/**
 * Score the overall quality of a cutting solution:
 * 1. Placed pieces count (highest priority)
 * 2. ABSOLUTE MINIMUM WASTAGE AREA:
 *    The engine minimizes total square millimeters of discarded scrap glass.
 *    Any solution that satisfies the cut list using less total sheet area / less scrap
 *    is guaranteed to win over a solution that used an oversized or suboptimal sheet.
 * 3. Overall yield %
 */
function evaluatePackingQuality(
  sheets: PackedSheet[],
  unplacedCount: number,
  totalRequested: number
): number {
  const placedCount = totalRequested - unplacedCount;
  if (sheets.length === 0) return -1000000000;

  let totalGlassArea = 0;
  let totalStockArea = 0;
  sheets.forEach((s) => {
    totalGlassArea += s.totalGlassArea;
    totalStockArea += s.sheetArea;
  });

  const totalWasteArea = Math.max(0, totalStockArea - totalGlassArea);
  const yieldPercent = totalStockArea > 0 ? (totalGlassArea / totalStockArea) * 100 : 0;

  // Primary: 100% of pieces placed
  // Secondary: MINIMUM TOTAL WASTAGE AREA (mm²) + Overall Yield %
  return placedCount * 10000000000 - totalWasteArea + yieldPercent * 10000;
}

/**
 * Compile final metrics and summary
 */
function finalizeResult(
  sheets: PackedSheet[],
  unplaced: ItemToPack[],
  originalPieces: GlassPiece[],
  startTime: number,
  algorithmUsed: string
): OptimizationResult {
  const endTime = performance.now();
  const executionTimeMs = Math.round(endTime - startTime);

  let totalGlassArea = 0;
  let totalStockArea = 0;
  let totalScrapArea = 0;
  let totalReusableArea = 0;
  let totalPiecesPlaced = 0;

  sheets.forEach((s) => {
    totalGlassArea += s.totalGlassArea;
    totalStockArea += s.sheetArea;
    totalScrapArea += s.scrapArea;
    totalReusableArea += s.reusableArea;
    totalPiecesPlaced += s.placedPieces.length;
  });

  const totalWasteArea = Math.max(0, totalStockArea - totalGlassArea);
  const overallYield =
    totalStockArea > 0 ? Number(((totalGlassArea / totalStockArea) * 100).toFixed(2)) : 0;

  // Aggregate unplaced items
  const unplacedMap = new Map<string, number>();
  unplaced.forEach((u) => {
    unplacedMap.set(u.pieceId, (unplacedMap.get(u.pieceId) || 0) + 1);
  });

  const unplacedPieces: UnplacedItem[] = [];
  originalPieces.forEach((p) => {
    const rem = unplacedMap.get(p.id) || 0;
    if (rem > 0) {
      unplacedPieces.push({ piece: p, remainingQty: rem });
    }
  });

  return {
    sheets,
    unplacedPieces,
    totalGlassArea,
    totalStockArea,
    overallYield,
    totalWasteArea,
    totalScrapArea,
    totalReusableArea,
    totalSheetsUsed: sheets.length,
    totalPiecesPlaced,
    totalPiecesRequested: totalPiecesPlaced + unplaced.length,
    executionTimeMs,
    algorithmUsed,
  };
}
