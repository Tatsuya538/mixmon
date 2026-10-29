import type { Changes, GameState } from '../domain/game';

/**
 * セーブデータの保存先を抽象化したインターフェース。
 * 第1弾は IndexedDB、将来のサーバー移行時は API 実装に差し替える。
 */
export interface GameRepository {
  /** セーブデータがなければ null */
  load(): Promise<GameState | null>;
  /** 新規ゲームの初期状態を保存する */
  init(state: GameState): Promise<void>;
  /** 1回の操作の変更をまとめて保存する（途中で失敗したら何も反映しない） */
  commit(changes: Changes): Promise<void>;
  /** 全データ削除 */
  reset(): Promise<void>;
}
