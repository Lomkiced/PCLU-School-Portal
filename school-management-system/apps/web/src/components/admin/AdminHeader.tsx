"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Menu, Bell, Search, User, LogOut } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
    setMobileOpen: (open: boolean) => void;
}

export function AdminHeader({ setMobileOpen }: AdminHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const mainContent = document.getElementById("main-scroll-area");
            if (mainContent) {
                setScrolled(mainContent.scrollTop > 10);
            }
        };
        const mainContent = document.getElementById("main-scroll-area");
        if (mainContent) {
            mainContent.addEventListener("scroll", handleScroll);
        }
        return () => {
            if (mainContent) {
                mainContent.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    // Generate dynamic breadcrumbs from pathname
    const paths = pathname.split("/").filter(Boolean);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <header
            className={`sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6 transition-colors duration-300 ${scrolled
                    ? "bg-[hsl(var(--card))]/80 backdrop-blur-md border-[hsl(var(--border))]"
                    : "bg-[hsl(var(--card))] border-transparent"
                }`}
        >
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>

                <Breadcrumb className="hidden sm:flex ml-2">
                    <BreadcrumbList>
                        {paths.map((path, index) => {
                            const href = `/${paths.slice(0, index + 1).join("/")}`;
                            const isLast = index === paths.length - 1;
                            const label = path
                                .split("-")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ");

                            return (
                                <React.Fragment key={path}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage className="font-semibold text-foreground">
                                                {label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                                                {label}
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </React.Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Search Bar / Command Palette Trigger */}
                <Button
                    variant="outline"
                    className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-background/50 hidden md:inline-flex"
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline-flex">Search...</span>
                    <span className="inline-flex lg:hidden">Search</span>
                    <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>

                {/* Mobile Search Icon */}
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Search className="h-5 w-5" />
                </Button>

                {/* Notification Bell Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <span className="sr-only">Toggle notifications</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0 shadow-lg border-[hsl(var(--border))]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
                            <h4 className="text-sm font-semibold">Notifications</h4>
                            <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">3 unread</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {/* Dummy Transactions */}
                            <div className="px-4 py-3 border-b border-[hsl(var(--border))] hover:bg-muted/50 transition-colors cursor-pointer group">
                                <p className="text-sm font-medium group-hover:text-[hsl(var(--primary))] transition-colors">Invoice #1024 Paid</p>
                                <p className="text-xs text-muted-foreground mt-1">John Doe completed payment of ₱15,000 via Bank Transfer</p>
                                <p className="text-[10px] text-muted-foreground mt-2">2 minutes ago</p>
                            </div>
                            <div className="px-4 py-3 border-b border-[hsl(var(--border))] hover:bg-muted/50 transition-colors cursor-pointer group">
                                <p className="text-sm font-medium group-hover:text-[hsl(var(--primary))] transition-colors">New Student Enrolled</p>
                                <p className="text-xs text-muted-foreground mt-1">Jane Smith registered for Grade 12 STEM</p>
                                <p className="text-[10px] text-muted-foreground mt-2">1 hour ago</p>
                            </div>
                            <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                                <p className="text-sm font-medium">System Update</p>
                                <p className="text-xs text-muted-foreground mt-1">Maintenance scheduled for tonight at 12AM.</p>
                                <p className="text-[10px] text-muted-foreground mt-2">Yesterday</p>
                            </div>
                        </div>
                        <div className="p-2 border-t border-[hsl(var(--border))] text-center">
                            <Button variant="ghost" size="sm" className="w-full text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]">
                                View all notifications
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="hidden sm:block w-px h-6 bg-[hsl(var(--border))]" />

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden hover:ring-2 hover:ring-[hsl(var(--primary)/0.2)] transition-all">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-[hsl(var(--primary))] text-primary-foreground font-bold text-sm">
                                {user?.email?.[0]?.toUpperCase() || "A"}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-foreground">Administrator</p>
                                <p className="text-xs leading-none text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notification Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50 transition-colors"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
