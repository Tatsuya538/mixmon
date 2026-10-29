import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 26, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  };
}

export const HomeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 11 12 3.5 20.5 11M6 9v11h12V9" />
  </svg>
);
export const MixIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);
export const GachaIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h6M15 12h6" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const DexIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="16" rx="1" />
    <path d="M12 4v16" />
  </svg>
);
export const TradeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />
  </svg>
);
export const PointIcon = (p: P) => (
  <svg {...base({ size: 20, ...p })}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 16.5V7.5h3a2.5 2.5 0 0 1 0 5h-3" />
  </svg>
);
export const BackIcon = (p: P) => (
  <svg {...base({ size: 22, ...p })}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const ArrowDownIcon = (p: P) => (
  <svg {...base({ size: 36, ...p })}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base({ size: 36, ...p })}>
    <path d="M12 4v16M4 12h16" />
  </svg>
);
export const QuestionIcon = (p: P) => (
  <svg {...base({ size: 22, ...p })}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
export const SparkleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" fill="currentColor" />
  </svg>
);
