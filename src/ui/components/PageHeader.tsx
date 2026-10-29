import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from './Icons';

export function PageHeader({ title, back, right }: { title: ReactNode; back?: boolean; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back && (
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <BackIcon />
        </button>
      )}
      <h1 className="page-title">{title}</h1>
      <div className="spacer" />
      {right}
    </header>
  );
}
