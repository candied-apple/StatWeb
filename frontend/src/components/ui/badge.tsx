import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "scale" | "nominal" | "ordinal";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-slate-900 text-slate-50",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    outline: "text-slate-950 border-slate-200",
    scale: "border-blue-200 bg-blue-50 text-blue-700 font-semibold",
    nominal: "border-purple-200 bg-purple-50 text-purple-700 font-semibold",
    ordinal: "border-amber-200 bg-amber-50 text-amber-700 font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
