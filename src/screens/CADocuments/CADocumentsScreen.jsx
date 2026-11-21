import React, { useState } from 'react';
import { Search, Upload, FileText, Clock, Download, ShieldCheck } from 'lucide-react';
import { useCAState } from '../../hooks/useCAState';
import './CADocuments.css';

export default function CADocumentsScreen() {
  const { documents } = useCAState();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.docRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || doc.category.toUpperCase() === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="ca-documents-screen">
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Tax & Audit Document Vault</h1>
          <p className="ca-page-subtitle">
            Secure legal repository for audited financials, tax computations, and eSigned returns
          </p>
        </div>
        <div className="ca-page-actions">
          <button type="button" className="btn btn-primary" id="btn-upload-document">
            <Upload size={15} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="zd-card ca-filter-bar">
        <div className="ca-search-input-wrap">
          <Search size={16} className="ca-search-icon" />
          <input
            type="text"
            placeholder="Search by document title, client, or reference ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ca-search-input"
            id="doc-search-input"
          />
        </div>

        <div className="ca-type-filters">
          {['ALL', 'AUDIT', 'GST', 'INCOME TAX'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ca-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'ALL' ? 'All Documents' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Document Details</th>
              <th>Associated Client</th>
              <th>Category</th>
              <th>Filing Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="ca-doc-icon">
                      <FileText size={18} color="#0071e3" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        Ref: {doc.docRef}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{doc.clientName}</span>
                </td>
                <td>
                  <span className="badge badge-info">{doc.category}</span>
                </td>
                <td>{doc.date}</td>
                <td>
                  <span className={`badge ${doc.status === 'eSigned' ? 'badge-success' : 'badge-warning'}`}>
                    {doc.status === 'eSigned' ? <ShieldCheck size={11} /> : <Clock size={11} />}
                    <span>{doc.status}</span>
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                    <Download size={13} />
                    <span>Download</span>
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
