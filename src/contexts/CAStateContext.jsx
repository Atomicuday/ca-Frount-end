import React, { createContext, useState } from "react";

export const CAStateContext = createContext(null);

const INITIAL_CLIENTS = [
  {
    id: "CLI-101",
    name: "Acme Technologies Pvt Ltd",
    entityType: "Private Limited",
    pan: "AAACA1234A",
    gstin: "29AAACA1234A1Z5",
    contactPerson: "Arun Kumar",
    phone: "+91 98860 11223",
    status: "Active",
    filingStatus: "Up to Date"
  },
  {
    id: "CLI-102",
    name: "Zenith Retail LLP",
    entityType: "LLP",
    pan: "AABCZ5678B",
    gstin: "29AABCZ5678B1Z2",
    contactPerson: "Pooja Reddy",
    phone: "+91 98451 99887",
    status: "Active",
    filingStatus: "GSTR-3B Due"
  },
  {
    id: "CLI-103",
    name: "Dr. Vikram Sethi",
    entityType: "Individual / Professional",
    pan: "ABCDS9012K",
    gstin: "N/A",
    contactPerson: "Dr. Vikram Sethi",
    phone: "+91 94480 33445",
    status: "Active",
    filingStatus: "ITR Pending"
  }
];

const INITIAL_DOCUMENTS = [
  {
    id: "DOC-201",
    title: "Statutory Audit Report FY 2025-26",
    clientName: "Acme Technologies Pvt Ltd",
    category: "Audit",
    date: "18 Nov 2026",
    status: "eSigned",
    docRef: "AUD-2026-081"
  },
  {
    id: "DOC-202",
    title: "GSTR-9 Annual Return Computation",
    clientName: "Zenith Retail LLP",
    category: "GST",
    date: "15 Nov 2026",
    status: "Draft",
    docRef: "GST-2026-104"
  },
  {
    id: "DOC-203",
    title: "ITR-3 Computation Sheet & Form 16",
    clientName: "Dr. Vikram Sethi",
    category: "Income Tax",
    date: "10 Nov 2026",
    status: "Reviewed",
    docRef: "ITR-2026-312"
  }
];

const INITIAL_FINANCES = {
  monthlyRetainers: 285000,
  collectedThisMonth: 195000,
  pendingInvoices: 90000,
  invoices: [
    { id: "INV-501", client: "Acme Technologies Pvt Ltd", amount: 45000, status: "Paid", date: "02 Nov 2026" },
    { id: "INV-502", client: "Zenith Retail LLP", amount: 25000, status: "Pending", date: "05 Nov 2026" },
    { id: "INV-503", client: "Dr. Vikram Sethi", amount: 20000, status: "Pending", date: "12 Nov 2026" }
  ]
};

export const CAStateProvider = ({ children }) => {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [finances, setFinances] = useState(INITIAL_FINANCES);
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const openModal = (modalName, modalProps = {}) => {
    setActiveModal({ name: modalName, props: modalProps });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <CAStateContext.Provider
      value={{
        clients,
        setClients,
        documents,
        setDocuments,
        finances,
        setFinances,
        toast,
        showToast,
        activeModal,
        openModal,
        closeModal
      }}
    >
      {children}
    </CAStateContext.Provider>
  );
};

export default CAStateProvider;
