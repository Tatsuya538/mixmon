import { create } from 'zustand';
import { catalog } from '../data';
import {
  applyChanges,
  exchangeAction,
  gachaAction,
  newGame,
  sellAction,
  synthesisAction,
  type Acquired,
  type Changes,
  type Ctx,
  type GameState,
  type SynthesisOutcome,
} from '../domain/game';
import type { GachaKind } from '../domain/gacha';
import { mathRng, type Rng } from '../domain/rng';
import { IndexedDbRepository } from '../storage/IndexedDbRepository';
import { MemoryRepository } from '../storage/MemoryRepository';
import type { GameRepository } from '../storage/GameRepository';

/** 差し替え可能な依存（テストやサーバー移行時に変更する） */
export const deps: { repo: GameRepository; rng: Rng; now: () => number } = {
  repo: new IndexedDbRepository(),
  rng: mathRng,
  now: () => Date.now(),
};

const ctx = (): Ctx => ({ catalog, rng: deps.rng, now: deps.now() });

type Slot = 'a' | 'b';

let loading: Promise<void> | undefined;

interface GameStore {
  status: 'loading' | 'ready' | 'error';
  /** IndexedDB が使えずメモリ保存で動いている（再読み込みで消える） */
  volatile: boolean;
  error?: string;
  game: GameState | null;
  /** 合成画面で選んでいる親 */
  parents: Record<Slot, string | undefined>;
  lastSynthesis?: SynthesisOutcome;
  lastGacha?: Acquired[];
  /** 広告で見たヒント（セッション中のみ保持） */
  revealedDexHints: string[];
  revealedPairHints: string[];

  load(): Promise<void>;
  setParent(slot: Slot, uid: string | undefined): void;
  synthesize(): Promise<SynthesisOutcome>;
  gacha(kind: GachaKind): Promise<Acquired[]>;
  sell(uids: string[]): Promise<number>;
  exchange(monsterId: string): Promise<Acquired>;
  revealDexHint(monsterId: string): void;
  revealPairHint(key: string): void;
  resetAll(): Promise<void>;
}

export const useGame = create<GameStore>((set, get) => {
  /** 変更を保存してから画面に反映する（保存失敗時は画面を変えない） */
  async function commit(changes: Changes) {
    const game = get().game;
    if (!game) throw new Error('ゲームが読み込まれていません');
    await deps.repo.commit(changes);
    set({ game: applyChanges(game, changes) });
  }

  function current(): GameState {
    const game = get().game;
    if (!game) throw new Error('ゲームが読み込まれていません');
    return game;
  }

  return {
    status: 'loading',
    volatile: false,
    game: null,
    parents: { a: undefined, b: undefined },
    revealedDexHints: [],
    revealedPairHints: [],

    load() {
      // StrictMode 等で二重に呼ばれても新規ゲームを2回作らないよう、実行中の読み込みを共有する
      loading ??= (async () => {
        try {
          let game = await deps.repo.load().catch(() => {
            // プライベートブラウズ等で IndexedDB が使えない場合はメモリ保存で遊べるようにする
            deps.repo = new MemoryRepository();
            set({ volatile: true });
            return null;
          });
          if (!game) {
            game = newGame(ctx());
            await deps.repo.init(game);
          }
          set({ game, status: 'ready' });
        } catch (e) {
          set({ status: 'error', error: String(e) });
        } finally {
          loading = undefined;
        }
      })();
      return loading;
    },

    setParent(slot, uid) {
      set({ parents: { ...get().parents, [slot]: uid } });
    },

    async synthesize() {
      const { a, b } = get().parents;
      if (!a || !b) throw new Error('親を2体選んでください');
      const { changes, outcome } = synthesisAction(current(), a, b, ctx());
      await commit(changes);
      set({ lastSynthesis: outcome, parents: { a: undefined, b: undefined } });
      return outcome;
    },

    async gacha(kind) {
      const { changes, acquired } = gachaAction(current(), kind, ctx());
      await commit(changes);
      set({ lastGacha: acquired });
      return acquired;
    },

    async sell(uids) {
      const { changes, gained } = sellAction(current(), uids, ctx());
      await commit(changes);
      const { a, b } = get().parents;
      set({ parents: { a: a && uids.includes(a) ? undefined : a, b: b && uids.includes(b) ? undefined : b } });
      return gained;
    },

    async exchange(monsterId) {
      const { changes, acquired } = exchangeAction(current(), monsterId, ctx());
      await commit(changes);
      return acquired;
    },

    revealDexHint(monsterId) {
      set({ revealedDexHints: [...get().revealedDexHints, monsterId] });
    },

    revealPairHint(key) {
      set({ revealedPairHints: [...get().revealedPairHints, key] });
    },

    async resetAll() {
      await deps.repo.reset();
      set({ game: null, status: 'loading', parents: { a: undefined, b: undefined } });
      await get().load();
    },
  };
});

export function pairKey(monsterIdA: string, monsterIdB: string): string {
  return [monsterIdA, monsterIdB].sort().join('|');
}
