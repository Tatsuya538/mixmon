import type { Element, Monster, Rank } from './types';

export const ELEMENT_LABEL: Record<Element, string> = {
  fire: '炎',
  water: '水',
  thunder: '雷',
  forest: '森',
  shadow: '影',
};

export const ELEMENT_COLOR: Record<Element, string> = {
  fire: '#ff7a45',
  water: '#4ea3ff',
  thunder: '#ffd84a',
  forest: '#6fd46f',
  shadow: '#9a7bff',
};

export const RANK_ORDER: Record<Rank, number> = { N: 0, R: 1, SR: 2, UR: 3, LR: 4 };

export function elementText(m: Pick<Monster, 'element'>): string {
  return ELEMENT_LABEL[m.element];
}
