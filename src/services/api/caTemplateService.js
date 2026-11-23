/**
 * CA Template Service
 * Fetches published document templates with search and filtering.
 */
import { api } from './client.js';
import { PUBLISHED_CA_TEMPLATES } from '../../mock/caTemplatesData.js';

export const caTemplateService = {
  /**
   * Fetch published document templates available for drafting.
   * @param {Object} query - { search }
   */
  getPublishedTemplates: async ({ search = '' } = {}) => {
    try {
      const response = await api.get('/ca/templates', { search, status: 'published' });
      if (Array.isArray(response)) {
        return response.filter((t) => t.status === 'published');
      }
    } catch {
      // Prototype fallback
    }

    let templates = PUBLISHED_CA_TEMPLATES.filter((t) => t.status === 'published');

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q)
      );
    }

    return templates;
  },

  /**
   * Fetch template by unique ID.
   */
  getTemplateById: async (templateId) => {
    const templates = await caTemplateService.getPublishedTemplates();
    return templates.find((t) => t.id === templateId) || null;
  }
};

export default caTemplateService;
