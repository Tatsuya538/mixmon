import type { PlayerState } from '../domain/types';

export const SAVE_VERSION = 2;
/**
 * これより古いセーブは引き継がず新規ゲームにする。
 * v1 は開発中のモンスター一覧（2属性あり）で、同じIDでも別のモンスターを指すため変換できない。
 */
export const MIN_SUPPORTED_VERSION = 2;

/** 引き継げないセーブなら null。セーブデータの形式が変わったらここに移行処理を追加する */
export function migratePlayer(raw: { version?: number } & Record<string, unknown>): PlayerState | null {
  const version = raw.version ?? 1;
  if (version > SAVE_VERSION) throw new Error(`未知のセーブデータ形式: v${version}`);
  if (version < MIN_SUPPORTED_VERSION) return null;
  // 将来: if (version < 3) { ... }
  const { version: _v, ...player } = raw;
  return player as unknown as PlayerState;
}
