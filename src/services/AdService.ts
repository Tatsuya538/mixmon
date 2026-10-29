export type AdPlacement = 'gacha' | 'synthesisHint' | 'dexHint';

/** 広告SDKの抽象。報酬型広告を最後まで見たら true */
export interface AdService {
  showRewarded(placement: AdPlacement): Promise<boolean>;
}

/** モック: 少し待って常に視聴完了扱い */
export class MockAdService implements AdService {
  constructor(private delayMs = 800) {}
  async showRewarded(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    return true;
  }
}
