import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "destructive" | "info" | "outline";
    className?: string;
}

const variantClasses = {
    default:
        "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]",
    success:
        "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
    warning:
        "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
    destructive:
        "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]",
    info:
        "bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]",
    outline:
        "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
