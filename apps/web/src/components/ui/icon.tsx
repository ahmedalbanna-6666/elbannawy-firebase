import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const iconScale = {
  xs: "h-[var(--icon-xs)] w-[var(--icon-xs)]",
  sm: "h-[var(--icon-sm)] w-[var(--icon-sm)]",
  md: "h-[var(--icon-md)] w-[var(--icon-md)]",
  lg: "h-[var(--icon-lg)] w-[var(--icon-lg)]",
  xl: "h-[var(--icon-xl)] w-[var(--icon-xl)]",
} as const;

interface IconProps extends HTMLAttributes<SVGSVGElement> {
  icon: LucideIcon;
  size?: keyof typeof iconScale;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, size = "md", className, ...props }, ref) => {
    return (
      <LucideIcon
        ref={ref}
        className={cn("shrink-0", iconScale[size], className)}
        {...props}
      />
    );
  },
);

Icon.displayName = "Icon";

export { Icon, iconScale };
export type { IconProps };
