import { applyChanges, type Changes, type GameState } from '../domain/game';
import type { GameRepository } from './GameRepository';

/** テスト用のメモリ実装 */
export class MemoryRepository implements GameRepository {
  private state: GameState | null = null;

  async load() {
    return this.state ? structuredClone(this.state) : null;
  }
  async init(state: GameState) {
    this.state = structuredClone(state);
  }
  async commit(changes: Changes) {
    if (!this.state) throw new Error('not initialized');
    this.state = applyChanges(this.state, structuredClone(changes));
  }
  async reset() {
    this.state = null;
  }
}
