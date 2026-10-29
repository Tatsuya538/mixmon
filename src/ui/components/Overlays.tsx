import { useUi } from '../uiStore';

export function Overlays() {
  const toast = useUi((s) => s.toast);
  const adPlaying = useUi((s) => s.adPlaying);
  return (
    <>
      {adPlaying && (
        <div className="ad-overlay">
          <div>
            広告を再生中…（モック）
            <br />
            <span style={{ opacity: 0.6, fontSize: 13 }}>本番では広告SDKの動画が表示されます</span>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
