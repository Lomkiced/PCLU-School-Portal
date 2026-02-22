import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}

export function StatCard({ label, value, change, icon, color, subtitle }: StatCardProps) {
    const isPositive = change?.startsWith("+");
    return (
        <div className="bg-[hsl(var(--card))] rounded-2xl p-5 card-shadow border border-[hsl(var(--border))] group hover:card-shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>
                    )}
                </div>
                <div
                    className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    )}
                    style={{
                        background: `hsl(${color} / 0.12)`,
                        color: `hsl(${color})`,
                    }}
                >
                    {icon}
                </div>
            </div>
            {change && (
                <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                    <span
                        className={cn(
                            "text-xs font-semibold",
                            isPositive ? "text-[hsl(var(--success))]" : "text-[hsl(var(--destructive))]"
                        )}
                    >
                        {change}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">vs last month</span>
                </div>
            )}
        </div>
    );
}
