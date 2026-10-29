import type { Rank } from '../domain/types';

export function rankRangeText(min: Rank, max: Rank): string {
  return min === max ? min : `${min}〜${max}`;
}

export function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}
