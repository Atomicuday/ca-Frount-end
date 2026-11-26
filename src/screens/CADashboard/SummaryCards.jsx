import React, { useState } from 'react';
import { Users, Clock, CheckCircle2, Landmark } from 'lucide-react';
import SummaryDetailsModal from './modals/SummaryDetailsModal.jsx';
import StateStampDutyModal from './modals/StateStampDutyModal.jsx';

export default function SummaryCards({ summary = {} }) {
  const [activeModalCard, setActiveModalCard] = useState(null);

  const totalClients = summary.totalClients ?? 48;
  const pendingDocuments = summary.pendingDocuments ?? 47;
  const completedDocuments = summary.completedDocuments ?? 184;

  const cards = [
    {
      id: 'total-clients',
      label: 'Total Clients',
      count: totalClients,
      isTextCount: false,
      definition: 'Current client count in vault',
      subNote: 'Distinct active entity profiles',
      pillText: 'Vault Total',
      icon: Users,
      theme: 'blue',
      stroke1: '#38bdf8',
      stroke2: '#1d68ed'
    },
    {
      id: 'pending-docs',
      label: 'Pending Documents',
      count: pendingDocuments,
      isTextCount: false,
      definition: 'Active, unfinished documents in pipeline',
      subNote: 'Drafts, info, review, payment & execution',
      pillText: 'Active Backlog',
      icon: Clock,
      theme: 'amber',
      stroke1: '#fbbf24',
      stroke2: '#d97706'
    },
    {
      id: 'completed-docs',
      label: 'Completed Documents',
      count: completedDocuments,
      isTextCount: false,
      definition: 'All successfully completed documents',
      subNote: 'Legally stamped & executed vault copies',
      pillText: 'All-Time Executed',
      icon: CheckCircle2,
      theme: 'green',
      stroke1: '#34d399',
      stroke2: '#059669'
    },
    {
      id: 'state-stamp-duty',
      label: 'State Stamp Duty',
      count: 'View Rates',
      isTextCount: true,
      definition: 'Check duty by state and document type',
      subNote: 'Official statutory schedules & calculator',
      pillText: 'Statutory Rates',
      icon: Landmark,
      theme: 'purple',
      stroke1: '#a78bfa',
      stroke2: '#7c3aed'
    }
  ];

  const handleCardClick = (cardId) => {
    setActiveModalCard(cardId);
  };

  const handleKeyDown = (event, cardId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveModalCard(cardId);
    }
  };

  return (
    <section aria-label="CA Practice Summary Metrics" className="zd-summary-cards-section">
      <div className="zd-summary-cards-grid zd-summary-cards-grid--four">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              role="button"
              tabIndex={0}
              id={`summary-card-${card.id}`}
              className={`zd-resource-card zd-resource-card--${card.theme}`}
              onClick={() => handleCardClick(card.id)}
              onKeyDown={(e) => handleKeyDown(e, card.id)}
              aria-label={`${card.label}: ${card.count}. Click to view details dialog.`}
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
                <span className={`zd-resource-count ${card.isTextCount ? 'zd-resource-count--text' : ''}`}>
                  {card.count}
                </span>
                <h3 className="zd-resource-label">{card.label}</h3>
                <p className="zd-resource-def">{card.definition}</p>
                {card.subNote && <span className="zd-resource-subnote">{card.subNote}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* State Stamp Duty Reference Modal */}
      <StateStampDutyModal
        isOpen={activeModalCard === 'state-stamp-duty'}
        onClose={() => setActiveModalCard(null)}
        triggerElementId="summary-card-state-stamp-duty"
      />

      {/* Shared Summary Details Modal (for clients and documents) */}
      <SummaryDetailsModal
        isOpen={Boolean(activeModalCard && activeModalCard !== 'state-stamp-duty')}
        cardId={activeModalCard}
        onClose={() => setActiveModalCard(null)}
        triggerElementId={activeModalCard ? `summary-card-${activeModalCard}` : undefined}
      />
    </section>
  );
}
