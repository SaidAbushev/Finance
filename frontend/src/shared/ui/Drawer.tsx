import { useEffect, useCallback, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

export const Drawer: FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
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
      const timer = setTimeout(() => setMounted(false), 300);
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
        "fixed inset-0 z-50",
        "backdrop transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-full bg-white shadow-2xl",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
          width,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {title ?? ""}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
