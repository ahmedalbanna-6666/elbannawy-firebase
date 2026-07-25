import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative rounded-2xl transition-shadow duration-300",
  {
    variants: {
      variant: {
        default:
          "border border-neutral-200/70 bg-gradient-to-b from-white to-neutral-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_4px_14px_-2px_rgba(0,0,0,0.04)] dark:border-white/[0.06] dark:bg-gradient-to-b dark:from-[#0f1729] dark:to-[#0d1524] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03),0_1px_3px_0_rgba(0,0,0,0.20),0_6px_20px_-4px_rgba(0,0,0,0.25)]",
        elevated:
          "border border-neutral-100 bg-gradient-to-b from-white to-neutral-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_6px_18px_-3px_rgba(0,0,0,0.05),0_16px_40px_-10px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-[#141e33] dark:to-[#111a2c] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_1px_3px_0_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.30),0_20px_48px_-12px_rgba(0,0,0,0.20)]",
        outline:
          "border-2 border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_4px_14px_-2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-[#0f1729] dark:to-[#0d1524] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03),0_1px_3px_0_rgba(0,0,0,0.20),0_6px_20px_-4px_rgba(0,0,0,0.25)]",
        glass:
          "border border-white/20 bg-gradient-to-b from-white/95 to-neutral-50/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_3px_10px_-1px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-white/10 dark:bg-gradient-to-b dark:from-[rgba(15,23,41,0.75)] dark:to-[rgba(13,21,36,0.85)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_1px_3px_0_rgba(0,0,0,0.20),0_4px_16px_-4px_rgba(0,0,0,0.25)] dark:backdrop-blur-xl",
        gradient:
          "border-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white shadow-[0_2px_8px_-1px_rgba(6,182,212,0.15),0_8px_24px_-4px_rgba(6,182,212,0.10),0_20px_48px_-12px_rgba(6,182,212,0.06)] dark:shadow-[0_2px_8px_-1px_rgba(6,182,212,0.20),0_8px_24px_-4px_rgba(6,182,212,0.15),0_20px_48px_-12px_rgba(0,0,0,0.30)]",
        premium:
          "border border-primary-200/50 bg-gradient-to-b from-white to-neutral-50 shadow-[0_0_0_1px_rgba(6,182,212,0.12),0_2px_8px_-1px_rgba(6,182,212,0.08),0_12px_32px_-10px_rgba(6,182,212,0.12),0_28px_56px_-16px_rgba(6,182,212,0.06)] dark:border-primary-500/20 dark:bg-gradient-to-b dark:from-[#141e33] dark:to-[#111a2c] dark:shadow-[0_0_0_1px_rgba(6,182,212,0.15),0_2px_10px_-1px_rgba(0,0,0,0.25),0_12px_32px_-10px_rgba(0,0,0,0.20),0_28px_60px_-18px_rgba(0,0,0,0.18)]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6",
        xl: "p-8",
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:scale-[1.005]",
          "hover:shadow-[0_2px_8px_-1px_rgba(0,0,0,0.06),0_8px_24px_-4px_rgba(0,0,0,0.08),0_24px_48px_-12px_rgba(0,0,0,0.06)]",
          "active:scale-[0.998]",
          "dark:hover:brightness-110",
          "dark:hover:border-white/[0.12]",
          "dark:hover:shadow-[0_2px_8px_-1px_rgba(0,0,0,0.30),0_8px_24px_-4px_rgba(0,0,0,0.35),0_24px_52px_-12px_rgba(0,0,0,0.25)]",
          "dark:active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_1px_2px_0_rgba(0,0,0,0.20)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  },
);

interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive }), className)}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-4 flex items-center gap-2", className)} {...props} />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardContent, CardFooter, cardVariants };
export type { CardProps };
