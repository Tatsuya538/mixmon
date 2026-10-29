import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../../store/gameStore';
import { MonsterGridWithFilter } from '../components/MonsterGridWithFilter';
import { PageHeader } from '../components/PageHeader';

export function ParentSelect() {
  const { slot } = useParams<{ slot: 'a' | 'b' }>();
  const navigate = useNavigate();
  const game = useGame((s) => s.game)!;
  const parents = useGame((s) => s.parents);
  const setParent = useGame((s) => s.setParent);
  const current = slot === 'b' ? parents.b : parents.a;
  const other = slot === 'b' ? parents.a : parents.b;

  return (
    <div className="page">
      <PageHeader back title={slot === 'b' ? '親Bを選ぶ' : '親Aを選ぶ'} />
      <MonsterGridWithFilter
        monsters={game.monsters}
        isSelected={(o) => o.uid === current}
        isDisabled={(o) => o.uid === other}
        onPick={(o) => {
          setParent(slot === 'b' ? 'b' : 'a', o.uid);
          navigate(-1);
        }}
      />
    </div>
  );
}
