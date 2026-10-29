import { catalog } from '../../data';
import { AD_PER_DAY, FREE_PER_DAY, GACHA_RATES, GACHA_SHINY_RATE, gachaPool, MULTI_COUNT } from '../../domain/gacha';
import { elementText } from '../../domain/labels';
import { RankBadge } from '../components/Badges';
import { MonsterArt } from '../components/MonsterArt';
import { PageHeader } from '../components/PageHeader';
import { percent } from '../format';
import './GachaRates.css';

export function GachaRates() {
  return (
    <div className="page">
      <PageHeader back title="排出率の詳細" />
      <section className="card rate-notes">
        <p>・ランク別排出率：{GACHA_RATES.map((g) => `${g.rank} ${percent(g.rate)}`).join(' ／ ')}</p>
        <p>・色違い：ランクとは別に、1回ごとに {percent(GACHA_SHINY_RATE)} の確率で色違いになります。</p>
        <p>・同じランクのモンスターはすべて同じ確率で出現します。</p>
        <p>
          ・無料ガチャは1日{FREE_PER_DAY}回、広告視聴で1日{AD_PER_DAY}
          回まで追加で回せます（端末の日付で0時にリセット）。
        </p>
        <p>・{MULTI_COUNT}連ガチャの排出率も上記と同じです。</p>
        <p>・SR以上のモンスターは合成でのみ誕生します。</p>
      </section>
      {GACHA_RATES.map((g) => {
        const pool = gachaPool(catalog, g.rank);
        return (
          <section key={g.rank} className="card rate-table">
            <h3>
              <RankBadge rank={g.rank} /> 合計 {percent(g.rate)}
            </h3>
            <ul>
              {pool.map((m) => (
                <li key={m.id}>
                  <MonsterArt monster={m} size={36} />
                  <span className="name">{m.name}</span>
                  <span className="text-sub">{elementText(m)}</span>
                  <b>{(Math.round((g.rate / pool.length) * 10000) / 100).toFixed(2)}%</b>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
