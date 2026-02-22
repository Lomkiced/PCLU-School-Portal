import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-hover))] shadow-md shadow-[hsl(var(--primary)/0.25)]",
                secondary:
                    "bg-[hsl(var(--secondary))] text-white hover:opacity-90 shadow-md shadow-[hsl(var(--secondary)/0.25)]",
                destructive:
                    "bg-[hsl(var(--destructive))] text-white hover:opacity-90 shadow-md shadow-[hsl(var(--destructive)/0.25)]",
                outline:
                    "border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
                ghost:
                    "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
                success:
                    "bg-[hsl(var(--success))] text-white hover:opacity-90 shadow-md shadow-[hsl(var(--success)/0.25)]",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-8 px-3 text-xs",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10",
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
    VariantProps<typeof buttonVariants> { }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
