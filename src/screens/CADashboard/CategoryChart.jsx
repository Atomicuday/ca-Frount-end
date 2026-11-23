import React, { useState, useMemo } from 'react';
import { PieChart, FolderOpen } from 'lucide-react';

// Fallback palette
const PALETTE = [
  '#1d68ed',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#64748b'
];

export default function CategoryChart({ categories = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Process data & group small categories (< 5%) into "Other" if needed
  const { processedCategories, totalCount } = useMemo(() => {
    const rawTotal = (categories || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
    if (!rawTotal) {
      return { processedCategories: [], totalCount: 0 };
    }

    const main = [];
    let otherCount = 0;

    categories.forEach((cat, idx) => {
      const pct = (cat.count / rawTotal) * 100;
      // If smaller than 4% and we already have 5+ categories, group into Other
      if (pct < 4 && categories.length > 5) {
        otherCount += cat.count;
      } else {
        main.push({
          ...cat,
          color: cat.color || PALETTE[idx % PALETTE.length]
        });
      }
    });

    if (otherCount > 0) {
      main.push({
        category: 'Other Templates',
        count: otherCount,
        code: 'OTHER',
        color: '#94a3b8'
      });
    }

    return { processedCategories: main, totalCount: rawTotal };
  }, [categories]);

  // Donut geometry
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius; // ~402.12

  // Empty state check
  if (!totalCount || processedCategories.length === 0) {
    return (
      <div className="zd-analytics-card zd-glass-card" id="card-documents-created">
        <div className="zd-analytics-header">
          <div>
            <div className="zd-analytics-title">
              <PieChart size={18} color="#10b981" aria-hidden="true" />
              <span>Documents Created</span>
            </div>
            <p className="zd-analytics-sub">Distribution of documents created by approved template category</p>
          </div>
          <div className="zd-resource-pill zd-resource-pill--green">
            <span>Template Scope</span>
          </div>
        </div>

        <div className="zd-recent-empty-state" style={{ padding: '36px 16px' }}>
          <FolderOpen size={36} color="#94a3b8" />
          <h4 className="zd-recent-empty-title">No Documents Created</h4>
          <p className="zd-recent-empty-desc">
            No document creation records found in vault for this reporting scope.
          </p>
        </div>
      </div>
    );
  }

  // Calculate cumulative offsets for each donut segment immutably
  const segments = processedCategories.reduce((acc, cat, idx) => {
    const value = cat.count || 0;
    const percentage = totalCount > 0 ? (value / totalCount) * 100 : 0;
    const dashLength = (value / totalCount) * circumference;
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    const nextOffset = prevOffset + value;
    const dashOffset = -(prevOffset / totalCount) * circumference;

    acc.push({
      ...cat,
      index: idx,
      percentage: Number(percentage.toFixed(1)),
      dashLength,
      dashOffset,
      nextOffset
    });
    return acc;
  }, []);

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="zd-analytics-card zd-glass-card" id="card-documents-created">
      <div className="zd-analytics-header">
        <div>
          <div className="zd-analytics-title">
            <PieChart size={18} color="#10b981" aria-hidden="true" />
            <span>Documents Created</span>
          </div>
          <p className="zd-analytics-sub">Distribution of documents created by approved template category</p>
        </div>
        <div className="zd-resource-pill zd-resource-pill--green">
          <span>{totalCount} Total Generated</span>
        </div>
      </div>

      <div className="zd-donut-chart-container">
        {/* Donut SVG Graphic */}
        <div className="zd-donut-svg-wrap">
          <svg
            className="zd-donut-chart-svg"
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Documents Created Donut Chart: Total ${totalCount} documents across ${processedCategories.length} categories.`}
          >
            {/* Background track circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Category segments */}
            {segments.map((seg) => {
              const isHovered = hoveredIndex === seg.index;
              return (
                <circle
                  key={seg.category}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${circumference}`}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 100 100)"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: hoveredIndex === null || isHovered ? 1 : 0.65
                  }}
                  onMouseEnter={() => setHoveredIndex(seg.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}

            {/* Center Dynamic Label */}
            <text
              x="100"
              y={activeSegment ? '92' : '95'}
              textAnchor="middle"
              fontSize="24"
              fontWeight="800"
              fill="#0f172a"
              style={{ letterSpacing: '-0.02em' }}
            >
              {activeSegment ? activeSegment.count : totalCount}
            </text>
            <text
              x="100"
              y={activeSegment ? '112' : '115'}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#64748b"
            >
              {activeSegment ? `${activeSegment.percentage}%` : 'Total Created'}
            </text>
          </svg>
        </div>

        {/* Readable Legend with Counts & Percentages */}
        <div className="zd-donut-legend" role="list" aria-label="Template categories legend">
          {segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            return (
              <div
                key={seg.category}
                role="listitem"
                tabIndex={0}
                className={`zd-donut-legend-item ${isHovered ? 'active' : ''}`}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(seg.index)}
                onBlur={() => setHoveredIndex(null)}
                aria-label={`${seg.category}: ${seg.count} documents (${seg.percentage}%)`}
              >
                <div className="zd-legend-item-left">
                  <span
                    className="zd-legend-dot"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden="true"
                  />
                  <span className="zd-legend-label">{seg.category}</span>
                </div>
                <div className="zd-legend-item-right">
                  <span className="zd-legend-count">{seg.count}</span>
                  <span className="zd-legend-pct">({seg.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="zd-category-footer">
        <span className="zd-footer-note">
          * Dynamic taxonomy categorized under ICAI & statutory legal catalog standards.
        </span>
      </div>
    </div>
  );
}
