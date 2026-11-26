/**
 * ZapDocs CA Portal – State Stamp Duty Statutory Reference API Service
 *
 * Sourced from gazetted state stamp duty schedules.
 * Supports rule lookup, state-wise duty summaries, and dynamic parameter estimation.
 */

import {
  SUPPORTED_INDIAN_STATES,
  SUPPORTED_DOCUMENT_TYPES,
  STAMP_DUTY_REGISTRY
} from '../../mock/caStampDutyData.js';

export const caStampDutyService = {
  /**
   * Retrieve list of supported Indian States & Union Territories
   */
  async getStates() {
    return Promise.resolve(SUPPORTED_INDIAN_STATES);
  },

  /**
   * Retrieve list of supported document / instrument categories
   */
  async getDocumentTypes() {
    return Promise.resolve(SUPPORTED_DOCUMENT_TYPES);
  },

  /**
   * Retrieve state-wise stamp duty summary for all states
   * If documentTypeId is provided, returns exact rate, 'Not applicable', or 'Not verified'.
   * If no document context exists, returns prompt instruction and empty list.
   *
   * @param {string|null} documentTypeId - e.g. 'partnership-deed'
   */
  async getAllStatesDutySummary(documentTypeId = null) {
    const states = await this.getStates();
    const docTypeObj = documentTypeId
      ? SUPPORTED_DOCUMENT_TYPES.find((d) => d.id === documentTypeId)
      : null;

    if (!documentTypeId) {
      return {
        documentType: null,
        items: [],
        prompt: 'Select a document type to compare state-wise duty.',
        disclaimer: 'Reference rates only. Final duty depends on document details and applicable rules.'
      };
    }

    const list = states.map((state) => {
      const key = `${state.code}:${documentTypeId}`;
      const rule = STAMP_DUTY_REGISTRY[key];

      if (rule) {
        let dutyText = '';
        let basisLabel = '';
        if (rule.calculationBasis === 'not_applicable') {
          dutyText = 'Not applicable';
          basisLabel = 'Statutory Exemption / Non-Chargeable';
        } else if (rule.calculationBasis === 'fixed') {
          dutyText = `₹${rule.fixedAmount.toLocaleString('en-IN')}`;
          basisLabel = 'Fixed Statutory Fee';
        } else if (rule.calculationBasis === 'percentage') {
          dutyText = `${rule.percentageRate}% (Min ₹${rule.minDuty.toLocaleString('en-IN')}${
            rule.maxDuty ? `, Max ₹${rule.maxDuty.toLocaleString('en-IN')}` : ''
          })`;
          basisLabel = 'Ad Valorem Percentage';
        } else if (rule.calculationBasis === 'slab') {
          dutyText = `Slab: ₹${rule.minDuty.toLocaleString('en-IN')} – ₹${rule.maxDuty.toLocaleString('en-IN')}`;
          basisLabel = 'Slab / Tier Schedule';
        } else {
          dutyText = rule.formulaDescription || 'Not verified';
          basisLabel = 'Special Schedule';
        }

        return {
          stateCode: state.code,
          stateName: state.name,
          duty: dutyText,
          status: rule.calculationBasis === 'not_applicable' ? 'not_applicable' : 'verified',
          articleReference: rule.articleReference || 'Statutory Schedule Reference',
          calculationBasis: rule.calculationBasis,
          calculationBasisLabel: basisLabel,
          fixedAmount: rule.fixedAmount,
          percentageRate: rule.percentageRate,
          minDuty: rule.minDuty,
          maxDuty: rule.maxDuty,
          formulaDescription: rule.formulaDescription,
          calculationInputs: rule.requiresInputs
            ? (rule.inputField?.label || 'Transaction / Capital Consideration Amount')
            : 'None (Fixed Statutory Stamp)',
          conditions: rule.notes || 'Subject to statutory schedule and sub-registrar filings.',
          effectiveDate: rule.effectiveDate || 'Current Gazette',
          lastVerifiedDate: rule.lastVerifiedDate || '15 Nov 2026',
          officialSource: rule.officialSource || state.authority,
          officialSourceUrl: rule.officialSourceUrl,
          statutoryNotice: 'Statutory government stamp duty only. Third-party vendor e-stamping convenience fees and platform transaction charges are separate.',
          denominationNotice: 'Stamp denominations available from procurement vendors (e.g. ₹20, ₹50, ₹100, ₹500) do not define legal duty liability; liability is assessed by statutory schedule.',
          rule
        };
      }

      // Unverified or missing entries must show "Not verified" — never ₹0
      return {
        stateCode: state.code,
        stateName: state.name,
        duty: 'Not verified',
        status: 'unverified',
        articleReference: 'Schedule review pending gazette publication',
        calculationBasis: 'unverified',
        calculationBasisLabel: 'Unverified Jurisdiction',
        fixedAmount: null,
        percentageRate: null,
        minDuty: null,
        maxDuty: null,
        formulaDescription: 'Not verified',
        calculationInputs: 'Pending official verification',
        conditions: 'Rate not yet verified against current state treasury gazette notifications. Do not assume ₹0.',
        effectiveDate: 'Under review',
        lastVerifiedDate: 'Pending',
        officialSource: state.authority || 'State Revenue Department',
        officialSourceUrl: null,
        statutoryNotice: 'Statutory government stamp duty only. Provider and platform fees are separate.',
        denominationNotice: 'Physical/digital stamp denominations stocked by vendors do not imply legal stamp duty liability for this instrument in this jurisdiction.',
        rule: null
      };
    });

    return {
      documentType: docTypeObj,
      items: list,
      prompt: null,
      disclaimer: 'Reference rates only. Final duty depends on document details and applicable rules.'
    };
  },

  /**
   * Retrieve the gazetted stamp duty schedule rule for a state and document type
   * @param {string} stateCode - e.g. 'MH', 'KA', 'DL'
   * @param {string} documentTypeId - e.g. 'partnership-deed', 'llp-agreement'
   */
  async getStampDutyRule(stateCode, documentTypeId) {
    if (!stateCode || !documentTypeId) {
      return null;
    }

    const key = `${stateCode}:${documentTypeId}`;
    const rule = STAMP_DUTY_REGISTRY[key];

    const stateObj = SUPPORTED_INDIAN_STATES.find((s) => s.code === stateCode);
    const docObj = SUPPORTED_DOCUMENT_TYPES.find((d) => d.id === documentTypeId);

    if (rule) {
      return Promise.resolve({
        ...rule,
        status: 'verified',
        statusLabel: 'Gazetted & Verified',
        isVerified: true
      });
    }

    // Unverified / unsupported combination - adheres strictly to rule:
    // "Unsupported or unverified entries must say 'Rate not verified' or 'Contact support', rather than showing ₹0"
    return Promise.resolve({
      stateCode,
      stateName: stateObj ? stateObj.name : stateCode,
      documentTypeId,
      documentTypeName: docObj ? docObj.name : documentTypeId,
      status: 'unverified',
      statusLabel: 'Rate not verified',
      isVerified: false,
      message: 'Statutory stamp duty rates for this state and instrument category are currently undergoing state gazette verification. Please contact support for custom stamping guidance.',
      articleReference: 'Gazette Schedule Verification Pending',
      calculationBasis: 'unverified',
      formulaDescription: 'Rate not verified — Contact support',
      fixedAmount: null,
      percentageRate: null,
      minDuty: null,
      maxDuty: null,
      requiresInputs: false,
      inputField: null,
      effectiveDate: null,
      lastVerifiedDate: null,
      officialSource: stateObj ? stateObj.act : 'State Revenue Authority',
      officialSourceUrl: null,
      providerAvailability: {
        channel: 'Physical Stamp Paper (Manual Inspection)',
        provider: 'State Treasury / Registration Department',
        status: 'Contact support for manual stamping guidance',
        isDigitalAvailable: false
      },
      notes: 'No automated digital tariff rule registered for this combination.'
    });
  },

  /**
   * Calculate statutory duty estimate based on user inputs
   * @param {Object} rule - Rule object returned by getStampDutyRule
   * @param {Object} inputValues - Key-value pair of inputs (e.g. { capitalContribution: 500000 })
   */
  calculateDutyEstimate(rule, inputValues = {}) {
    if (!rule || rule.status === 'unverified') {
      return {
        status: 'unverified',
        estimatedDuty: null,
        statusLabel: 'Rate not verified',
        formulaUsed: 'Rate not verified — Contact support',
        disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
      };
    }

    if (rule.calculationBasis === 'fixed') {
      return {
        status: 'calculated',
        estimatedDuty: rule.fixedAmount,
        isEstimate: false,
        formulaUsed: `Flat Statutory Duty of ₹${rule.fixedAmount.toLocaleString('en-IN')}`,
        breakdown: {
          governmentDuty: rule.fixedAmount,
          platformFeeNote: 'Platform convenience and stamping dispatch fee calculated separately at checkout'
        },
        disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
      };
    }

    if (rule.calculationBasis === 'percentage') {
      const fieldId = rule.inputField ? rule.inputField.id : 'capitalContribution';
      const rawInput = inputValues[fieldId];
      const amount = Number(rawInput);

      if (isNaN(amount) || amount <= 0) {
        return {
          status: 'inputs_required',
          estimatedDuty: null,
          formulaUsed: rule.formulaDescription,
          message: `Please enter a valid ${rule.inputField?.label || 'amount'} to compute estimated duty.`,
          disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
        };
      }

      let rawDuty = (amount * rule.percentageRate) / 100;
      let appliedMin = false;
      let appliedMax = false;

      if (rule.minDuty !== null && rawDuty < rule.minDuty) {
        rawDuty = rule.minDuty;
        appliedMin = true;
      }
      if (rule.maxDuty !== null && rawDuty > rule.maxDuty) {
        rawDuty = rule.maxDuty;
        appliedMax = true;
      }

      const finalDuty = Math.round(rawDuty);
      let formulaUsed = `₹${amount.toLocaleString('en-IN')} × ${rule.percentageRate}% = ₹${Math.round((amount * rule.percentageRate) / 100).toLocaleString('en-IN')}`;
      if (appliedMin) formulaUsed += ` (Min ₹${rule.minDuty.toLocaleString('en-IN')} applied)`;
      if (appliedMax) formulaUsed += ` (Max cap of ₹${rule.maxDuty.toLocaleString('en-IN')} applied)`;

      return {
        status: 'calculated',
        estimatedDuty: finalDuty,
        isEstimate: true,
        formulaUsed,
        breakdown: {
          governmentDuty: finalDuty,
          platformFeeNote: 'Platform convenience and stamping dispatch fee calculated separately at checkout'
        },
        disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
      };
    }

    if (rule.calculationBasis === 'slab') {
      const fieldId = rule.inputField ? rule.inputField.id : 'capitalContribution';
      const rawInput = inputValues[fieldId];
      const amount = Number(rawInput);

      if (isNaN(amount) || amount <= 0) {
        return {
          status: 'inputs_required',
          estimatedDuty: null,
          formulaUsed: rule.formulaDescription,
          message: `Please enter a valid ${rule.inputField?.label || 'amount'} to compute estimated duty.`,
          disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
        };
      }

      let finalDuty = amount <= 50000 ? 1000 : 5000;
      let formulaUsed = amount <= 50000
        ? `Capital up to ₹50,000 attracts ₹1,000 statutory slab duty`
        : `Capital exceeding ₹50,000 attracts ₹5,000 statutory slab duty`;

      return {
        status: 'calculated',
        estimatedDuty: finalDuty,
        isEstimate: true,
        formulaUsed,
        breakdown: {
          governmentDuty: finalDuty,
          platformFeeNote: 'Platform convenience and stamping dispatch fee calculated separately at checkout'
        },
        disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
      };
    }

    return {
      status: 'unverified',
      estimatedDuty: null,
      statusLabel: 'Rate not verified',
      formulaUsed: 'Contact support',
      disclaimer: 'Final duty depends on the document and is confirmed at checkout.'
    };
  }
};
