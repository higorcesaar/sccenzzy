import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'cart';
  title?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Absolute Toast Container over everything */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Render card component
const ToastCard = ({ toast, onClose }: { toast: Toast; onClose: () => void; key?: string }) => {
  // Select color & icon based on category
  const styles = {
    success: {
      bg: 'bg-white border-emerald-150 shadow-emerald-100/30',
      text: 'text-emerald-800',
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      bg: 'bg-white border-red-155 shadow-red-100/30',
      text: 'text-red-800',
      iconBg: 'bg-red-50 text-red-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    info: {
      bg: 'bg-white border-blue-150 shadow-blue-100/30',
      text: 'text-neutral-800',
      iconBg: 'bg-blue-50 text-blue-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    cart: {
      bg: 'bg-[#FDFCF7] border-gold-200 shadow-gold-150/20',
      text: 'text-neutral-900',
      iconBg: 'bg-gold-100 text-gold-600',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    }
  };

  const choice = styles[toast.type] || styles.success;

  return (
    <div
      className={`pointer-events-auto flex items-start p-4 rounded-2xl border ${choice.bg} shadow-lg transition-all duration-300 transform translate-y-0 scale-100 animate-slide-in-right max-w-sm w-full`}
      id={`toast-${toast.id}`}
    >
      <div className={`p-2 rounded-xl mr-3.5 flex-shrink-0 ${choice.iconBg}`}>
        {choice.icon}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h4 className="text-xs font-bold font-display uppercase tracking-wider text-neutral-900 mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-stone-600 font-sans leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full text-stone-400 hover:text-neutral-800 hover:bg-stone-100 transition-colors flex-shrink-0 focus:outline-none"
      >
        <svg className="h-4 w-4" fill="none" viewBox="button" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
