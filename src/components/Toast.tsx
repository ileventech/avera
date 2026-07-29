'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function cleanErrorMessage(msg: string): string {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  
  // Suppress technical Postgres/Supabase error codes/messages
  const msgLower = msg.toLowerCase();
  if (msgLower.includes('pgrst') || msgLower.includes('postgrest') || msgLower.includes('table not found') || msgLower.includes('relation') || msgLower.includes('does not exist')) {
    return 'Database connection error. Please contact support or check if migrations are applied.';
  }
  if (msgLower.includes('failed to fetch') || msgLower.includes('networkerror') || msgLower.includes('network request failed')) {
    return 'Network connection lost. Please check your internet connection and try again.';
  }
  if (msgLower.includes('violates foreign key constraint') || msgLower.includes('foreign key')) {
    return 'This item cannot be deleted or modified because it is being used by other parts of the system.';
  }
  if (msgLower.includes('violates unique constraint') || msgLower.includes('duplicate key') || msgLower.includes('already exists')) {
    return 'An item with this information already exists in the system.';
  }
  if (msgLower.includes('row level security') || msgLower.includes('insufficient privilege') || msgLower.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }
  
  return msg;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const cleanedMessage = type === 'error' ? cleanErrorMessage(message) : message;
    
    setToasts((prev) => [...prev, { id, type, message: cleanedMessage, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((msg: string, dur?: number) => showToast('success', msg, dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast('error', msg, dur), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast('info', msg, dur), [showToast]);

  // Override window.alert globally to map to toast.error
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalAlert = window.alert;
    window.alert = (msg: any) => {
      const messageString = String(msg);
      
      // Extract prefix e.g. "Could not save: "
      if (messageString.includes('Could not') || messageString.includes('Failed to')) {
        const parts = messageString.split(':');
        const prefix = parts[0];
        const detail = parts.slice(1).join(':').trim();
        if (detail) {
          error(`${prefix}: ${cleanErrorMessage(detail)}`);
          return;
        }
      }
      
      error(cleanErrorMessage(messageString));
    };
    
    return () => {
      window.alert = originalAlert;
    };
  }, [error]);

  return (
    <ToastContext.Provider value={{ toast: showToast, success, error, info }}>
      {children}
      
      {/* Toast container overlay */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          
          let bgColor = 'white';
          let borderColor = '#E2E8F0';
          let Icon = Info;
          let iconColor = '#3B82F6';
          
          if (isSuccess) {
            borderColor = '#10B981';
            iconColor = '#10B981';
            Icon = CheckCircle;
          } else if (isError) {
            borderColor = '#EF4444';
            iconColor = '#EF4444';
            Icon = AlertCircle;
          }

          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: bgColor,
                borderLeft: `5px solid ${iconColor}`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                animation: 'slideIn 0.3s ease forwards',
                pointerEvents: 'auto',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <Icon size={18} color={iconColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word', lineHeight: '1.4' }}>
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  flexShrink: 0,
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
