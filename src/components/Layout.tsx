import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { ToastContainer } from './ToastContainer';
import { useToast } from '../hooks/useToast';

interface LayoutProps {
  children: ReactNode;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within Layout');
  }
  return context;
};

export const Layout = ({ children }: LayoutProps) => {
  const { toasts, removeToast, success, error, warning, info } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12">
          {children}
        </main>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </ToastContext.Provider>
  );
};