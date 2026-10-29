import type { Rank } from '../../domain/types';

export const RankBadge = ({ rank }: { rank: Rank }) => <span className={`badge badge-${rank}`}>{rank}</span>;

export const ShinyBadge = ({ label = '色違い' }: { label?: string }) => (
  <span className="badge badge-shiny">{label}</span>
);

export const Plus = ({ value }: { value: number }) => <span className="plus">+{value}</span>;
