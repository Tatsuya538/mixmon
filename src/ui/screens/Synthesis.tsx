import { Link, useNavigate } from 'react-router-dom';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import { ELEMENT_LABEL } from '../../domain/labels';
import { previewSynthesis } from '../../domain/synthesis';
import type { OwnedMonster } from '../../domain/types';
import { pairKey, useGame } from '../../store/gameStore';
import { Plus, RankBadge, ShinyBadge } from '../components/Badges';
import { ArrowDownIcon, PlusIcon, QuestionIcon } from '../components/Icons';
import { MonsterArt } from '../components/MonsterArt';
import { PageHeader } from '../components/PageHeader';
import { rankRangeText } from '../format';
import { useUi } from '../uiStore';
import './Synthesis.css';

function ParentCard({ slot, owned }: { slot: 'a' | 'b'; owned?: OwnedMonster }) {
  const navigate = useNavigate();
  const label = slot === 'a' ? '親A' : '親B';
  const m = owned && getMonster(catalog, owned.monsterId);
  return (
    <button
      className={`parent-card${owned?.shiny ? ' shiny' : ''}`}
      onClick={() => navigate(`/synthesis/select/${slot}`)}
      aria-label={`${label}を選ぶ`}
    >
      <span className="parent-label">{label}</span>
      {owned && m ? (
        <>
          <MonsterArt monster={m} shiny={owned.shiny} size="70%" />
          <span className="parent-name">{m.name}</span>
          <span className="parent-meta">
            <RankBadge rank={m.rank} />
            {owned.shiny && <ShinyBadge />}
            <Plus value={owned.plus} />
          </span>
        </>
      ) : (
        <span className="parent-empty">
          <PlusIcon size={32} />
          タップして選ぶ
        </span>
      )}
    </button>
  );
}

export function Synthesis() {
  const navigate = useNavigate();
  const game = useGame((s) => s.game)!;
  const parents = useGame((s) => s.parents);
  const revealedPairHints = useGame((s) => s.revealedPairHints);
  const { run, watchAd, showToast } = useUi();
  const busy = useUi((s) => s.busy);

  const a = game.monsters.find((m) => m.uid === parents.a);
  const b = game.monsters.find((m) => m.uid === parents.b);
  const preview = a && b ? previewSynthesis(catalog, a, b) : undefined;
  const key = a && b ? pairKey(a.monsterId, b.monsterId) : undefined;
  const recipeKnown = !!preview?.recipe && game.player.discoveredRecipes.includes(preview.recipe.id);
  const hinted = key ? revealedPairHints.includes(key) : false;
  const recipeResult = recipeKnown ? getMonster(catalog, preview!.recipe!.result) : undefined;

  let hintText = '親を2体選ぶと、生まれるモンスターの予想が表示されます';
  if (preview) {
    if (recipeResult) hintText = `特殊合成レシピ：${recipeResult.name} が生まれる！`;
    else if (hinted)
      hintText = preview.recipe ? 'この組み合わせは未発見のレシピかも…！' : 'この組み合わせはレシピではないようだ';
    else hintText = '広告を見ると、この組み合わせがレシピか分かります';
  }

  const onSynthesize = () =>
    run(async () => {
      await useGame.getState().synthesize();
      navigate('/synthesis/result');
    });

  const onHint = async () => {
    if (!key) return;
    if (await watchAd('synthesisHint')) {
      useGame.getState().revealPairHint(key);
      showToast('ヒントを手に入れた！');
    }
  };

  return (
    <div className="page synthesis">
      <PageHeader
        title="合成"
        right={
          <Link to="/monsters" className="pill" style={{ textDecoration: 'none' }}>
            所持 {game.monsters.length}体
          </Link>
        }
      />

      <div className="parents">
        <ParentCard slot="a" owned={a} />
        <span className="parents-plus">
          <PlusIcon />
        </span>
        <ParentCard slot="b" owned={b} />
      </div>

      <div className="arrow">
        <ArrowDownIcon />
      </div>

      <section className="card preview">
        <div className="preview-art">
          {recipeResult ? (
            <MonsterArt monster={recipeResult} shiny={preview?.shiny !== 'rare'} size="80%" />
          ) : (
            <span>?</span>
          )}
        </div>
        <dl className="preview-grid">
          <div>
            <dt>属性</dt>
            <dd>{preview ? ELEMENT_LABEL[preview.element] : '—'}</dd>
          </div>
          <div>
            <dt>ランク</dt>
            <dd>
              {recipeResult ? recipeResult.rank : preview ? rankRangeText(preview.minRank, preview.maxRank) : '—'}
            </dd>
          </div>
          <div>
            <dt>＋値</dt>
            <dd className="plus">{preview ? `+${preview.plus}` : '—'}</dd>
          </div>
          <div>
            <dt>色違い</dt>
            <dd className={preview && preview.shiny !== 'rare' ? 'shiny-text' : ''}>
              {!preview ? '—' : preview.shiny === 'double' ? '確定✦' : preview.shiny === 'guaranteed' ? '確定' : '0.1%'}
            </dd>
          </div>
        </dl>
      </section>

      <div className="hint-box">
        <QuestionIcon />
        <span>{hintText}</span>
      </div>

      <div className="spacer" />

      <div className="synthesis-actions">
        <button className="btn btn-primary" disabled={!preview || busy} onClick={onSynthesize}>
          合成する
        </button>
        <button className="btn btn-outline" disabled={!preview || recipeKnown || hinted} onClick={onHint}>
          広告を見てヒントをもらう
        </button>
      </div>
    </div>
  );
}
