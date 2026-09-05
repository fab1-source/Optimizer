import React from 'react';
import { PackedSheet, PlacedPiece, CutLine } from '../types';

interface SingleSheetSvgProps {
  sheet: PackedSheet;
  showCutLines?: boolean;
  showDimensions?: boolean;
  showOffcutLabels?: boolean;
  visibleCutLines?: CutLine[];
  hoveredPieceId?: string | null;
  inspectPiece?: PlacedPiece | null;
  onHoverPiece?: (id: string | null) => void;
  onSelectPiece?: (piece: PlacedPiece) => void;
  maxHeight?: string;
  interactive?: boolean;
}

export const SingleSheetSvg: React.FC<SingleSheetSvgProps> = ({
  sheet,
  showCutLines = true,
  showDimensions = true,
  showOffcutLabels = true,
  visibleCutLines,
  hoveredPieceId,
  inspectPiece,
  onHoverPiece,
  onSelectPiece,
  maxHeight = '680px',
  interactive = true,
}) => {
  const svgWidth = sheet.width;
  const svgHeight = sheet.height;
  const cutLinesToRender = visibleCutLines ?? sheet.cutLines;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div className="relative border-2 border-[#2d3748] rounded shadow-xl overflow-hidden bg-[#090b0e] w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto block select-none"
        style={{ maxHeight }}
      >
        <defs>
          {/* Diagonal Hatched Pattern for Scrap Waste */}
          <pattern
            id={`scrapHatchPattern-${uniqueId}`}
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="30" stroke="#334155" strokeWidth="3" />
            <rect x="0" y="0" width="30" height="30" fill="transparent" />
          </pattern>

          {/* Subtle Grid Pattern */}
          <pattern
            id={`stockGrid-${uniqueId}`}
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#171e2c" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background Stock Sheet Canvas */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#0b0f17" />
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill={`url(#stockGrid-${uniqueId})`} />

        {/* Trim Margin Boundary */}
        {sheet.trimMargin > 0 && (
          <rect
            x={sheet.trimMargin}
            y={sheet.trimMargin}
            width={sheet.usableWidth}
            height={sheet.usableHeight}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.4"
          />
        )}

        {/* Waste Areas */}
        {sheet.wasteAreas.map((waste, wIdx) => {
          if (waste.isReusable) {
            return (
              <g key={waste.id || `waste-reusable-${wIdx}`} className="group">
                <rect
                  x={waste.x}
                  y={waste.y}
                  width={waste.width}
                  height={waste.height}
                  fill="#064e3b"
                  fillOpacity="0.4"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {showOffcutLabels && waste.width >= 350 && waste.height >= 180 && (
                  <g>
                    <text
                      x={waste.x + waste.width / 2}
                      y={waste.y + waste.height / 2 - 12}
                      fill="#6ee7b7"
                      fontSize={Math.max(24, Math.min(48, waste.width / 14))}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      REUSABLE OFFCUT
                    </text>
                    <text
                      x={waste.x + waste.width / 2}
                      y={waste.y + waste.height / 2 + 18}
                      fill="#a7f3d0"
                      fontSize={Math.max(20, Math.min(36, waste.width / 18))}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="monospace"
                    >
                      {Math.round(waste.width)} × {Math.round(waste.height)} mm
                    </text>
                  </g>
                )}
              </g>
            );
          } else {
            return (
              <rect
                key={waste.id || `waste-scrap-${wIdx}`}
                x={waste.x}
                y={waste.y}
                width={waste.width}
                height={waste.height}
                fill={`url(#scrapHatchPattern-${uniqueId})`}
                stroke="#334155"
                strokeWidth="1.5"
                opacity="0.9"
              />
            );
          }
        })}

        {/* Placed Glass Panes */}
        {sheet.placedPieces.map((piece, idx) => {
          const isHovered = hoveredPieceId === piece.pieceId;
          const isInspected = inspectPiece?.pieceId === piece.pieceId;

          const labelFontSize = Math.max(16, Math.min(44, piece.width / 11, piece.height / 7));
          const dimFontSize = Math.max(14, Math.min(36, piece.width / 13, piece.height / 8));
          const canFitText = piece.width >= 120 && piece.height >= 80;

          return (
            <g
              key={piece.id || `placed-pane-${idx}`}
              onMouseEnter={() => interactive && onHoverPiece && onHoverPiece(piece.pieceId)}
              onMouseLeave={() => interactive && onHoverPiece && onHoverPiece(null)}
              onClick={() => interactive && onSelectPiece && onSelectPiece(piece)}
              className={interactive ? 'cursor-pointer transition-all duration-100' : ''}
            >
              {/* Glass Pane Rectangle */}
              <rect
                x={piece.x}
                y={piece.y}
                width={piece.width}
                height={piece.height}
                fill={piece.color || '#1e3a8a'}
                fillOpacity={isHovered || isInspected ? '0.95' : '0.78'}
                stroke={isHovered || isInspected ? '#ffffff' : '#93c5fd'}
                strokeWidth={isHovered || isInspected ? '4' : '2'}
              />

              {/* Inner highlight border */}
              <rect
                x={piece.x + 3}
                y={piece.y + 3}
                width={Math.max(0, piece.width - 6)}
                height={Math.max(0, piece.height - 6)}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity={isHovered ? '0.5' : '0.2'}
              />

              {/* Text labels inside glass pane */}
              {canFitText && (
                <g className="pointer-events-none select-none">
                  {/* Glass Pane Identifier / Tag */}
                  <text
                    x={piece.x + piece.width / 2}
                    y={showDimensions ? piece.y + piece.height / 2 - labelFontSize * 0.6 : piece.y + piece.height / 2}
                    fill="#ffffff"
                    fontSize={labelFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {piece.label.length > 20 && piece.width < 500
                      ? piece.label.substring(0, 18) + '…'
                      : piece.label}
                  </text>

                  {/* High-Contrast Dimension Callout */}
                  {showDimensions && (
                    <text
                      x={piece.x + piece.width / 2}
                      y={piece.y + piece.height / 2 + dimFontSize * 0.75}
                      fill="#facc15"
                      fontSize={dimFontSize}
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="monospace"
                    >
                      {Math.round(piece.width)} × {Math.round(piece.height)} mm
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Guillotine Cut Lines */}
        {showCutLines &&
          cutLinesToRender.map((cut, cIdx) => {
            const strokeColor =
              cut.level === 1
                ? '#ef4444' // Primary rip cut: Red
                : cut.level === 2
                ? '#f97316' // Secondary cross cut: Orange
                : '#38bdf8'; // Tertiary cut: Sky Blue

            const midX = (cut.x1 + cut.x2) / 2;
            const midY = (cut.y1 + cut.y2) / 2;

            return (
              <g key={cut.id || `cut-${cut.stepNumber}-${cIdx}`} className="pointer-events-none">
                <line
                  x1={cut.x1}
                  y1={cut.y1}
                  x2={cut.x2}
                  y2={cut.y2}
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeDasharray="10 5"
                />

                {cut.length > 220 && (
                  <g>
                    <circle
                      cx={midX}
                      cy={midY}
                      r="16"
                      fill={strokeColor}
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    <text
                      x={midX}
                      y={midY}
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {cut.stepNumber}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
      </svg>

      {/* Dimension Overlays along outer edges */}
      <div className="absolute bottom-2 right-3 bg-[#0f1115]/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 pointer-events-none">
        Stock: {sheet.width} × {sheet.height} mm
      </div>
    </div>
  );
};
