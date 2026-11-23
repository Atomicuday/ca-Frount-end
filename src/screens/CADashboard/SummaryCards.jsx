import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

export default function SummaryCards({ summary = {} }) {
  const navigate = useNavigate();

  const totalClients = summary.totalClients ?? 48;
  const pendingDocuments = summary.pendingDocuments ?? 47;
  const completedDocuments = summary.completedDocuments ?? 184;

  const cards = [
    {
      id: 'total-clients',
      label: 'Total Clients',
      count: totalClients,
      definition: 'Current client count in vault',
      subNote: 'Distinct active entity profiles',
      pillText: 'Vault Total',
      icon: Users,
      theme: 'blue',
      stroke1: '#38bdf8',
      stroke2: '#1d68ed',
      route: '/ca/clients'
    },
    {
      id: 'pending-docs',
      label: 'Pending Documents',
      count: pendingDocuments,
      definition: 'Active, unfinished documents in pipeline',
      subNote: 'Drafts, info, review, payment & execution',
      pillText: 'Active Backlog',
      icon: Clock,
      theme: 'amber',
      stroke1: '#fbbf24',
      stroke2: '#d97706',
      route: '/ca/documents?status=pending'
    },
    {
      id: 'completed-docs',
      label: 'Completed Documents',
      count: completedDocuments,
      definition: 'All successfully completed documents',
      subNote: 'Legally stamped & executed vault copies',
      pillText: 'All-Time Executed',
      icon: CheckCircle2,
      theme: 'green',
      stroke1: '#34d399',
      stroke2: '#059669',
      route: '/ca/documents?status=completed'
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleKeyDown = (event, route) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(route);
    }
  };

  return (
    <section aria-label="CA Practice Summary Metrics" className="zd-summary-cards-section">
      <div className="zd-summary-cards-grid zd-summary-cards-grid--three">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              id={`summary-card-${card.id}`}
              className={`zd-resource-card zd-resource-card--${card.theme}`}
              onClick={() => handleCardClick(card.route)}
              onKeyDown={(e) => handleKeyDown(e, card.route)}
              aria-label={`${card.label}: ${card.count}. Click to view filtered documents.`}
            >
              {/* Layered smooth wave SVG artwork matching reference resource cards */}
              <svg
                className="zd-card-wave zd-card-wave--bottom-right"
                viewBox="0 0 170 85"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0,60 C45,35 95,80 170,30 L170,85 L0,85 Z"
                  fill={`url(#wave-grad-${card.id}-1)`}
                  opacity="0.45"
                />
                <path
                  d="M15,75 C60,48 110,72 170,42 L170,85 L15,85 Z"
                  fill={`url(#wave-grad-${card.id}-2)`}
                  opacity="0.35"
                />
                <path
                  d="M0,60 C45,35 95,80 170,30"
                  stroke={card.stroke1}
                  strokeWidth="1.75"
                  opacity="0.65"
                />
                <path
                  d="M20,72 C70,50 115,68 170,46"
                  stroke={card.stroke2}
                  strokeWidth="1.25"
                  opacity="0.45"
                />
                <defs>
                  <linearGradient id={`wave-grad-${card.id}-1`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={card.stroke1} stopOpacity="0.1" />
                    <stop offset="100%" stopColor={card.stroke2} stopOpacity="0.25" />
                  </linearGradient>
                  <linearGradient id={`wave-grad-${card.id}-2`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={card.stroke1} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={card.stroke2} stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="zd-resource-card__header">
                <div
                  className={`zd-resource-icon-badge zd-resource-icon-badge--${card.theme}`}
                  aria-hidden="true"
                >
                  <Icon size={20} />
                </div>
                <div className={`zd-resource-pill zd-resource-pill--${card.theme}`}>
                  <span>{card.pillText}</span>
                </div>
              </div>

              <div className="zd-resource-body">
                <span className="zd-resource-count">{card.count}</span>
                <h3 className="zd-resource-label">{card.label}</h3>
                <p className="zd-resource-def">{card.definition}</p>
                {card.subNote && <span className="zd-resource-subnote">{card.subNote}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
