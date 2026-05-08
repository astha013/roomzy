import { createContext, useContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

let id = 0;
const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const tid = ++id;
    setToasts(prev => [...prev, { id: tid, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-root">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
};
