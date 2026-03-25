"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ButtonHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export interface RenderModalOptions {
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  customFooter?: ReactNode;
  onClose?: () => void;
  onOpen?: () => void;
  size?: ModalSize;
}

export interface ModalInstance {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const SIZE_MAP: Record<ModalSize, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};

export function useModal({ title }: { title: string }): [
  ModalInstance,
  (content: ReactNode, options?: RenderModalOptions) => ReactNode
] {
  const [isOpen, setIsOpen] = useState(false);
  const optionsRef = useRef<RenderModalOptions>({});

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const modalInstance = useMemo<ModalInstance>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen]
  );

  const renderModal = useCallback(
    (content: ReactNode, options?: RenderModalOptions): ReactNode => {
      if (options) optionsRef.current = options;
      return <ModalPortal title={title} isOpen={isOpen} onClose={close} options={optionsRef.current}>{content}</ModalPortal>;
    },
    [title, isOpen, close]
  );

  return [modalInstance, renderModal];
}

function ModalPortal({
  title,
  isOpen,
  onClose,
  options,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  options: RenderModalOptions;
  children: ReactNode;
}) {
  const {
    okButtonProps,
    cancelButtonProps,
    customFooter,
    onClose: onCloseCallback,
    onOpen,
    size = "md",
  } = options;

  // Keep mounted during close animation
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Double rAF ensures the browser paints the initial (hidden) state
      // before applying the animated (visible) state
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
      onOpen?.();
    } else if (mounted) {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onCloseCallback?.();
    onClose();
  }, [onClose, onCloseCallback]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out ${
        animating ? "bg-black/70" : "bg-black/0"
      }`}
      onClick={handleBackdrop}
    >
      <div
        className={`${SIZE_MAP[size]} w-full bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col max-h-[85vh] mx-4 transition-all duration-300 ease-out ${
          animating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-white text-xs font-mono uppercase tracking-wider">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-600 hover:text-white transition-colors cursor-pointer text-2xl leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {(customFooter || okButtonProps || cancelButtonProps) && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800">
            {customFooter ?? (
              <>
                {cancelButtonProps && (
                  <ModalButton variant="cancel" {...cancelButtonProps} />
                )}
                {okButtonProps && (
                  <ModalButton variant="ok" {...okButtonProps} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ModalButton({
  label,
  variant,
  className: _className,
  ...rest
}: ButtonProps & { variant: "ok" | "cancel" }) {
  const base =
    "text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-colors cursor-pointer font-mono disabled:opacity-40 disabled:cursor-default";
  const styles =
    variant === "ok"
      ? "text-white border border-zinc-700 hover:border-zinc-500"
      : "text-zinc-500 hover:text-zinc-300";

  return (
    <button className={`${base} ${styles}`} {...rest}>
      {label}
    </button>
  );
}
