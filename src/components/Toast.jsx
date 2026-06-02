import { useEffect } from 'react';
import Icon from './Icons';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-brand-orange';
  const icon = type === 'success'
    ? <Icon.Check className="w-5 h-5" />
    : <Icon.AlertCircle className="w-5 h-5" />;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px]`}>
        {icon}
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
}
