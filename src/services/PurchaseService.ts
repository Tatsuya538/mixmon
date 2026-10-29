export interface Product {
  id: string;
  title: string;
  /** 表示用の価格文字列（ストアから取得する想定） */
  priceLabel: string;
}

export const PRODUCT_GACHA10 = 'gacha10';

/** アプリ内課金の抽象。Capacitor 化時にストア課金プラグインで実装する */
export interface PurchaseService {
  getProducts(): Promise<Product[]>;
  /** 購入が完了したら true、キャンセルなら false */
  purchase(productId: string): Promise<boolean>;
}

export class MockPurchaseService implements PurchaseService {
  async getProducts(): Promise<Product[]> {
    return [{ id: PRODUCT_GACHA10, title: '10連ガチャ', priceLabel: '¥160（仮）' }];
  }
  async purchase(): Promise<boolean> {
    // モック: 少し待って常に購入成功。購入前の確認は画面側のモーダルで行う
    await new Promise((r) => setTimeout(r, 500));
    return true;
  }
}
