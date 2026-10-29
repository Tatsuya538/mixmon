import monstersJson from './monsters.json';
import recipesJson from './recipes.json';
import elementTableJson from './elementTable.json';
import { createCatalog, validateCatalog } from '../domain/catalog';
import type { ElementTable, Monster, Recipe } from '../domain/types';

export const catalog = createCatalog(
  monstersJson as Monster[],
  recipesJson as Recipe[],
  elementTableJson as ElementTable,
);

if (import.meta.env?.DEV) {
  const errors = validateCatalog(catalog);
  if (errors.length) console.error('マスターデータの不整合', errors);
}
