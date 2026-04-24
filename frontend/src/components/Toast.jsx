import { CheckCircle, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success'
          ? <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
          : <XCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />}
        {message}
      </div>
    </div>
  );
}
