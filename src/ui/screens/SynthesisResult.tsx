import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import { services } from '../../services';
import { useGame } from '../../store/gameStore';
import { Modal } from '../components/Modal';
import { MonsterArt } from '../components/MonsterArt';
import { LineageCard, RankLine, StatBoxes } from '../components/MonsterDetail';
import { useUi } from '../uiStore';
import './SynthesisResult.css';

export function SynthesisResult() {
  const navigate = useNavigate();
  const outcome = useGame((s) => s.lastSynthesis);
  const run = useUi((s) => s.run);
  const [shareImage, setShareImage] = useState<string>();
  if (!outcome) return <Navigate to="/synthesis" replace />;

  const { child } = outcome;
  const m = getMonster(catalog, child.monsterId);

  const onShare = () =>
    run(async () => {
      const r = await services.share.shareMonster({ monster: m, owned: child });
      if (r.kind === 'preview') setShareImage(r.imageUrl);
    });

  return (
    <div className="page result">
      <div className="result-badges">
        {outcome.doubleShiny && <span className="result-badge shiny rainbow">W色違い！</span>}
        {child.shiny && !outcome.doubleShiny && <span className="result-badge shiny">色違い誕生！</span>}
        {outcome.newRecipe && <span className="result-badge accent">特殊合成成功！</span>}
        {outcome.rankUp && <span className="result-badge accent">ランクアップ！</span>}
        {(outcome.newNormal || outcome.newShiny) && <span className="result-badge light">NEW 図鑑登録</span>}
      </div>

      <div className={`result-art${outcome.doubleShiny ? ' double' : child.shiny ? ' glow' : ''}`}>
        <MonsterArt monster={m} shiny={child.shiny} size="78%" />
      </div>

      <h1 className="result-name">{m.name}</h1>
      {outcome.recipe && <p className="result-story">「{outcome.recipe.story}」</p>}
      <RankLine owned={child} />
      <StatBoxes monsterId={m.id} />
      <LineageCard owned={child} />

      <div className="spacer" />
      <div className="result-actions">
        <button className="btn btn-primary" onClick={() => navigate('/synthesis', { replace: true })}>
          続けて合成
        </button>
        <button className="btn btn-outline" onClick={onShare}>
          画像でシェア
        </button>
      </div>

      {shareImage && (
        <Modal
          onClose={() => {
            URL.revokeObjectURL(shareImage);
            setShareImage(undefined);
          }}
        >
          <h2>シェア画像</h2>
          <img src={shareImage} alt={`${m.name}のシェア画像`} className="share-preview" />
          <p>画像を長押し（PCは右クリック）で保存できます</p>
        </Modal>
      )}
    </div>
  );
}
