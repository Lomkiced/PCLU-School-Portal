import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href: string;
    active?: boolean;
}

export default function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground pb-2">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center">
                <Home className="w-4 h-4" />
            </Link>
            {items.map((item, index) => (
                <div key={item.href} className="flex items-center space-x-1">
                    <ChevronRight className="w-4 h-4" />
                    {item.active ? (
                        <span className="font-medium text-foreground">{item.label}</span>
                    ) : (
                        <Link href={item.href} className="hover:text-foreground transition-colors">
                            {item.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
