"use client";

import { cn } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
    emptyMessage?: string;
    toolbar?: React.ReactNode;
    loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchable = true,
    searchPlaceholder = "Search...",
    pageSize = 10,
    onRowClick,
    actions,
    emptyMessage = "No data found.",
    toolbar,
    loading = false,
}: DataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    // Filter
    const filtered = data.filter((item) => {
        if (!search) return true;
        return columns.some((col) => {
            const val = item[col.key];
            if (val == null) return false;
            return String(val).toLowerCase().includes(search.toLowerCase());
        });
    });

    // Sort
    const sorted = sortKey
        ? [...filtered].sort((a, b) => {
            const aVal = a[sortKey] ?? "";
            const bVal = b[sortKey] ?? "";
            if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
            return 0;
        })
        : filtered;

    // Paginate
    const totalPages = Math.ceil(sorted.length / pageSize);
    const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {searchable && (
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
                        />
                    </div>
                )}
                {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
            </div>

            {/* Table */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] card-shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))]">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        className={cn(
                                            "text-left px-5 py-3.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider",
                                            col.sortable && "cursor-pointer hover:text-[hsl(var(--foreground))]",
                                            col.className
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.label}
                                            {sortKey === col.key && (
                                                <span className="text-[10px]">
                                                    {sortDir === "asc" ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </span>
                                    </th>
                                ))}
                                {actions && (
                                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(var(--border))]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + (actions ? 1 : 0)}
                                        className="px-5 py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                                Loading...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + (actions ? 1 : 0)}
                                        className="px-5 py-16 text-center text-sm text-[hsl(var(--muted-foreground))]"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((item, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => onRowClick?.(item)}
                                        className={cn(
                                            "transition-colors",
                                            onRowClick && "cursor-pointer hover:bg-[hsl(var(--muted)/0.5)]"
                                        )}
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className={cn("px-5 py-4 text-sm", col.className)}>
                                                {col.render ? col.render(item) : item[col.key] ?? "—"}
                                            </td>
                                        ))}
                                        {actions && (
                                            <td className="px-5 py-4 text-right">{actions(item)}</td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
                            {sorted.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                                const p = start + i;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg text-xs font-semibold transition-colors",
                                            p === page
                                                ? "bg-[hsl(var(--primary))] text-white"
                                                : "hover:bg-[hsl(var(--muted))]"
                                        )}
                                    >
                                        {p + 1}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
