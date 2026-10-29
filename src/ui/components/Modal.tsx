import type { ReactNode } from 'react';

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface ConfirmProps {
  title: string;
  message?: ReactNode;
  okLabel?: string;
  onOk: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, okLabel = 'OK', onOk, onCancel }: ConfirmProps) {
  return (
    <Modal onClose={onCancel}>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      <div className="actions">
        <button className="btn btn-outline" onClick={onCancel}>
          やめる
        </button>
        <button className="btn btn-primary" onClick={onOk}>
          {okLabel}
        </button>
      </div>
    </Modal>
  );
}
