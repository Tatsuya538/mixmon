import { MockAdService, type AdService } from './AdService';
import { MockPurchaseService, type PurchaseService } from './PurchaseService';
import { WebShareService, type ShareService } from './ShareService';

/** 差し替えポイント。本番SDKやCapacitorプラグイン導入時はここだけ変える */
export const services: { ads: AdService; purchases: PurchaseService; share: ShareService } = {
  ads: new MockAdService(),
  purchases: new MockPurchaseService(),
  share: new WebShareService(),
};
