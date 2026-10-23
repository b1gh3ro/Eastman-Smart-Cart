'use client';

// Toast messages and confirmation dialogs, available anywhere through useToast() / useConfirm().

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; text: string };
type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; destructive?: boolean };
type PendingConfirm = ConfirmOptions & { resolve: (ok: boolean) => void };

const ToastContext = createContext<(kind: ToastKind, text: string) => void>(() => {});
const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

export const useToast = () => useContext(ToastContext);
export const useConfirm = () => useContext(ConfirmContext);

const toastStyle: Record<ToastKind, { box: string; icon: string }> = {
  success: { box: 'border-tertiary/20 bg-[#ecfdf5] text-on-tertiary-fixed-variant', icon: 'check_circle' },
  error: { box: 'border-error/20 bg-[#fff1f2] text-on-error-container', icon: 'error' },
  info: { box: 'border-outline-variant bg-surface-container-lowest text-on-surface', icon: 'info' },
};

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-body-sm shadow-xl ${toastStyle[t.kind].box}`}
            >
              <Icon name={toastStyle[t.kind].icon} className="mt-0.5 text-[18px]" />
              <span className="flex-1">{t.text}</span>
              <button aria-label="Dismiss" className="opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)}>
                <Icon name="close" className="text-[16px]" />
              </button>
            </div>
          ))}
        </div>

        {confirmState && <ConfirmDialog {...confirmState} onClose={close} />}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive,
  onClose,
}: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm" onClick={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-surface-container-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-headline-sm">
          {title}
        </h2>
        {message && <p className="mt-2 text-body-sm text-on-surface-variant">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} className="btn-secondary" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button className={destructive ? 'btn-destructive' : 'btn-primary'} onClick={() => onClose(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
