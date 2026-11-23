import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

export default function PipelineChart({ stages = [] }) {
  const navigate = useNavigate();
  const [hoveredStageId, setHoveredStageId] = useState(null);

  const totalPending = stages.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);

  // SVG Chart Geometry
  const viewBoxWidth = 520;
  const viewBoxHeight = 250;
  const topY = 16;
  const baselineY = 206;
  const yAxisX = 136; // Y-axis text labels right aligned here
  const barStartX = 144;
  const barEndX = 450;
  const barAreaWidth = barEndX - barStartX; // 306px

  // Compute integer X-axis scale starting at zero
  const maxCount = Math.max(14, ...stages.map((s) => s.count || 0));
  const xMax = Math.ceil(maxCount / 3) * 3 || 15;
  const ticks = [0, Math.round(xMax * 0.2), Math.round(xMax * 0.4), Math.round(xMax * 0.6), Math.round(xMax * 0.8), xMax]
    .filter((v, i, a) => a.indexOf(v) === i); // unique integer ticks: [0, 3, 6, 9, 12, 15]

  const rowHeight = (baselineY - topY) / Math.max(1, stages.length);

  const handleStageClick = (stageId) => {
    navigate(`/ca/documents?stage=${encodeURIComponent(stageId)}`);
  };

  const handleKeyDown = (event, stageId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleStageClick(stageId);
    }
  };

  const hoveredStage = stages.find((s) => s.id === hoveredStageId);

  return (
    <div className="zd-analytics-card zd-glass-card" id="card-current-documents">
      <div className="zd-analytics-header">
        <div>
          <div className="zd-analytics-title">
            <Layers size={18} color="#2563eb" aria-hidden="true" />
            <span>Current Documents</span>
          </div>
          <p className="zd-analytics-sub">
            Current pending-document breakdown across active lifecycle stages
          </p>
        </div>
        <div className="zd-resource-pill zd-resource-pill--blue" title="Reconciles with Pending Documents summary card">
          <span>{totalPending} Total Pending</span>
        </div>
      </div>

      {/* Proper Horizontal Bar Chart */}
      <div className="zd-horizontal-barchart-wrap">
        <svg
          className="zd-hbar-chart-svg"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label={`Current pending documents horizontal bar chart: Total ${totalPending} pending documents across ${stages.length} stages.`}
          onPointerLeave={() => setHoveredStageId(null)}
        >
          <defs>
            <filter id="hbarGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Vertical Gridlines & X-Axis Integer Ticks */}
          {ticks.map((tick) => {
            const xPos = barStartX + (tick / xMax) * barAreaWidth;
            return (
              <g key={tick} className="zd-hbar-grid-tick">
                <line
                  x1={xPos}
                  y1={topY}
                  x2={xPos}
                  y2={baselineY}
                  stroke="rgba(226, 232, 240, 0.85)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={baselineY + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="600"
                  fontFamily="inherit"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X-Axis Baseline & Label */}
          <line
            x1={barStartX}
            y1={baselineY}
            x2={barEndX + 20}
            y2={baselineY}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
          <text
            x={barStartX + barAreaWidth / 2}
            y={baselineY + 34}
            textAnchor="middle"
            fontSize="10.5"
            fill="#64748b"
            fontWeight="600"
            fontFamily="inherit"
          >
            Document Count
          </text>

          {/* Horizontal Bars & Y-Axis Labels */}
          {stages.map((stage, index) => {
            const centerY = topY + index * rowHeight + rowHeight / 2;
            const barH = 18;
            const barY = centerY - barH / 2;
            const count = typeof stage.count === 'number' ? stage.count : 0;
            const barW = Math.max(4, (count / xMax) * barAreaWidth);
            const percentage = totalPending > 0 ? ((count / totalPending) * 100).toFixed(1) : 0;
            const isHovered = hoveredStageId === stage.id;
            const barColor = stage.color || '#2563eb';

            return (
              <g
                key={stage.id}
                className={`zd-hbar-item-group ${isHovered ? 'hovered' : ''}`}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${stage.label}: ${count} documents (${percentage}% of pending). Click to filter.`}
                style={{ cursor: 'pointer', outline: 'none' }}
                onClick={() => handleStageClick(stage.id)}
                onKeyDown={(e) => handleKeyDown(e, stage.id)}
                onMouseEnter={() => setHoveredStageId(stage.id)}
                onFocus={() => setHoveredStageId(stage.id)}
                onBlur={() => setHoveredStageId(null)}
              >
                {/* Full-row invisible hover hitbox */}
                <rect
                  x={10}
                  y={topY + index * rowHeight}
                  width={viewBoxWidth - 20}
                  height={rowHeight}
                  fill={isHovered ? 'rgba(239, 246, 255, 0.45)' : 'transparent'}
                  rx="6"
                  transition="fill 0.15s ease"
                />

                {/* Y-Axis Label */}
                <text
                  x={yAxisX}
                  y={centerY + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight={isHovered ? '700' : '600'}
                  fill={isHovered ? '#1d4ed8' : '#334155'}
                  fontFamily="inherit"
                >
                  {stage.label}
                </text>

                {/* Stage Indicator Dot next to label */}
                <circle
                  cx={yAxisX - 110}
                  cy={centerY}
                  r="3.5"
                  fill={barColor}
                  opacity="0.9"
                />

                {/* Horizontal Bar */}
                <rect
                  x={barStartX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx="4"
                  ry="4"
                  fill={barColor}
                  opacity={isHovered ? 1 : 0.9}
                  filter={isHovered ? 'url(#hbarGlow)' : undefined}
                />

                {/* Document Count at End of Bar */}
                <text
                  x={barStartX + barW + 8}
                  y={centerY + 4}
                  textAnchor="start"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#0f172a"
                  fontFamily="inherit"
                >
                  {count} docs
                </text>
              </g>
            );
          })}

          {/* Interactive Tooltip showing stage, count, and % of pending */}
          {hoveredStage && (() => {
            const stageIndex = stages.findIndex((s) => s.id === hoveredStage.id);
            const centerY = topY + stageIndex * rowHeight + rowHeight / 2;
            const count = hoveredStage.count || 0;
            const pct = totalPending > 0 ? ((count / totalPending) * 100).toFixed(1) : 0;
            const tooltipText = `${hoveredStage.label}: ${count} documents (${pct}% of pending)`;
            const tooltipWidth = Math.min(270, tooltipText.length * 7.5 + 24);
            const tooltipHeight = 28;
            const tooltipX = Math.min(viewBoxWidth - tooltipWidth - 10, Math.max(140, barStartX + 40));
            const tooltipY = centerY > 150 ? centerY - tooltipHeight - 12 : centerY + 14;

            return (
              <g className="zd-hbar-svg-tooltip" pointerEvents="none" role="tooltip">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="6"
                  fill="#0f172a"
                  opacity="0.94"
                />
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#ffffff"
                  fontFamily="inherit"
                >
                  {tooltipText}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="zd-hbar-footer">
        <span className="zd-hbar-footer-note">
          * Mutually exclusive stages sum to {totalPending} documents; reconciles with Pending Documents.
        </span>
        <button
          type="button"
          className="zd-recent-view-all-btn"
          style={{ padding: '4px 10px', fontSize: 11.5 }}
          onClick={() => navigate('/ca/documents?status=pending')}
          title="Filter all pending documents in vault"
        >
          <span>Filter in Vault</span>
          <ArrowRight size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
