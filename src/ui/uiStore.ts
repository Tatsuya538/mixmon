import { create } from 'zustand';
import { services } from '../services';
import type { AdPlacement } from '../services/AdService';

/** 画面全体の一時的な表示（トースト・広告再生中・処理中） */
interface UiStore {
  toast?: string;
  adPlaying: boolean;
  busy: boolean;
  showToast(message: string): void;
  /** 広告を見せて、最後まで見たら true */
  watchAd(placement: AdPlacement): Promise<boolean>;
  /** 連打防止しつつ非同期処理を実行。エラーはトーストに出す */
  run<T>(fn: () => Promise<T>): Promise<T | undefined>;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiStore>((set, get) => ({
  adPlaying: false,
  busy: false,
  showToast(message) {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: undefined }), 2400);
  },
  async watchAd(placement) {
    set({ adPlaying: true });
    try {
      const ok = await services.ads.showRewarded(placement);
      if (!ok) get().showToast('広告を最後まで見ると報酬がもらえます');
      return ok;
    } finally {
      set({ adPlaying: false });
    }
  },
  async run(fn) {
    if (get().busy) return undefined;
    set({ busy: true });
    try {
      return await fn();
    } catch (e) {
      get().showToast(e instanceof Error ? e.message : String(e));
      return undefined;
    } finally {
      set({ busy: false });
    }
  },
}));
