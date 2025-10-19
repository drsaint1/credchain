import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-lg border backdrop-blur-xl ${getStyles()} animate-slide-in-right shadow-lg`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white break-words">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};