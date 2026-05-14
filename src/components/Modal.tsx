import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "./SurfaceCard";
import { useStore } from "@/lib/store";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

import { createPortal } from "react-dom";

export function Modal({ isOpen, onClose, title, children, footer, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = useStore(s => s.openModal);
  const closeModal = useStore(s => s.closeModal);
  const isRegistered = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    if (isOpen && !isRegistered.current) {
      document.body.style.overflow = "hidden";
      openModal();
      isRegistered.current = true;
      window.addEventListener("keydown", handleEscape);
    } else if (!isOpen && isRegistered.current) {
      document.body.style.overflow = "unset";
      closeModal();
      isRegistered.current = false;
      window.removeEventListener("keydown", handleEscape);
    }

    return () => {
      if (isRegistered.current) {
        document.body.style.overflow = "unset";
        closeModal();
        isRegistered.current = false;
      }
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, openModal, closeModal]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 pb-28 md:pb-6">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      <SurfaceCard 
        variant="glass" 
        padding="none"
        className={cn(
          "relative w-full md:max-w-md bg-background rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-500 z-10 border-brand/10",
          className
        )}
      >
        <div className="flex items-center justify-between p-7 pb-2">
          <h2 className="text-xl font-black text-ink tracking-tightest uppercase">{title}</h2>
          <button 
            onClick={onClose} 
            className="size-11 rounded-2xl bg-surface-soft hover:bg-hairline flex items-center justify-center transition-all active:scale-90"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-7 pt-2">
          {children}
        </div>

        {footer && (
          <div className="p-7 pt-0 flex gap-3">
            {footer}
          </div>
        )}
      </SurfaceCard>
    </div>,
    document.body
  );
}

interface PromptModalProps extends ModalProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  type?: string;
}

export function PromptModal({ value, onChange, onSubmit, placeholder, type = "text", ...props }: PromptModalProps) {
  return (
    <Modal 
      {...props} 
      footer={
        <>
          <button 
            onClick={props.onClose} 
            className="flex-1 py-3.5 rounded-2xl bg-surface-soft text-ink font-bold text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit} 
            className="flex-1 py-3.5 rounded-2xl bg-brand text-white font-bold text-xs uppercase tracking-widest shadow-brand"
          >
            Confirm
          </button>
        </>
      }
    >
      <input 
        autoFocus
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        className="w-full bg-surface-soft rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand border border-hairline transition-all"
      />
    </Modal>
  );
}

export function ConfirmModal({ onConfirm, confirmText = "Confirm", confirmVariant = "brand", ...props }: ModalProps & { onConfirm: () => void; confirmText?: string; confirmVariant?: "brand" | "destructive" }) {
  return (
    <Modal 
      {...props} 
      footer={
        <>
          <button 
            onClick={props.onClose} 
            className="flex-1 py-3.5 rounded-2xl bg-surface-soft text-ink font-bold text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); props.onClose(); }} 
            className={cn(
              "flex-1 py-3.5 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-lg",
              confirmVariant === "destructive" ? "bg-destructive shadow-destructive/20" : "bg-brand shadow-brand"
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="text-sm text-ink-soft leading-relaxed">
        {props.children}
      </div>
    </Modal>
  );
}
