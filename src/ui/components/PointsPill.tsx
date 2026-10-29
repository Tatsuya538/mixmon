import { useGame } from '../../store/gameStore';
import { PointIcon } from './Icons';

export function PointsPill() {
  const points = useGame((s) => s.game?.player.points ?? 0);
  return (
    <span className="pill">
      <PointIcon />
      交換pt {points}
    </span>
  );
}
