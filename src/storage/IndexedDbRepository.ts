import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Changes, GameState } from '../domain/game';
import type { OwnedMonster, PlayerState } from '../domain/types';
import type { GameRepository } from './GameRepository';
import { migratePlayer, SAVE_VERSION } from './migrations';

interface MixmonDB extends DBSchema {
  player: { key: string; value: PlayerState & { version: number } };
  monsters: { key: string; value: OwnedMonster };
}

const PLAYER_KEY = 'me';

export class IndexedDbRepository implements GameRepository {
  private dbPromise?: Promise<IDBPDatabase<MixmonDB>>;

  constructor(private dbName = 'mixmon') {}

  /** 初回アクセス時に開く（IndexedDB が無い環境でも起動時に落ちず、load の失敗として扱えるように） */
  private db(): Promise<IDBPDatabase<MixmonDB>> {
    this.dbPromise ??= (async () =>
      openDB<MixmonDB>(this.dbName, 1, {
        upgrade(db) {
          db.createObjectStore('player');
          db.createObjectStore('monsters', { keyPath: 'uid' });
        },
      }))();
    return this.dbPromise;
  }

  async load(): Promise<GameState | null> {
    const db = await this.db();
    const tx = db.transaction(['player', 'monsters'], 'readonly');
    const [raw, monsters] = await Promise.all([
      tx.objectStore('player').get(PLAYER_KEY),
      tx.objectStore('monsters').getAll(),
    ]);
    await tx.done;
    if (!raw) return null;
    const player = migratePlayer(raw as never);
    // 引き継げない古いセーブは新規ゲーム扱い（init で上書きされる）
    return player ? { player, monsters } : null;
  }

  async init(state: GameState) {
    const db = await this.db();
    const tx = db.transaction(['player', 'monsters'], 'readwrite');
    await tx.objectStore('monsters').clear();
    await Promise.all([
      tx.objectStore('player').put({ ...state.player, version: SAVE_VERSION }, PLAYER_KEY),
      ...state.monsters.map((m) => tx.objectStore('monsters').put(m)),
      tx.done,
    ]);
  }

  async commit(changes: Changes) {
    const db = await this.db();
    const tx = db.transaction(['player', 'monsters'], 'readwrite');
    const store = tx.objectStore('monsters');
    await Promise.all([
      tx.objectStore('player').put({ ...changes.player, version: SAVE_VERSION }, PLAYER_KEY),
      ...changes.remove.map((uid) => store.delete(uid)),
      ...changes.put.map((m) => store.put(m)),
      tx.done,
    ]);
  }

  async reset() {
    const db = await this.db();
    const tx = db.transaction(['player', 'monsters'], 'readwrite');
    await Promise.all([tx.objectStore('player').clear(), tx.objectStore('monsters').clear(), tx.done]);
  }
}
