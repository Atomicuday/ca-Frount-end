import React from 'react';

export const ZapDocsLogo = ({
  size = 'md',
  badge = 'CA',
  subtitle,
  showTagline = true,
  onClick,
  className = '',
  style = {}
}) => {
  const config = {
    sm: { iconSize: 22, fontSize: 15, taglineSize: 9, badgeSize: 9.5, gap: 8 },
    md: { iconSize: 28, fontSize: 18, taglineSize: 10, badgeSize: 10.5, gap: 10 },
    lg: { iconSize: 34, fontSize: 24, taglineSize: 11, badgeSize: 11.5, gap: 12 }
  }[size] || { iconSize: 28, fontSize: 18, taglineSize: 10, badgeSize: 10.5, gap: 10 };

  const displayTagline = subtitle || (showTagline ? 'Smart Loop | Tax & FinTech' : undefined);

  return (
    <div
      className={`zd-logo-wrap ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: config.gap,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
    >
      <img
        src="/zapdocs-emblem.png"
        alt="ZapDocs"
        style={{
          height: config.iconSize,
          width: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: config.fontSize,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--color-text-primary)'
            }}
          >
            ZapDocs
          </span>
          {badge && (
            <span
              style={{
                fontSize: config.badgeSize,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0071e3 0%, #0056b3 100%)',
                color: '#ffffff',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {displayTagline && (
          <span
            className="zd-logo-tagline"
            style={{
              fontSize: config.taglineSize,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.01em',
              marginTop: 2
            }}
          >
            {displayTagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default ZapDocsLogo;
