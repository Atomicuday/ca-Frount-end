import React, { useState } from 'react';
import { Search, Plus, Users, Building, Phone, ExternalLink } from 'lucide-react';
import { useCAState } from '../../hooks/useCAState';
import './CAClients.css';

export default function CAClientsScreen() {
  const { clients } = useCAState();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'CORPORATE' && client.entityType.includes('Limited')) ||
      (typeFilter === 'LLP' && client.entityType.includes('LLP')) ||
      (typeFilter === 'INDIVIDUAL' && client.entityType.includes('Individual'));

    return matchesSearch && matchesType;
  });

  return (
    <div className="ca-clients-screen">
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Client Management Vault</h1>
          <p className="ca-page-subtitle">
            Manage your firm's corporate entities, LLPs, and individual tax clients
          </p>
        </div>
        <div className="ca-page-actions">
          <button type="button" className="btn btn-primary" id="btn-add-client">
            <Plus size={15} />
            <span>+ Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="zd-card ca-filter-bar">
        <div className="ca-search-input-wrap">
          <Search size={16} className="ca-search-icon" />
          <input
            type="text"
            placeholder="Search by client name, PAN, or contact person…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ca-search-input"
            id="client-search-input"
          />
        </div>

        <div className="ca-type-filters">
          <button
            type="button"
            className={`ca-filter-pill ${typeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ALL')}
          >
            All Clients ({clients.length})
          </button>
          <button
            type="button"
            className={`ca-filter-pill ${typeFilter === 'CORPORATE' ? 'active' : ''}`}
            onClick={() => setTypeFilter('CORPORATE')}
          >
            Corporate
          </button>
          <button
            type="button"
            className={`ca-filter-pill ${typeFilter === 'LLP' ? 'active' : ''}`}
            onClick={() => setTypeFilter('LLP')}
          >
            LLP
          </button>
          <button
            type="button"
            className={`ca-filter-pill ${typeFilter === 'INDIVIDUAL' ? 'active' : ''}`}
            onClick={() => setTypeFilter('INDIVIDUAL')}
          >
            Individual
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Client / Entity Name</th>
              <th>Entity Type</th>
              <th>PAN / GSTIN</th>
              <th>Primary Contact</th>
              <th>Filing Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="client-entity-icon">
                      {client.entityType.includes('Individual') ? <Users size={16} /> : <Building size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        ID: {client.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-info">{client.entityType}</span>
                </td>
                <td>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{client.pan}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{client.gstin}</div>
                </td>
                <td>
                  <div>{client.contactPerson}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={10} /> {client.phone}
                  </div>
                </td>
                <td>
                  <span className={`badge ${client.filingStatus.includes('Due') ? 'badge-warning' : 'badge-success'}`}>
                    {client.filingStatus}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                    <span>Vault</span>
                    <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
