export const STRING_FIELD_TYPES = new Set(['string', 'text', 'email', 'uid', 'richtext']);
export const MAIN_FIELD_CANDIDATES = ['title', 'name', 'slug', 'email', 'subject', 'label'];

export function getMainField(schema: any): string | null {
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

export function getSearchableFields(schema: any): string[] {
  const fields: string[] = [];
  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    if (STRING_FIELD_TYPES.has((attr as any).type)) {
      fields.push(name);
    }
  }
  return fields;
}
