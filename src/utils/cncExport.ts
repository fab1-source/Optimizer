import { PackedSheet, OptimizationResult, StockSheet } from '../types';

/**
 * Generates an AutoCAD R12 DXF string for a packed glass cutting sheet.
 * Compatible with Bottero, Hegla, Intermac, Bystronic, Lisec, Optima, and CNC controllers.
 */
export function generateSheetDXF(sheet: PackedSheet, jobSerial = 'JOB-001'): string {
  const lines: string[] = [];

  // DXF Header
  lines.push('0', 'SECTION');
  lines.push('2', 'HEADER');
  lines.push('9', '$ACADVER');
  lines.push('1', 'AC1009'); // AutoCAD R12 DXF version - maximum compatibility
  lines.push('9', '$INSUNITS');
  lines.push('70', '4'); // 4 = Millimeters
  lines.push('0', 'ENDSEC');

  // TABLES Section (Layers)
  lines.push('0', 'SECTION');
  lines.push('2', 'TABLES');
  lines.push('0', 'TABLE');
  lines.push('2', 'LAYER');
  lines.push('70', '5');

  // Layer: SHEET_PERIMETER (White/7)
  lines.push('0', 'LAYER', '2', 'SHEET_PERIMETER', '70', '0', '62', '7', '6', 'CONTINUOUS');
  // Layer: CUTS_PRIMARY_RIP (Red/1)
  lines.push('0', 'LAYER', '2', 'CUTS_PRIMARY_RIP', '70', '0', '62', '1', '6', 'CONTINUOUS');
  // Layer: CUTS_CROSS (Magenta/6)
  lines.push('0', 'LAYER', '2', 'CUTS_CROSS', '70', '0', '62', '6', '6', 'CONTINUOUS');
  // Layer: GLASS_PARTS (Cyan/4)
  lines.push('0', 'LAYER', '2', 'GLASS_PARTS', '70', '0', '62', '4', '6', 'CONTINUOUS');
  // Layer: LABELS_TEXT (Green/3)
  lines.push('0', 'LAYER', '2', 'LABELS_TEXT', '70', '0', '62', '3', '6', 'CONTINUOUS');

  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // ENTITIES Section
  lines.push('0', 'SECTION');
  lines.push('2', 'ENTITIES');

  // 1. Stock Sheet Perimeter (4 lines forming rectangle)
  const drawRect = (x1: number, y1: number, x2: number, y2: number, layer: string) => {
    // Line 1: bottom
    lines.push('0', 'LINE', '8', layer, '10', `${x1}`, '20', `${y1}`, '11', `${x2}`, '21', `${y1}`);
    // Line 2: right
    lines.push('0', 'LINE', '8', layer, '10', `${x2}`, '20', `${y1}`, '11', `${x2}`, '21', `${y2}`);
    // Line 3: top
    lines.push('0', 'LINE', '8', layer, '10', `${x2}`, '20', `${y2}`, '11', `${x1}`, '21', `${y2}`);
    // Line 4: left
    lines.push('0', 'LINE', '8', layer, '10', `${x1}`, '20', `${y2}`, '11', `${x1}`, '21', `${y1}`);
  };

  drawRect(0, 0, sheet.width, sheet.height, 'SHEET_PERIMETER');

  // 2. Guillotine Cut Lines
  sheet.cutLines.forEach((c) => {
    const layer = c.level === 1 ? 'CUTS_PRIMARY_RIP' : 'CUTS_CROSS';
    lines.push(
      '0',
      'LINE',
      '8',
      layer,
      '10',
      `${Math.round(c.x1)}`,
      '20',
      `${Math.round(c.y1)}`,
      '11',
      `${Math.round(c.x2)}`,
      '21',
      `${Math.round(c.y2)}`
    );
  });

  // 3. Glass Pieces Outlines and Centered Text
  sheet.placedPieces.forEach((p) => {
    drawRect(p.x, p.y, p.x + p.width, p.y + p.height, 'GLASS_PARTS');

    // Add piece text in center
    const cx = Math.round(p.x + p.width / 2);
    const cy = Math.round(p.y + p.height / 2);
    const textHeight = Math.max(25, Math.min(80, Math.round(p.height / 10)));

    lines.push(
      '0',
      'TEXT',
      '8',
      'LABELS_TEXT',
      '10',
      `${cx}`,
      '20',
      `${cy}`,
      '40',
      `${textHeight}`,
      '1',
      `#${p.sequenceIndex} ${p.label} [${Math.round(p.width)}x${Math.round(p.height)}]`,
      '72',
      '1', // center horizontal
      '73',
      '2', // middle vertical
      '11',
      `${cx}`,
      '21',
      `${cy}`
    );
  });

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');

  return lines.join('\n');
}

/**
 * Generates CNC G-Code (.nc) program for industrial glass cutting tables
 */
export function generateSheetGCode(sheet: PackedSheet, jobSerial = 'JOB-001'): string {
  const gcode: string[] = [];

  gcode.push(`%`);
  gcode.push(`( ---------------------------------------------------- )`);
  gcode.push(`( CNC GLASS CUTTING PLAN - INDUSTRIAL GUILLOTINE PATH  )`);
  gcode.push(`( JOB REF: ${jobSerial} | SHEET #${sheet.sheetIndex} )`);
  gcode.push(`( STOCK SHEET: ${sheet.sheetName} - ${sheet.width} x ${sheet.height} mm )`);
  gcode.push(`( PIECES CUT: ${sheet.placedPieces.length} | YIELD: ${sheet.yieldPercentage}% )`);
  gcode.push(`( DATE: ${new Date().toISOString()} )`);
  gcode.push(`( ---------------------------------------------------- )`);
  gcode.push(``);
  gcode.push(`G90 (Absolute Programming Mode)`);
  gcode.push(`G21 (Metric Dimensions - Millimeters)`);
  gcode.push(`G17 (XY Working Plane)`);
  gcode.push(`G00 Z15.000 (Retract cutting head to safety clearance)`);
  gcode.push(`G00 X0.000 Y0.000 (Origin Datum Reference)`);
  gcode.push(`M08 (Cutting Oil Lubrication ON)`);
  gcode.push(``);

  // Guillotine cut scoring moves
  sheet.cutLines.forEach((c) => {
    const isRip = c.level === 1;
    const feedRate = isRip ? 24000 : 20000; // 24m/min rip, 20m/min cross

    gcode.push(`( --- STEP #${c.stepNumber}: ${c.label} [Length: ${Math.round(c.length)}mm] --- )`);
    // Rapid to start point
    gcode.push(`G00 X${c.x1.toFixed(3)} Y${c.y1.toFixed(3)}`);
    // Pressure down / wheel engage
    gcode.push(`G01 Z0.000 F3500 (Engage diamond scoring wheel with air cylinder)`);
    // Linear cut score
    gcode.push(`G01 X${c.x2.toFixed(3)} Y${c.y2.toFixed(3)} F${feedRate}`);
    // Retract wheel
    gcode.push(`G00 Z15.000 (Raise scoring head)`);
    gcode.push(``);
  });

  gcode.push(`( --- CYCLE END --- )`);
  gcode.push(`M09 (Cutting Oil OFF)`);
  gcode.push(`G00 Z30.000 (High Head Park Position)`);
  gcode.push(`G00 X0.000 Y0.000 (Return to Sheet Load/Unload Datum)`);
  gcode.push(`M30 (Program End and Rewind)`);
  gcode.push(`%`);

  return gcode.join('\n');
}

/**
 * Generates CSV machine cutting list for CNC Glass Tables
 */
export function generateMachineCSV(result: OptimizationResult, jobSerial = 'JOB-001'): string {
  const rows: string[] = [
    'Job_Serial,Sheet_Index,Sheet_Size,Step_Number,Cut_Level,Orientation,X1_mm,Y1_mm,X2_mm,Y2_mm,Length_mm,Speed_m_min,Pressure_Bar,Label',
  ];

  result.sheets.forEach((sheet) => {
    sheet.cutLines.forEach((c) => {
      const speed = c.level === 1 ? 24 : 20;
      const pressure = c.level === 1 ? 2.8 : 2.5;
      rows.push(
        `${jobSerial},${sheet.sheetIndex},"${sheet.width}x${sheet.height}",${c.stepNumber},${c.level},${c.orientation},${Math.round(c.x1)},${Math.round(c.y1)},${Math.round(c.x2)},${Math.round(c.y2)},${Math.round(c.length)},${speed},${pressure},"${c.label}"`
      );
    });
  });

  return rows.join('\n');
}

export const generateCNCCutListCSV = generateMachineCSV;
