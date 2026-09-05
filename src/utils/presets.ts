import { GlassPiece, StockSheet } from '../types';

export const COLOR_PALETTE = [
  '#0f3460', // deep navy
  '#164e63', // cyan slate
  '#1e3a8a', // industrial blue
  '#065f46', // emerald glass
  '#312e81', // indigo
  '#1e293b', // slate
  '#115e59', // teal
  '#3730a3', // deep purple-blue
  '#0284c7', // sky blue
  '#0d9488', // light teal
];

export const DEFAULT_PIECES: GlassPiece[] = [
  {
    id: 'p1',
    label: 'Panel A (1628x1060)',
    width: 1628,
    height: 1060,
    qty: 2,
    allowRotation: true,
    notes: 'Fixed window unit',
    color: '#0f3460',
  },
  {
    id: 'p2',
    label: 'Panel B (767x1092)',
    width: 767,
    height: 1092,
    qty: 2,
    allowRotation: true,
    notes: 'Sash side pane',
    color: '#164e63',
  },
  {
    id: 'p3',
    label: 'Panel C (760x1060)',
    width: 760,
    height: 1060,
    qty: 2,
    allowRotation: true,
    notes: 'Transom pane',
    color: '#1e3a8a',
  },
  {
    id: 'p4',
    label: 'Panel D (1720x2090)',
    width: 1720,
    height: 2090,
    qty: 2,
    allowRotation: true,
    notes: 'Large patio sliding unit',
    color: '#065f46',
  },
];

export const DEFAULT_STOCK_SHEETS: StockSheet[] = [
  {
    id: 'stock-jumbo-3210-2250',
    name: 'Jumbo Float (3210 × 2250 mm)',
    width: 3210,
    height: 2250,
    qty: 10,
    cost: 145.0,
    enabled: false,
  },
  {
    id: 'stock-jumbo-3660-2440',
    name: 'Mega Jumbo (3660 × 2440 mm)',
    width: 3660,
    height: 2440,
    qty: 10,
    cost: 195.0,
    enabled: false,
  },
  {
    id: 'stock-les-3300-2140',
    name: 'LES Standard (3300 × 2140 mm)',
    width: 3300,
    height: 2140,
    qty: 10,
    cost: 155.0,
    enabled: false,
  },
  {
    id: 'stock-split-2440-1830',
    name: 'Standard Split (2440 × 1830 mm)',
    width: 2440,
    height: 1830,
    qty: 10,
    cost: 85.0,
    enabled: false,
  },
];

export const PRESET_ORDERS: {
  name: string;
  description: string;
  stock: { width: number; height: number };
  pieces: Omit<GlassPiece, 'id' | 'color'>[];
}[] = [
  {
    name: 'Attached User Example (3210 x 2250)',
    description: 'Exact pieces from user specification: 1628x1060, 767x1092, 760x1060, 1720x2090',
    stock: { width: 3210, height: 2250 },
    pieces: [
      { label: 'Panel 1628x1060', width: 1628, height: 1060, qty: 2, allowRotation: true, notes: 'Double glazed outer' },
      { label: 'Panel 767x1092', width: 767, height: 1092, qty: 2, allowRotation: true, notes: 'Casement window' },
      { label: 'Panel 760x1060', width: 760, height: 1060, qty: 2, allowRotation: true, notes: 'Fixed lite' },
      { label: 'Panel 1720x2090', width: 1720, height: 2090, qty: 2, allowRotation: true, notes: 'Storefront heavy' },
    ],
  },
  {
    name: 'Shower Screens & Balustrades',
    description: '10mm & 12mm toughened shower door, return panels, and balustrade lites',
    stock: { width: 3210, height: 2250 },
    pieces: [
      { label: 'Shower Door 2000x800', width: 800, height: 2000, qty: 2, allowRotation: false, notes: 'Hinged door (no rotation for vertical polish)' },
      { label: 'Return Panel 2000x950', width: 950, height: 2000, qty: 2, allowRotation: false, notes: 'Fixed side panel' },
      { label: 'Balustrade Lite 1100x1200', width: 1200, height: 1100, qty: 4, allowRotation: true, notes: 'Frameless glass' },
      { label: 'Overhead Transom 450x1750', width: 1750, height: 450, qty: 2, allowRotation: true, notes: 'Header panel' },
    ],
  },
  {
    name: 'Commercial Window Batch',
    description: 'Multi-story office window batch with mixed transom and awning panes',
    stock: { width: 3210, height: 2250 },
    pieces: [
      { label: 'Vision Lite 1450x1200', width: 1450, height: 1200, qty: 3, allowRotation: true },
      { label: 'Spandrel 1450x650', width: 1450, height: 650, qty: 4, allowRotation: true },
      { label: 'Side Lite 600x1200', width: 600, height: 1200, qty: 4, allowRotation: true },
      { label: 'Top Light 1450x450', width: 1450, height: 450, qty: 3, allowRotation: true },
    ],
  },
];
