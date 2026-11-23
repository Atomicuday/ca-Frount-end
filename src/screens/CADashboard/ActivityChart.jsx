import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { caDashboardService } from '../../services/api/caDashboardService.js';

export default function ActivityChart() {
  const [granularity, setGranularity] = useState('month'); // 'day' | 'month' | 'year' (Default: month)
  const [activityPayload, setActivityPayload] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch activity points based on selected granularity
  const loadActivityData = useCallback(async (selectedGranularity, showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const payload = await caDashboardService.getActivityByGranularity(selectedGranularity);
      setActivityPayload(payload);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    loadActivityData(granularity, false);
  }, [granularity, loadActivityData]);

  // SVG Geometry calculations
  const viewBoxWidth = 640;
  const viewBoxHeight = 220;
  const startX = 52;
  const endX = 604;
  const topY = 36;
  const baselineY = 188;
  const widthSpan = endX - startX; // 552px
  const heightSpan = baselineY - topY; // 152px

  const points = activityPayload?.data || [];
  const validCounts = points
    .filter((pt) => typeof pt.count === 'number')
    .map((pt) => pt.count);

  const rawMax = Math.max(granularity === 'day' ? 4 : 10, ...validCounts);
  const yStep = granularity === 'day' ? (rawMax <= 6 ? 1 : 2) : granularity === 'month' ? 10 : 50;
  const yMax = Math.ceil(rawMax / yStep) * yStep || (granularity === 'day' ? 4 : 40);

  const ticks = granularity === 'day' && yMax <= 6
    ? Array.from({ length: yMax + 1 }, (_, i) => yMax - i)
    : [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

  const totalPoints = points.length;
  const mappedPoints = points.map((item, index) => {
    const x = totalPoints > 1
      ? startX + index * (widthSpan / (totalPoints - 1))
      : startX + widthSpan / 2;
    const isVal = typeof item.count === 'number';
    const y = isVal ? baselineY - (item.count / yMax) * heightSpan : null;

    return {
      ...item,
      x: Number(x.toFixed(1)),
      y: y !== null ? Number(y.toFixed(1)) : null
    };
  });

  const activeCurvePoints = mappedPoints.filter((pt) => pt.y !== null);

  const generateCurvedPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    return pts.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, '');
  };

  const linePathD = generateCurvedPath(activeCurvePoints);
  const areaPathD = activeCurvePoints.length > 0
    ? `${linePathD} L ${activeCurvePoints[activeCurvePoints.length - 1].x} ${baselineY} L ${activeCurvePoints[0].x} ${baselineY} Z`
    : '';

  const activePoint = hoveredIndex !== null ? mappedPoints[hoveredIndex] : null;
  const totalCompleted = validCounts.reduce((a, b) => a + b, 0);

  return (
    <div className="zd-analytics-card zd-glass-card" id="card-activity-trend" style={{ minHeight: 290 }}>
      {/* Graph Header with ONE View by Dropdown */}
      <div className="zd-trend-header">
        <div className="zd-trend-title-block">
          <div className="zd-trend-icon-badge" aria-hidden="true">
            <TrendingUp size={20} color="#2563eb" strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="zd-trend-title">
              {activityPayload?.title || 'Document Activity'}
            </h3>
            <p className="zd-trend-subtitle">
              {activityPayload?.subtitle || `Completed documents (${totalCompleted} total completed).`}
            </p>
          </div>
        </div>

        <div className="zd-trend-controls">
          {/* ONE Dropdown: View by (Day, Month, Year) */}
          <div className="zd-year-dropdown-wrap">
            <label htmlFor="select-activity-granularity" className="zd-year-label">
              <span>View by:</span>
            </label>
            <select
              id="select-activity-granularity"
              className="zd-select-year"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              aria-label="Select time granularity for document activity graph"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            className={`zd-trend-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={() => loadActivityData(granularity, true)}
            title={`Refresh activity data for ${granularity}`}
            aria-label="Refresh activity data"
          >
            <RefreshCw size={14} color="#64748b" />
          </button>
        </div>
      </div>

      <div className={`zd-trend-chart-wrap ${isRefreshing ? 'loading' : ''}`}>
        {isRefreshing && (
          <div className="zd-trend-shimmer-overlay">
            <div className="zd-trend-shimmer" />
          </div>
        )}

        {/* SVG Viewport */}
        <div className="zd-trend-svg-container">
          <svg
            className="zd-trend-svg"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            aria-label={`${activityPayload?.title || 'Document Activity'}: Total ${totalCompleted} completed.`}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="caActivityGranularityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="70%" stopColor="#2563eb" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
              </linearGradient>

              <filter id="activityBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#2563eb" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Y-Axis Horizontal Gridlines & Integer Tick Labels */}
            {ticks.map((tick, i) => {
              const yPos = topY + (i / Math.max(1, ticks.length - 1)) * (baselineY - topY);
              return (
                <g key={`${tick}-${i}`} className="zd-trend-grid-row">
                  <text
                    x={startX - 14}
                    y={yPos + 3.5}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                    fontWeight="600"
                    fontFamily="inherit"
                  >
                    {tick}
                  </text>
                  <line
                    x1={startX - 6}
                    y1={yPos}
                    x2={endX + 10}
                    y2={yPos}
                    stroke="rgba(226, 232, 240, 0.75)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Area Fill Underneath Curve */}
            {areaPathD && (
              <path
                d={areaPathD}
                fill="url(#caActivityGranularityGradient)"
                className="zd-trend-area-fill"
              />
            )}

            {/* Smooth Blue Curved Line */}
            {linePathD && (
              <path
                d={linePathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="zd-trend-line-stroke"
              />
            )}

            {/* Markers Layer */}
            <g className="zd-trend-marker-layer">
              {mappedPoints.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                const isPartial = pt.isPartial;

                // For 'day' view with 30 points, show X label at intervals to prevent overlap
                const shouldShowXLabel = granularity === 'day'
                  ? (idx === 0 || idx === totalPoints - 1 || idx % 5 === 0)
                  : true;

                return (
                  <g
                    key={`${pt.label}-${idx}`}
                    className={`zd-trend-point-group ${isPartial ? 'latest-point' : ''} ${isHovered ? 'hovered' : ''}`}
                  >
                    {/* Invisible Hitbox */}
                    <circle
                      cx={pt.x}
                      cy={pt.y !== null ? pt.y : baselineY}
                      r={granularity === 'day' ? '10' : '18'}
                      fill="transparent"
                      tabIndex="0"
                      role="img"
                      aria-label={`${pt.label}: ${pt.count} completed documents${isPartial ? ' (Partial in progress)' : ''}`}
                      onFocus={() => setHoveredIndex(idx)}
                      onBlur={() => setHoveredIndex(null)}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      style={{ cursor: 'pointer' }}
                    />

                    {/* Point Circle */}
                    {pt.y !== null && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isPartial
                          ? (isHovered ? '6.5' : '5.5')
                          : (granularity === 'day' ? (isHovered ? '4.5' : '3.5') : (isHovered ? '5' : '4'))}
                        fill={isPartial ? '#f59e0b' : '#ffffff'}
                        stroke={isPartial ? '#ffffff' : '#2563eb'}
                        strokeWidth="2.5"
                        className={isPartial ? 'zd-trend-partial-dot' : 'zd-trend-dot'}
                      />
                    )}

                    {/* X-Axis Period Label */}
                    {shouldShowXLabel && (
                      <text
                        x={pt.x}
                        y={baselineY + 18}
                        textAnchor="middle"
                        fontSize={isPartial ? '12.5' : granularity === 'day' ? '10.5' : '11.5'}
                        fontWeight={isPartial ? '800' : '600'}
                        fill={isPartial ? '#2563eb' : '#475569'}
                        fontFamily="inherit"
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Value Badges Layer */}
            <g className="zd-trend-value-label-layer" pointerEvents="none">
              {mappedPoints.map((pt, idx) => {
                if (pt.y === null) return null;

                const isPartial = pt.isPartial;
                const isHovered = hoveredIndex === idx;

                // In 'day' mode, only render badges for partial or hovered points to avoid clutter
                if (granularity === 'day' && !isPartial && !isHovered) {
                  return null;
                }

                if (isPartial) {
                  return (
                    <g key={idx} className="zd-trend-latest-group" filter="url(#activityBadgeShadow)">
                      <rect x={pt.x - 20} y={pt.y - 36} width="40" height="20" rx="6" fill="#f59e0b" />
                      <polygon
                        points={`${pt.x - 4.5},${pt.y - 16} ${pt.x + 4.5},${pt.y - 16} ${pt.x},${pt.y - 12}`}
                        fill="#f59e0b"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 26}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11.5"
                        fontWeight="800"
                        fill="#ffffff"
                        fontFamily="inherit"
                      >
                        {pt.count}*
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={idx} className="zd-trend-val-badge">
                    <rect
                      x={pt.x - 14}
                      y={pt.y - 30}
                      width="28"
                      height="18"
                      rx="5"
                      fill="#f8fafc"
                      stroke="rgba(226, 232, 240, 0.9)"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 20.5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10.5"
                      fontWeight="700"
                      fill="#0f172a"
                      fontFamily="inherit"
                    >
                      {pt.count}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Interactive SVG Tooltip */}
            {activePoint && (() => {
              const tooltipText = `${activePoint.label} · ${activePoint.count} Completed${
                activePoint.isPartial ? ' (Partial in progress)' : ''
              }`;
              const tooltipWidth = Math.min(260, tooltipText.length * 7.5 + 20);
              const tooltipHeight = 32;
              const tooltipX = Math.max(
                startX - 10,
                Math.min(activePoint.x - tooltipWidth / 2, endX + 10 - tooltipWidth)
              );
              const pointY = activePoint.y !== null ? activePoint.y : baselineY;
              const tooltipY = pointY < 70 ? pointY + 16 : pointY - tooltipHeight - 12;

              return (
                <g className="zd-trend-svg-tooltip" pointerEvents="none" role="tooltip">
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    rx="6"
                  />
                  <text x={tooltipX + tooltipWidth / 2} y={tooltipY + 20} textAnchor="middle">
                    {tooltipText}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Footer Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid #eef2f6',
          fontSize: 12,
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
          <span style={{ color: '#475569', fontSize: 11.5, fontWeight: 500 }}>Completed Period</span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginLeft: 12, display: 'inline-block' }} />
          <span style={{ color: '#475569', fontSize: 11.5, fontWeight: 500 }}>* In Progress (Partial)</span>
        </div>
        <span style={{ color: '#64748b' }}>
          {activityPayload?.summaryLabel || 'Practice Activity'} • Real statutory completion receipts
        </span>
      </div>
    </div>
  );
}
