import { useEffect, useCallback, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const Dialog: FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } else if (mounted) {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "backdrop transition-all duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-lg bg-white rounded-xl shadow-xl",
          "transition-all duration-200",
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2",
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Close button when no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors z-10 cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
