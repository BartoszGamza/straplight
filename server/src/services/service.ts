import type { Core } from '@strapi/strapi';

const STRING_FIELD_TYPES = new Set(['string', 'text', 'email', 'uid', 'richtext']);
const MAIN_FIELD_CANDIDATES = ['title', 'name', 'slug', 'email', 'subject', 'label'];

function getMainField(schema: any): string | null {
  // Check pluginOptions for configured mainField
  const configured = schema.pluginOptions?.['content-manager']?.mainField;
  if (configured && schema.attributes?.[configured]) {
    return configured;
  }

  // Fall back to well-known field names
  for (const candidate of MAIN_FIELD_CANDIDATES) {
    if (schema.attributes?.[candidate]) {
      return candidate;
    }
  }

  // Fall back to first string field
  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    if (STRING_FIELD_TYPES.has((attr as any).type)) {
      return name;
    }
  }

  return null;
}

function getSearchableFields(schema: any): string[] {
  const fields: string[] = [];
  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    if (STRING_FIELD_TYPES.has((attr as any).type)) {
      fields.push(name);
    }
  }
  return fields;
}

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async search(query: string) {
    const allResults: any[] = [];
    const contentTypes = Object.entries(strapi.contentTypes).filter(([uid]) =>
      uid.startsWith('api::')
    );

    const promises = contentTypes.map(async ([uid, schema]) => {
      try {
        const searchableFields = getSearchableFields(schema);
        if (searchableFields.length === 0) return;

        const mainField = getMainField(schema) || searchableFields[0];

        const filters = {
          $or: searchableFields.map((field) => ({
            [field]: { $containsi: query },
          })),
        };

        const entries = await strapi.documents(uid as any).findMany({
          filters,
          limit: 5,
        });

        const displayName =
          (schema as any).info?.displayName ||
          (schema as any).info?.singularName ||
          uid;

        for (const entry of entries) {
          allResults.push({
            id: entry.id,
            documentId: entry.documentId,
            label: (entry as any)[mainField] || `#${entry.documentId}`,
            contentType: displayName,
            uid,
          });
        }
      } catch {
        // Skip content types that fail to query
      }
    });

    await Promise.all(promises);
    return allResults;
  },
});

export default service;
