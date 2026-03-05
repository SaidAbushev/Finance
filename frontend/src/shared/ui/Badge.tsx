import type { FC, ReactNode } from "react";
import { cn } from "../lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-indigo-50 text-indigo-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
};

export const Badge: FC<BadgeProps> = ({
  variant = "default",
  children,
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
