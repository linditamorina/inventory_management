// Maps English → Albanian normalized key (for bilingual duplicate detection)
const EN_TO_NORMALIZED: Record<string, string> = {
  'accessories': 'aksesore',
  'equipment': 'pajisje',
  'software': 'softuer',
  'electronics': 'elektronike',
  'clothing': 'veshje',
  'furniture': 'mobilje',
  'food': 'ushqim',
  'drinks': 'pije',
  'tools': 'vegla',
  'office': 'zyre',
  'computers': 'kompjutere',
  'phones': 'telefone',
  'other': 'tjera',
};

// Strips Albanian diacritics and lowercases for comparison
function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ');
}

// Returns a stable comparison key regardless of language
export function getCategoryKey(name: string): string {
  const n = normalize(name);
  return EN_TO_NORMALIZED[n] ?? n;
}

// Returns the existing category name if it's a duplicate, otherwise null
export function findDuplicateCategory(
  newName: string,
  existingCategories: { name: string }[]
): string | null {
  const newKey = getCategoryKey(newName);
  for (const cat of existingCategories) {
    if (getCategoryKey(cat.name) === newKey) {
      return cat.name;
    }
  }
  return null;
}
