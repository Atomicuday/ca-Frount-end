/**
 * ZapDocs Shared Translation System for CA Portal
 * Interface dictionaries for English (EN), Hindi (HI), Telugu (TE), Kannada (KN), and Marathi (MR).
 */

export const AVAILABLE_LANGUAGES = [
  { code: 'en', displayCode: 'EN', shortCode: 'EN', label: 'English', native: 'English', fullLabel: 'English' },
  { code: 'hi', displayCode: 'हिन्दी', shortCode: 'हि', label: 'Hindi', native: 'हिन्दी', fullLabel: 'हिन्दी – Hindi' },
  { code: 'te', displayCode: 'తెలుగు', shortCode: 'తె', label: 'Telugu', native: 'తెలుగు', fullLabel: 'తెలుగు – Telugu' },
  { code: 'kn', displayCode: 'ಕನ್ನಡ', shortCode: 'ಕ', label: 'Kannada', native: 'ಕನ್ನಡ', fullLabel: 'ಕನ್ನಡ – Kannada' },
  { code: 'mr', displayCode: 'मराठी', shortCode: 'म', label: 'Marathi', native: 'मराठी', fullLabel: 'मराठी – Marathi' }
];

export const STATE_TO_LANGUAGE_MAP = {
  karnataka: 'kn',
  telangana: 'te',
  'andhra pradesh': 'te',
  andhra: 'te',
  maharashtra: 'mr',
  delhi: 'hi',
  'uttar pradesh': 'hi',
  up: 'hi',
  rajasthan: 'hi',
  gujarat: 'hi',
  'madhya pradesh': 'hi',
  mp: 'hi',
  haryana: 'hi',
  punjab: 'hi',
  bihar: 'hi',
  national: 'hi'
};

export function getLanguageForState(stateName) {
  if (!stateName || typeof stateName !== 'string') return 'en';
  const clean = stateName.toLowerCase().trim();
  return STATE_TO_LANGUAGE_MAP[clean] || 'en';
}

export const UI_TRANSLATIONS = {
  en: {
    // Navigation
    nav_dashboard: 'Dashboard',
    nav_clients: 'Clients',
    nav_documents: 'Documents',
    nav_finance: 'Finance',
    nav_profile: 'Profile & Settings',
    logout: 'Log Out',

    // Header
    header_greeting_prefix: 'Hello',
    header_portal_title: 'CA Portal',
    header_portal_subtitle: 'Chartered Accountants Practice Suite',

    // Profile Dropdown
    profile_title: 'CA Profile',
    profile_membership: 'Membership No.',
    profile_firm: 'Firm Reg. No.',
    profile_manage_settings: 'Profile & Firm Settings',
    profile_cop_status: 'COP Active',

    // Dashboard
    dashboard_kpi_clients: 'Active Clients',
    dashboard_kpi_filings: 'Pending Filings',
    dashboard_kpi_completed: 'Completed Returns',
    dashboard_kpi_revenue: 'Monthly Retainers',
    dashboard_recent_activity: 'Recent Practice Activity',
    dashboard_quick_actions: 'Quick Practice Actions',

    // Buttons
    btn_add_client: '+ Add New Client',
    btn_upload_doc: 'Upload Document',
    btn_create_invoice: 'Create Invoice',
    btn_view_all: 'View All'
  },
  hi: {
    nav_dashboard: 'डैशबोर्ड',
    nav_clients: 'क्लाइंट्स',
    nav_documents: 'दस्तावेज़',
    nav_finance: 'वित्त',
    nav_profile: 'प्रोफाइल व सेटिंग्स',
    logout: 'लॉग आउट',
    header_greeting_prefix: 'नमस्ते',
    header_portal_title: 'सीए पोर्टल',
    header_portal_subtitle: 'चार्टर्ड अकाउंटेंट्स प्रैक्टिस सूट',
    profile_title: 'सीए प्रोफाइल',
    profile_membership: 'सदस्यता संख्या',
    profile_firm: 'फर्म पंजीकरण',
    profile_manage_settings: 'प्रोफाइल व फर्म सेटिंग्स',
    profile_cop_status: 'सीओपी सक्रिय',
    dashboard_kpi_clients: 'सक्रिय क्लाइंट्स',
    dashboard_kpi_filings: 'लंबित फाइलिंग',
    dashboard_kpi_completed: 'पूर्ण रिटर्न',
    dashboard_kpi_revenue: 'मासिक रिटेनर',
    dashboard_recent_activity: 'हालिया गतिविधियां',
    dashboard_quick_actions: 'त्वरित कार्य',
    btn_add_client: '+ नया क्लाइंट जोड़ें',
    btn_upload_doc: 'दस्तावेज़ अपलोड करें',
    btn_create_invoice: 'चालान बनाएं',
    btn_view_all: 'सभी देखें'
  },
  te: {
    nav_dashboard: 'డాష్‌బోర్డ్',
    nav_clients: 'క్లయింట్లు',
    nav_documents: 'డాక్యుమెంట్లు',
    nav_finance: 'ఫైనాన్స్',
    nav_profile: 'ప్రొఫైల్ & సెట్టింగ్‌లు',
    logout: 'లాగ్ అవుట్',
    header_greeting_prefix: 'నమస్కారం',
    header_portal_title: 'సిఏ పోర్టల్',
    header_portal_subtitle: 'చార్టర్డ్ అకౌంటెంట్స్ ప్రాక్టీస్ సూట్',
    profile_title: 'సిఏ ప్రొఫైల్',
    profile_membership: 'సభ్యత్వ సంఖ్య',
    profile_firm: 'సంస్థ నమోదు',
    profile_manage_settings: 'ప్రొఫైల్ & సంస్థ సెట్టింగ్‌లు',
    profile_cop_status: 'సిఒపి క్రియాశీలం',
    dashboard_kpi_clients: 'క్రియాశీల క్లయింట్లు',
    dashboard_kpi_filings: 'పెండింగ్ ఫైలింగ్‌లు',
    dashboard_kpi_completed: 'పూర్తయిన రిటర్న్స్',
    dashboard_kpi_revenue: 'నెలవారీ రిటైనర్లు',
    dashboard_recent_activity: 'ఇటీవలి ప్రాక్టీస్ కార్యాచరణ',
    dashboard_quick_actions: 'త్వరిత చర్యలు',
    btn_add_client: '+ కొత్త క్లయింట్‌ను జోడించండి',
    btn_upload_doc: 'పత్రం అప్‌లోడ్ చేయండి',
    btn_create_invoice: 'ఇన్‌వాయిస్ సృష్టించండి',
    btn_view_all: 'అన్నీ చూడండి'
  },
  kn: {
    nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    nav_clients: 'ಗ್ರಾಹಕರು',
    nav_documents: 'ದಾಖಲೆಗಳು',
    nav_finance: 'ಹಣಕಾಸು',
    nav_profile: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    logout: 'ಲಾಗ್ ಔಟ್',
    header_greeting_prefix: 'ನಮಸ್ಕಾರ',
    header_portal_title: 'ಸಿಎ ಪೋರ್ಟಲ್',
    header_portal_subtitle: 'ಚಾರ್ಟರ್ಡ್ ಅಕೌಂಟೆಂಟ್ಸ್ ಅಭ್ಯಾಸ ಸೂಟ್',
    profile_title: 'ಸಿಎ ಪ್ರೊಫೈಲ್',
    profile_membership: 'ಸದಸ್ಯತ್ವ ಸಂಖ್ಯೆ',
    profile_firm: 'ಸಂಸ್ಥೆ ನೋಂದಣಿ',
    profile_manage_settings: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಸಂಸ್ಥೆಯ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    profile_cop_status: 'ಸಿಒಪಿ ಸಕ್ರಿಯ',
    dashboard_kpi_clients: 'ಸಕ್ರಿಯ ಗ್ರಾಹಕರು',
    dashboard_kpi_filings: 'ಬಾಕಿ ಉಳಿದ ಫೈಲಿಂಗ್‌ಗಳು',
    dashboard_kpi_completed: 'ಪೂರ್ಣಗೊಂಡ ರಿಟರ್ನ್ಸ್',
    dashboard_kpi_revenue: 'ಮಾಸಿಕ ಉಳಿಕೆಗಳು',
    dashboard_recent_activity: 'ಇತ್ತೀಚಿನ ಅಭ್ಯಾಸ ಚಟುವಟಿಕೆ',
    dashboard_quick_actions: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು',
    btn_add_client: '+ ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ',
    btn_upload_doc: 'ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    btn_create_invoice: 'ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ',
    btn_view_all: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ'
  },
  mr: {
    nav_dashboard: 'डॅशबोर्ड',
    nav_clients: 'क्लायंट्स',
    nav_documents: 'कागदपत्रे',
    nav_finance: 'वित्त',
    nav_profile: 'प्रोफाइल आणि सेटिंग्ज',
    logout: 'लॉग आउट',
    header_greeting_prefix: 'नमस्कार',
    header_portal_title: 'सीए पोर्टल',
    header_portal_subtitle: 'चार्टर्ड अकाउंटंट्स प्रॅक्टिस सूट',
    profile_title: 'सीए प्रोफाइल',
    profile_membership: 'सदस्यत्व क्रमांक',
    profile_firm: 'फर्म नोंदणी',
    profile_manage_settings: 'प्रोफाइल आणि फर्म सेटिंग्ज',
    profile_cop_status: 'सीओपी सक्रिय',
    dashboard_kpi_clients: 'सक्रिय क्लायंट्स',
    dashboard_kpi_filings: 'प्रलंबित फाइलिंग',
    dashboard_kpi_completed: 'पूर्ण झालेले रिटर्न्स',
    dashboard_kpi_revenue: 'मासिक रिटेनर्स',
    dashboard_recent_activity: 'अलीकडील सराव क्रियाकलाप',
    dashboard_quick_actions: 'द्रुत कृती',
    btn_add_client: '+ नवीन क्लायंट जोडा',
    btn_upload_doc: 'कागदपत्र अपलोड करा',
    btn_create_invoice: 'इनव्हॉइस तयार करा',
    btn_view_all: 'सर्व पहा'
  }
};
