import { GlassPiece } from '../types';
import { COLOR_PALETTE } from './presets';

export interface ParseResult {
  pieces: GlassPiece[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  totalPieces: number;
}

/**
 * Parses pasted text from Excel or CSV spreadsheets
 */
export function parseExcelClipboard(text: string, existingPieceCount = 0): ParseResult {
  const result: ParseResult = {
    pieces: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    totalPieces: 0,
  };

  if (!text || text.trim() === '') {
    result.errors.push('No data found in clipboard. Please copy rows from your spreadsheet first.');
    return result;
  }

  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    result.errors.push('Clipboard text appears to be empty.');
    return result;
  }

  result.totalRows = rawLines.length;

  // Split line by delimiter: tab (\t) preferred (Excel default), else comma or semicolon
  const detectDelimiter = (line: string): string => {
    if (line.includes('\t')) return '\t';
    if (line.includes(';')) return ';';
    if (line.includes(',')) return ',';
    if (line.includes('|')) return '|';
    return /\s{2,}/.test(line) ? 'whitespace' : '\t';
  };

  const firstLine = rawLines[0];
  const delimiter = detectDelimiter(firstLine);

  const splitRow = (line: string): string[] => {
    if (delimiter === 'whitespace') {
      return line.split(/\s{2,}/).map((s) => s.trim().replace(/^["']|["']$/g, ''));
    }
    return line.split(delimiter).map((s) => s.trim().replace(/^["']|["']$/g, ''));
  };

  // Inspect first row for headers
  const firstRowCols = splitRow(firstLine).map((c) => c.toLowerCase());
  let hasHeader = false;
  let colWidth = -1;
  let colHeight = -1;
  let colQty = -1;
  let colLabel = -1;
  let colNotes = -1;

  firstRowCols.forEach((col, idx) => {
    if (/^(w|width|w \(mm\)|width \(mm\)|b|breite|ancho|largeur)$/i.test(col)) {
      colWidth = idx;
      hasHeader = true;
    } else if (/^(h|height|h \(mm\)|height \(mm\)|hoehe|höhe|alto|hauteur)$/i.test(col)) {
      colHeight = idx;
      hasHeader = true;
    } else if (/^(qty|quantity|q|count|pcs|stk|stück|cant|quantite)$/i.test(col)) {
      colQty = idx;
      hasHeader = true;
    } else if (/^(label|id|name|ref|item|piece|part|tag|description|desc)$/i.test(col)) {
      colLabel = idx;
      hasHeader = true;
    } else if (/^(note|notes|remark|remarks|type|glass type)$/i.test(col)) {
      colNotes = idx;
      hasHeader = true;
    }
  });

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < rawLines.length; i++) {
    const row = splitRow(rawLines[i]);
    if (row.length === 0 || row.every((c) => c === '')) continue;

    let width = 0;
    let height = 0;
    let qty = 1;
    let label = '';
    let notes = '';

    if (hasHeader && colWidth !== -1 && colHeight !== -1) {
      width = parseFloat(row[colWidth] || '0');
      height = parseFloat(row[colHeight] || '0');
      if (colQty !== -1 && row[colQty]) {
        qty = parseInt(row[colQty], 10) || 1;
      }
      if (colLabel !== -1 && row[colLabel]) {
        label = row[colLabel];
      }
      if (colNotes !== -1 && row[colNotes]) {
        notes = row[colNotes];
      }
    } else {
      // Heuristic parsing when no explicit headers are matched
      // Check if first column has format "1200x800" or "1200*800"
      const dimMatch = row[0].match(/(\d+[\.,]?\d*)\s*[xX\*×]\s*(\d+[\.,]?\d*)/);
      if (dimMatch) {
        width = parseFloat(dimMatch[1].replace(',', '.'));
        height = parseFloat(dimMatch[2].replace(',', '.'));
        if (row.length > 1) {
          const secondColNum = parseInt(row[1], 10);
          if (!isNaN(secondColNum) && secondColNum > 0) {
            qty = secondColNum;
            if (row.length > 2) label = row[2];
          } else {
            label = row[1];
            if (row.length > 2) qty = parseInt(row[2], 10) || 1;
          }
        }
      } else if (row.length === 2) {
        // [Width, Height]
        width = parseFloat(row[0].replace(',', '.'));
        height = parseFloat(row[1].replace(',', '.'));
        qty = 1;
      } else if (row.length === 3) {
        // Standard User Mandated Format: [QTY, Width, Height]
        const col0IsNum = !isNaN(parseFloat(row[0])) && isFinite(Number(row[0].replace(',', '.')));
        const col1IsNum = !isNaN(parseFloat(row[1])) && isFinite(Number(row[1].replace(',', '.')));
        const col2IsNum = !isNaN(parseFloat(row[2])) && isFinite(Number(row[2].replace(',', '.')));

        if (col0IsNum && col1IsNum && col2IsNum) {
          // Standard Format: [QTY, Width, Height]
          const val0 = parseFloat(row[0].replace(',', '.'));
          const val1 = parseFloat(row[1].replace(',', '.'));
          const val2 = parseFloat(row[2].replace(',', '.'));

          // If col0 is small (or integer) and col1/col2 are glass dimensions, standard Qty-Width-Height
          qty = Math.max(1, Math.round(val0));
          width = val1;
          height = val2;
        } else if (!col0IsNum && col1IsNum && col2IsNum) {
          // [Label, Width, Height]
          label = row[0];
          width = parseFloat(row[1].replace(',', '.'));
          height = parseFloat(row[2].replace(',', '.'));
          qty = 1;
        } else if (col0IsNum && col1IsNum && !col2IsNum) {
          // [Width, Height, Label]
          width = parseFloat(row[0].replace(',', '.'));
          height = parseFloat(row[1].replace(',', '.'));
          label = row[2];
          qty = 1;
        } else {
          width = parseFloat(row[0].replace(',', '.'));
          height = parseFloat(row[1].replace(',', '.'));
          qty = 1;
        }
      } else if (row.length >= 4) {
        // Standard User Mandated Format: [QTY, Width, Height, Label/Notes]
        const col0IsNum = !isNaN(parseFloat(row[0])) && isFinite(Number(row[0].replace(',', '.')));
        const col1IsNum = !isNaN(parseFloat(row[1])) && isFinite(Number(row[1].replace(',', '.')));
        const col2IsNum = !isNaN(parseFloat(row[2])) && isFinite(Number(row[2].replace(',', '.')));

        if (col0IsNum && col1IsNum && col2IsNum) {
          // Standard: [QTY, Width, Height, Label, ...]
          qty = Math.max(1, Math.round(parseFloat(row[0].replace(',', '.'))));
          width = parseFloat(row[1].replace(',', '.'));
          height = parseFloat(row[2].replace(',', '.'));
          label = row[3];
          if (row.length > 4) notes = row.slice(4).join(' ');
        } else if (!col0IsNum && col1IsNum && col2IsNum) {
          // [Label, Width, Height, Qty, ...]
          label = row[0];
          width = parseFloat(row[1].replace(',', '.'));
          height = parseFloat(row[2].replace(',', '.'));
          qty = parseInt(row[3], 10) || 1;
          if (row.length > 4) notes = row.slice(4).join(' ');
        } else {
          qty = parseInt(row[0], 10) || 1;
          width = parseFloat(row[1].replace(',', '.'));
          height = parseFloat(row[2].replace(',', '.'));
          label = row[3] || '';
        }
      }
    }

    // Validation
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      result.warnings.push(`Row ${i + 1} skipped: invalid dimensions "${row.join(', ')}"`);
      continue;
    }

    if (isNaN(qty) || qty <= 0) {
      qty = 1;
    }

    const pieceNumber = existingPieceCount + result.pieces.length + 1;
    if (!label || label.trim() === '') {
      label = `Glass Pane #${pieceNumber}`;
    }

    const color = COLOR_PALETTE[(pieceNumber - 1) % COLOR_PALETTE.length];

    result.pieces.push({
      id: `piece-${Date.now()}-${result.pieces.length + 1}`,
      label,
      width: Math.round(width),
      height: Math.round(height),
      qty: Math.min(100000, Math.max(1, Math.round(qty))),
      allowRotation: true,
      notes,
      color,
    });

    result.totalPieces += qty;
  }

  if (result.pieces.length === 0 && result.warnings.length > 0) {
    result.errors.push('No valid glass dimensions could be extracted from the clipboard.');
  }

  return result;
}
