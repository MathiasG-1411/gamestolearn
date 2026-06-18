"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#2563EB] text-white rounded-[14px] h-12 px-6 hover:bg-[#1D4ED8] shadow-sm hover:shadow-md",
        destructive:
          "bg-red-50 text-red-600 rounded-[14px] h-12 px-6 hover:bg-red-100",
        outline:
          "border border-gray-200 text-[#475569] bg-white rounded-[14px] h-12 px-6 hover:bg-gray-50",
        secondary:
          "border-2 border-[#2563EB] text-[#2563EB] bg-transparent rounded-[14px] h-12 px-6 hover:bg-blue-50",
        ghost:
          "text-[#475569] bg-transparent rounded-[14px] h-12 px-6 hover:bg-gray-100 hover:text-[#0F172A]",
        link: "text-[#2563EB] underline-offset-4 hover:underline h-auto px-0",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-8 rounded-[10px] px-3 text-xs",
        lg: "h-14 rounded-[14px] px-8 text-base",
        icon: "h-9 w-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
