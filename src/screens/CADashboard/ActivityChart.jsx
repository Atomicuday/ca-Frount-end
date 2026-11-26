import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { caDashboardService } from '../../services/api/caDashboardService.js';

export default function ActivityChart() {
  const [period, setPeriod] = useState('1m'); // 'today' | '7d' | '2w' | '3w' | '1m' | '1y' (Default: 1m)
  const [activityPayload, setActivityPayload] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch activity points based on selected period
  const loadActivityData = useCallback(async (selectedPeriod, showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const payload = await caDashboardService.getActivityByPeriod(selectedPeriod);
      setActivityPayload(payload);
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    loadActivityData(period, false);
  }, [period, loadActivityData]);

  // SVG Geometry calculations: generous margins so all points, markers, and badges stay safely inside container
  const viewBoxWidth = 640;
  const viewBoxHeight = 225;
  const startX = 46;
  const endX = 588; // 52px of right margin so final badge and labels never crowd the border
  const topY = 46; // 46px of top margin so value badges have ample clearance at peaks
  const baselineY = 184;
  const widthSpan = endX - startX; // 542px
  const heightSpan = baselineY - topY; // 138px

  const points = activityPayload?.data || [];
  const validCounts = points
    .filter((pt) => typeof pt.count === 'number')
    .map((pt) => pt.count);

  const rawMax = Math.max(period === 'today' ? 3 : period === '7d' ? 4 : 8, ...validCounts);
  const yStep = rawMax <= 4 ? 1 : rawMax <= 10 ? 2 : rawMax <= 30 ? 5 : 10;
  const yMax = Math.ceil(rawMax / yStep) * yStep || 4;

  const ticks = yMax <= 4
    ? Array.from({ length: yMax + 1 }, (_, i) => yMax - i)
    : [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0].filter(
        (v, i, a) => a.indexOf(v) === i
      );

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

  // Helper to resolve actual date text instead of "Today" on x-axis ticks
  const getDisplayLabel = (pt) => {
    if (pt.label && pt.label !== 'Today') return pt.label;
    if (pt.dateStr) {
      const d = new Date(pt.dateStr);
      if (!isNaN(d.getTime())) {
        const pad2 = (n) => String(n).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${pad2(d.getDate())} ${months[d.getMonth()]}`;
      }
    }
    return pt.label;
  };

  // Visible X-axis tick indices: responsively thinned to prevent label collisions, always showing the final tick
  const visibleTickIndices = useMemo(() => {
    if (totalPoints <= 1) return new Set([0]);

    if (period === '7d' || period === '1y') {
      return new Set(Array.from({ length: totalPoints }, (_, i) => i));
    }

    if (period === 'today') {
      const step = totalPoints <= 8 ? 1 : totalPoints <= 14 ? 2 : 3;
      const set = new Set();
      for (let i = totalPoints - 1; i >= 0; i -= step) {
        set.add(i);
      }
      if (!set.has(0)) {
        const earliest = Math.min(...set);
        if (earliest <= 1) {
          set.delete(earliest);
          set.add(0);
        } else {
          set.add(0);
        }
      }
      return set;
    }

    // Daily periods (2w, 3w, 1m, day): target 5 to 6 evenly spaced ticks to guarantee >80px spacing
    const targetTicks = totalPoints <= 12 ? 5 : 6;
    const step = Math.max(2, Math.round((totalPoints - 1) / (targetTicks - 1)));

    const set = new Set();
    // Step backwards from the final point (current date) so final tick is guaranteed
    for (let i = totalPoints - 1; i >= 0; i -= step) {
      set.add(i);
    }

    const earliest = Math.min(...set);
    if (earliest !== 0) {
      if (earliest <= Math.floor(step * 0.7)) {
        set.delete(earliest);
        set.add(0);
      } else {
        set.add(0);
      }
    }

    return set;
  }, [totalPoints, period]);

  return (
    <div className="zd-analytics-card zd-glass-card" id="card-activity-trend" style={{ minHeight: 290 }}>
      {/* Graph Header with Date-Range Dropdown */}
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
          {/* Period Dropdown (Today, 7 Days, 2 Weeks, 3 Weeks, 1 Month, 1 Year) */}
          <div className="zd-year-dropdown-wrap">
            <label htmlFor="select-activity-period" className="zd-year-label">
              <span>Period:</span>
            </label>
            <select
              id="select-activity-period"
              className="zd-select-year"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Select time period for document activity graph"
            >
              <option value="today">Today</option>
              <option value="7d">7 Days</option>
              <option value="2w">2 Weeks</option>
              <option value="3w">3 Weeks</option>
              <option value="1m">1 Month</option>
              <option value="1y">1 Year</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            className={`zd-trend-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={() => loadActivityData(period, true)}
            title={`Refresh activity data for ${period}`}
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
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#d97706" floodOpacity="0.28" />
              </filter>
            </defs>

            {/* Y-Axis Horizontal Gridlines & Integer Tick Labels */}
            {ticks.map((tick, i) => {
              const yPos = topY + (i / Math.max(1, ticks.length - 1)) * (baselineY - topY);
              return (
                <g key={`${tick}-${i}`} className="zd-trend-grid-row">
                  <text
                    x={startX - 12}
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
                    x2={endX + 8}
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
                const shouldShowXLabel = visibleTickIndices.has(idx);
                const displayLabel = getDisplayLabel(pt);

                return (
                  <g
                    key={`${pt.label}-${idx}`}
                    className={`zd-trend-point-group ${isPartial ? 'latest-point' : ''} ${isHovered ? 'hovered' : ''}`}
                  >
                    {/* Hitbox */}
                    <circle
                      cx={pt.x}
                      cy={pt.y !== null ? pt.y : baselineY}
                      r={totalPoints > 20 ? '10' : '16'}
                      fill="transparent"
                      tabIndex="0"
                      role="img"
                      aria-label={`${displayLabel}: ${pt.count} completed documents${isPartial ? ' (Partial in progress)' : ''}`}
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
                          : (totalPoints > 20 ? (isHovered ? '4.5' : '3.5') : (isHovered ? '5' : '4'))}
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
                        fontSize={isPartial ? '11.5' : totalPoints > 20 ? '10.5' : '11'}
                        fontWeight={isPartial ? '700' : '600'}
                        fill={isPartial ? '#1d4ed8' : '#475569'}
                        fontFamily="inherit"
                      >
                        {displayLabel}
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

                // When points are dense, only render badges for partial or hovered points
                if (totalPoints > 12 && !isPartial && !isHovered) {
                  return null;
                }

                if (isPartial) {
                  const badgeW = 38;
                  const badgeH = 20;
                  // Ensure badge remains comfortably inside the top boundary
                  const badgeY = Math.max(8, pt.y - 34);
                  // Ensure pointer arrow tip points to top of the circle marker with clear spacing
                  const arrowTipY = pt.y - 9;
                  const arrowBaseY = Math.min(arrowTipY - 2, badgeY + badgeH);

                  return (
                    <g key={idx} className="zd-trend-latest-group" filter="url(#activityBadgeShadow)">
                      <rect
                        x={pt.x - badgeW / 2}
                        y={badgeY}
                        width={badgeW}
                        height={badgeH}
                        rx="6"
                        fill="#f59e0b"
                      />
                      <polygon
                        points={`${pt.x - 4.5},${arrowBaseY} ${pt.x + 4.5},${arrowBaseY} ${pt.x},${arrowTipY}`}
                        fill="#f59e0b"
                      />
                      <text
                        x={pt.x}
                        y={badgeY + badgeH / 2 + 0.5}
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
                      y={Math.max(6, pt.y - 30)}
                      width={28}
                      height={18}
                      rx="5"
                      fill="#f8fafc"
                      stroke="rgba(226, 232, 240, 0.9)"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={Math.max(6, pt.y - 30) + 9}
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
              const isTodayPoint =
                activePoint.isToday ||
                (activePoint.isPartial &&
                  period !== 'today' &&
                  period !== '1y' &&
                  period !== 'year');

              const baseDate = activePoint.fullDateLabel || activePoint.dateStr || activePoint.label;
              const dateText = isTodayPoint ? `${baseDate} (Today)` : baseDate;

              const statusText = activePoint.isPartial
                ? period === 'today'
                  ? ' · In Progress'
                  : ' · In Progress (Partial)'
                : '';

              const tooltipText = `${dateText} — ${activePoint.count} Completed${statusText}`;
              const tooltipWidth = Math.min(320, Math.max(160, tooltipText.length * 6.8 + 24));
              const tooltipHeight = 32;

              // Clamp X so tooltip never clips left or right
              const tooltipX = Math.max(
                startX - 10,
                Math.min(activePoint.x - tooltipWidth / 2, viewBoxWidth - tooltipWidth - 14)
              );

              const pointY = activePoint.y !== null ? activePoint.y : baselineY;
              // If point is high near top, show tooltip below; otherwise show above badge
              const tooltipY = pointY < topY + 44 ? pointY + 18 : Math.max(6, pointY - tooltipHeight - 38);

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
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginLeft: 14, display: 'inline-block' }} />
          <span style={{ color: '#475569', fontSize: 11.5, fontWeight: 500 }}>* In Progress (Partial Period)</span>
        </div>
        <span style={{ color: '#64748b' }}>
          {activityPayload?.summaryLabel || 'Practice Activity'} • Real statutory completion receipts
        </span>
      </div>
    </div>
  );
}
