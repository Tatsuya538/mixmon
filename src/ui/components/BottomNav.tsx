import { NavLink } from 'react-router-dom';
import { DexIcon, GachaIcon, HomeIcon, MixIcon, TradeIcon } from './Icons';

const ITEMS = [
  { to: '/', label: 'ホーム', Icon: HomeIcon, end: true },
  { to: '/synthesis', label: '合成', Icon: MixIcon },
  { to: '/gacha', label: 'ガチャ', Icon: GachaIcon },
  { to: '/dex', label: '図鑑', Icon: DexIcon },
  { to: '/exchange', label: '交換所', Icon: TradeIcon },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
