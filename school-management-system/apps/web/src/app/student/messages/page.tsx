"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useWebSocket, IncomingMessage } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Search,
    Send,
    Paperclip,
    Plus,
    MessageSquare,
    Users,
    Megaphone,
    Wifi,
    WifiOff,
    Loader2,
    ArrowLeft,
    CheckCheck,
    Check,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
    firstName: string;
    lastName: string;
}

interface UserInfo {
    id: string;
    email: string;
    role: string;
    profilePicture?: string | null;
    studentProfile?: UserProfile | null;
    teacherProfile?: UserProfile | null;
    adminProfile?: UserProfile | null;
    parentProfile?: UserProfile | null;
}

interface Participant {
    id: string;
    userId: string;
    conversationId: string;
    role: string;
    lastReadAt: string;
    user: UserInfo;
}

interface MessageData {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrl?: string | null;
    isDeleted: boolean;
    createdAt: string;
    sender: UserInfo;
}

interface Conversation {
    id: string;
    title?: string | null;
    type: "DIRECT" | "GROUP" | "ANNOUNCEMENT";
    participants: Participant[];
    messages: MessageData[];
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Animations ──────────────────────────────────────────────────────────────────

const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const listVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const chatVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserDisplayName(user: UserInfo): string {
    const profile =
        user.studentProfile ||
        user.teacherProfile ||
        user.adminProfile ||
        user.parentProfile;
    if (profile) return `${profile.firstName} ${profile.lastName}`;
    return user.email.split("@")[0];
}

function getUserInitials(user: UserInfo): string {
    const profile =
        user.studentProfile ||
        user.teacherProfile ||
        user.adminProfile ||
        user.parentProfile;
    if (profile) {
        return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
}

function getRoleBadgeColor(role: string): string {
    switch (role) {
        case "ADMIN":
            return "bg-red-500/15 text-red-500 border-red-500/20";
        case "TEACHER":
            return "bg-blue-500/15 text-blue-500 border-blue-500/20";
        case "STUDENT":
            return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
        case "PARENT":
            return "bg-amber-500/15 text-amber-500 border-amber-500/20";
        default:
            return "bg-gray-500/15 text-gray-500 border-gray-500/20";
    }
}

function getConversationIcon(type: string) {
    switch (type) {
        case "GROUP":
            return Users;
        case "ANNOUNCEMENT":
            return Megaphone;
        default:
            return MessageSquare;
    }
}

function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
}

function formatFullTime(dateStr: string): string {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
    return format(date, "MMM d, yyyy h:mm a");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudentMessagesPage() {
    const { user } = useAuthStore();
    const {
        isConnected,
        sendMessage: wsSendMessage,
        joinConversation,
        markAsRead: wsMarkAsRead,
        onMessage,
    } = useWebSocket();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    const [newMsgOpen, setNewMsgOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<UserInfo[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data.data);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        const unsubscribe = onMessage("__all__", () => {
            fetchConversations();
        });
        return unsubscribe;
    }, [onMessage, fetchConversations]);

    useEffect(() => {
        if (!activeConversation) return;

        const unsubscribe = onMessage(activeConversation.id, (msg: IncomingMessage) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg as MessageData];
            });
            // Immediately mark as read to prevent unread ghosting
            wsMarkAsRead(activeConversation.id);
        });

        return unsubscribe;
    }, [activeConversation, onMessage, wsMarkAsRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectConversation = useCallback(
        async (conv: Conversation) => {
            setActiveConversation(conv);
            setIsLoadingMessages(true);
            setShowMobileChat(true);

            joinConversation(conv.id);
            wsMarkAsRead(conv.id);

            try {
                await api.patch(`/messages/conversations/${conv.id}/read`);
            } catch { }

            try {
                const res = await api.get(`/messages/conversations/${conv.id}`);
                setMessages(res.data.data.messages);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoadingMessages(false);
            }

            setConversations((prev) =>
                prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
            );
        },
        [joinConversation, wsMarkAsRead]
    );

    const handleSendMessage = useCallback(async () => {
        if (!messageInput.trim() || !activeConversation || isSending) return;

        const content = messageInput.trim();
        setMessageInput("");
        setIsSending(true);

        try {
            wsSendMessage(activeConversation.id, content);
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessageInput(content);
        } finally {
            setIsSending(false);
        }
    }, [messageInput, activeConversation, isSending, wsSendMessage]);

    useEffect(() => {
        if (userSearchQuery.length < 2) {
            setUserSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(
                    `/messages/users/search?q=${encodeURIComponent(userSearchQuery)}`
                );
                // For STU, ideally filter down to TEACHERS on backend constraint or highlight here.
                const results = res.data.data;
                setUserSearchResults(results);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [userSearchQuery]);

    const startDirectMessage = useCallback(
        async (recipientId: string) => {
            setNewMsgOpen(false);
            setUserSearchQuery("");
            setUserSearchResults([]);

            try {
                const res = await api.post("/messages/conversations/direct", {
                    recipientId,
                });
                const conv = res.data.data as Conversation;

                setConversations((prev) => {
                    const exists = prev.find((c) => c.id === conv.id);
                    if (exists) return prev;
                    return [{ ...conv, unreadCount: 0 }, ...prev];
                });

                selectConversation({ ...conv, unreadCount: 0 });
            } catch (error: any) {
                console.error("Failed to start DM:", error);
                alert(error.response?.data?.message || "Failed to start direct message");
            }
        },
        [selectConversation]
    );

    const getConversationDisplayName = useCallback(
        (conv: Conversation) => {
            if (conv.title) return conv.title;
            if (conv.type === "DIRECT") {
                const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
                return otherParticipant ? getUserDisplayName(otherParticipant.user) : "Direct Message";
            }
            return "Group Chat";
        },
        [user?.id]
    );

    const getConversationAvatar = useCallback(
        (conv: Conversation) => {
            if (conv.type === "DIRECT") {
                const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
                return otherParticipant?.user || null;
            }
            return null;
        },
        [user?.id]
    );

    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const name = getConversationDisplayName(conv).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="flex h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-[hsl(var(--border))] bg-background/40 backdrop-blur-2xl shadow-2xl shadow-[hsl(var(--secondary))]/5"
        >
            {/* ─── Inbox Sidebar ─────────────────────────────────────────────── */}
            <div
                className={cn(
                    "w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] bg-card/30",
                    showMobileChat && "hidden md:flex"
                )}
            >
                {/* Header Section */}
                <div className="p-5 border-b border-[hsl(var(--border))] space-y-4 bg-card/20 backdrop-blur-sm z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white rounded-xl shadow-lg">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Messages</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shadow-sm",
                                    isConnected
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                        : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                )}
                            >
                                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                {isConnected ? "Live" : "Offline"}
                            </div>
                            <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white shadow-md transition-transform hover:scale-105"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px] border-[hsl(var(--border))] bg-background/80 backdrop-blur-3xl p-0 overflow-hidden rounded-3xl">
                                    <div className="p-6 bg-gradient-to-b from-card/50 to-background/50">
                                        <DialogHeader className="mb-4">
                                            <DialogTitle className="text-xl font-bold">New Message</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-[hsl(var(--secondary))] transition-colors" />
                                                </div>
                                                <Input
                                                    placeholder="Search for your teachers..."
                                                    className="pl-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-[hsl(var(--secondary))] focus:ring-[hsl(var(--secondary))]/20 rounded-2xl transition-all"
                                                    value={userSearchQuery}
                                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <ScrollArea className="h-[320px] rounded-2xl bg-card/30 border border-muted-foreground/10 p-2">
                                                {isSearching ? (
                                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--secondary))]" />
                                                        <p className="text-sm font-medium text-muted-foreground">Searching Directory...</p>
                                                    </div>
                                                ) : userSearchResults.length === 0 && userSearchQuery.length >= 2 ? (
                                                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                                                        <Search className="w-8 h-8 text-muted-foreground/30" />
                                                        <p className="text-sm font-medium text-muted-foreground">No matches found</p>
                                                    </div>
                                                ) : (
                                                    <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-1">
                                                        {userSearchResults.filter(u => u.role === 'TEACHER').map((u) => (
                                                            <motion.button
                                                                variants={itemVariants}
                                                                key={u.id}
                                                                onClick={() => startDirectMessage(u.id)}
                                                                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-background/80 hover:shadow-sm focus:bg-background/80 transition-all text-left group"
                                                            >
                                                                <Avatar className="h-10 w-10 border border-muted-foreground/20 group-hover:border-[hsl(var(--secondary))]/50 transition-colors">
                                                                    {u.profilePicture && <AvatarImage src={u.profilePicture} />}
                                                                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white">
                                                                        {getUserInitials(u)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                                                                        {getUserDisplayName(u)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground truncate font-medium">
                                                                        {u.email}
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={cn(
                                                                        "text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border",
                                                                        getRoleBadgeColor(u.role)
                                                                    )}
                                                                >
                                                                    {u.role}
                                                                </span>
                                                            </motion.button>
                                                        ))}
                                                        {userSearchQuery.length >= 2 && userSearchResults.filter(u => u.role === 'TEACHER').length === 0 && (
                                                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                                                                <p className="text-sm font-medium text-muted-foreground">No teachers found matching "{userSearchQuery}"</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                        </div>
                        <Input
                            placeholder="Search your conversations..."
                            className="pl-9 bg-card/50 border-muted-foreground/20 focus:border-[hsl(var(--primary))] hover:bg-background/50 rounded-xl transition-all h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1 px-3 py-3">
                    {isLoadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--secondary))]" />
                            <p className="text-sm font-medium animate-pulse text-muted-foreground">Syncing inbox...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 px-6 text-center"
                        >
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-muted to-muted/50 flex items-center justify-center mb-6 shadow-inner">
                                <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Your Inbox is Empty</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                                When your teachers send messages or you join class groups, they'll appear right here.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-1.5">
                            {filteredConversations.map((conv) => {
                                const isActive = activeConversation?.id === conv.id;
                                const avatarUser = getConversationAvatar(conv);
                                const ConvIcon = getConversationIcon(conv.type);
                                const lastMsg = conv.messages[0];
                                const hasUnread = conv.unreadCount > 0;

                                return (
                                    <motion.button
                                        variants={itemVariants}
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={cn(
                                            "group flex items-center gap-3.5 w-full px-3.5 py-3 rounded-2xl transition-all text-left relative overflow-hidden",
                                            isActive
                                                ? "bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--secondary))]/5 border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                                                : "hover:bg-background/60 hover:shadow-sm bg-transparent border-transparent"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-nav-indicator"
                                                className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(var(--primary))]"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        <div className="relative flex-shrink-0">
                                            <Avatar className={cn(
                                                "h-12 w-12 transition-transform duration-300",
                                                isActive ? "ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-background/50 scale-105" : "group-hover:scale-105"
                                            )}>
                                                {avatarUser?.profilePicture && <AvatarImage src={avatarUser.profilePicture} />}
                                                <AvatarFallback
                                                    className={cn(
                                                        "text-sm font-bold shadow-inner",
                                                        conv.type === "DIRECT"
                                                            ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white"
                                                            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                                                    )}
                                                >
                                                    {avatarUser ? getUserInitials(avatarUser) : <ConvIcon className="w-6 h-6 opacity-90" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            {hasUnread && (
                                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full border-2 border-background flex items-center justify-center shadow-md animate-in zoom-in">
                                                    <span className="text-[10px] font-black text-white ml-[0.5px]">
                                                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p
                                                    className={cn(
                                                        "text-[15px] truncate transition-colors",
                                                        hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground/80",
                                                        isActive && "text-[hsl(var(--primary))]"
                                                    )}
                                                >
                                                    {getConversationDisplayName(conv)}
                                                </p>
                                                {lastMsg && (
                                                    <span className={cn(
                                                        "text-[11px] whitespace-nowrap font-medium",
                                                        hasUnread ? "text-[hsl(var(--primary))] font-bold" : "text-muted-foreground/70"
                                                    )}>
                                                        {formatMessageTime(lastMsg.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMsg && (
                                                <p
                                                    className={cn(
                                                        "text-[13px] truncate line-clamp-1 break-all",
                                                        hasUnread ? "text-foreground font-semibold" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <span className="opacity-70 mr-1">
                                                        {lastMsg.senderId === user?.id ? "You:" : ""}
                                                    </span>
                                                    {lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </ScrollArea>
            </div>

            {/* ─── Active Chat Area ─────────────────────────────────────────── */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 relative bg-background/20",
                    !showMobileChat && "hidden md:flex"
                )}
            >
                {activeConversation ? (
                    <>
                        {/* Chat Header Backdrop */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-card/80 to-transparent pointer-events-none z-0" />

                        {/* Chat Header */}
                        <div className="relative z-10 flex items-center gap-4 px-6 py-4 border-b border-[hsl(var(--border))]/50 bg-card/40 backdrop-blur-xl">
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="md:hidden p-2 -ml-2 rounded-xl bg-background/50 hover:bg-background border border-muted-foreground/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            {(() => {
                                const avatarUser = getConversationAvatar(activeConversation);
                                const ConvIcon = getConversationIcon(activeConversation.type);
                                return (
                                    <Avatar className="h-12 w-12 shadow-sm border border-muted-foreground/10">
                                        {avatarUser?.profilePicture && <AvatarImage src={avatarUser.profilePicture} />}
                                        <AvatarFallback
                                            className={cn(
                                                "text-sm font-bold",
                                                activeConversation.type === "DIRECT"
                                                    ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white"
                                                    : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
                                            )}
                                        >
                                            {avatarUser ? getUserInitials(avatarUser) : <ConvIcon className="w-6 h-6" />}
                                        </AvatarFallback>
                                    </Avatar>
                                );
                            })()}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-foreground truncate tracking-tight">
                                    {getConversationDisplayName(activeConversation)}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    {activeConversation.type === "DIRECT" ? (
                                        <span className="text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded-md">
                                            Teacher Connection
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {activeConversation.participants.length} Members
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Message Feed */}
                        <ScrollArea className="flex-1 relative z-0">
                            <div className="px-6 py-6 pb-20 space-y-2">
                                {isLoadingMessages ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Decrypting history...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                                        <div className="w-24 h-24 rounded-[3rem] bg-[hsl(var(--primary))]/5 flex items-center justify-center mb-6">
                                            <MessageSquare className="w-10 h-10 text-[hsl(var(--primary))]/50" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">Start the Conversation</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                                            Say hello and introduce yourself. Messages are strictly monitored for educational purposes.
                                        </p>
                                    </div>
                                ) : (
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, index) => {
                                            const isMe = msg.senderId === user?.id;
                                            const prevMsg = index > 0 ? messages[index - 1] : null;
                                            const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                                            const showTimestamp = !prevMsg || new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000;

                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    variants={chatVariants}
                                                    initial="hidden"
                                                    animate="show"
                                                    layout="position"
                                                >
                                                    {showTimestamp && (
                                                        <div className="flex items-center justify-center my-6">
                                                            <div className="px-4 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-muted-foreground/10 text-xs font-medium text-muted-foreground/80 shadow-sm">
                                                                {formatFullTime(msg.createdAt)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={cn(
                                                        "flex gap-3 max-w-[85%] md:max-w-[75%] lg:max-w-[65%]",
                                                        isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                                                        !showAvatar && (isMe ? "mb-1" : "mb-1")
                                                    )}>
                                                        {/* Avatar Logic */}
                                                        {!isMe ? (
                                                            showAvatar ? (
                                                                <Avatar className="h-8 w-8 mt-1 flex-shrink-0 shadow-sm select-none border border-muted-foreground/20">
                                                                    {msg.sender.profilePicture && <AvatarImage src={msg.sender.profilePicture} />}
                                                                    <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                                                                        {getUserInitials(msg.sender)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="w-8 flex-shrink-0" />
                                                            )
                                                        ) : null}

                                                        <div className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}>
                                                            {!isMe && showAvatar && (
                                                                <span className="text-xs font-semibold text-muted-foreground ml-1 mb-1 shadow-sm">
                                                                    {getUserDisplayName(msg.sender)}
                                                                </span>
                                                            )}
                                                            <div
                                                                className={cn(
                                                                    "px-4 py-2.5 rounded-[1.25rem] text-[15px] leading-relaxed relative isolate break-words min-w-0 shadow-sm transition-shadow hover:shadow-md",
                                                                    isMe
                                                                        ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white rounded-br-sm"
                                                                        : "bg-card border border-muted-foreground/10 text-foreground rounded-bl-sm",
                                                                    !showAvatar && (isMe ? "rounded-tr-sm" : "rounded-tl-sm")
                                                                )}
                                                            >
                                                                {msg.content}

                                                                {/* Optional Subtle Read Receipt for 'Me' */}
                                                                {isMe && (
                                                                    <div className="absolute bottom-1 -right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                        </ScrollArea>

                        {/* Compose Area Setup */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 z-20 pointer-events-none">
                            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-card/80 backdrop-blur-2xl rounded-[1.5rem] p-2 border border-[hsl(var(--border))] shadow-lg shadow-black/5 pointer-events-auto transition-all focus-within:shadow-[hsl(var(--primary))]/10 focus-within:border-[hsl(var(--primary))]/30">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-[hsl(var(--primary))]/10 hover:text-[hsl(var(--primary))] transition-colors"
                                    title="Attach media (Coming Soon)"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <textarea
                                    className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent py-2.5 px-3 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none border-none border-0 ring-0 text-foreground custom-scrollbar"
                                    rows={1}
                                    placeholder="Type your message..."
                                    value={messageInput}
                                    onChange={(e) => {
                                        setMessageInput(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                            // Reset height
                                            (e.target as HTMLTextAreaElement).style.height = 'auto';
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSending}
                                    className={cn(
                                        "h-10 w-10 shrink-0 rounded-full transition-all flex items-center justify-center",
                                        messageInput.trim() && !isSending
                                            ? "bg-[hsl(var(--primary))] text-white shadow-md hover:bg-[hsl(var(--primary))]/90 hover:scale-105"
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background/30 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="relative w-40 h-40 mb-8 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 rounded-[3rem] blur-2xl animate-pulse" />
                            <div className="relative w-24 h-24 bg-card/80 backdrop-blur-md rounded-[2.5rem] border border-white/10 dark:border-white/5 flex items-center justify-center shadow-xl">
                                <MessageSquare className="w-10 h-10 text-[hsl(var(--primary))]" />
                            </div>
                        </motion.div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">Connect and Collaborate</h2>
                        <p className="max-w-md text-[15px] text-muted-foreground/80 leading-relaxed font-medium">
                            Select a conversation from the sidebar to start corresponding with your instructors and classmates instantly.
                        </p>
                    </div>
                )}
            </div>

            {/* Global CSS enhancements just for this component */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.3);
                    border-radius: 4px;
                }
                `}} />
        </motion.div>
    );
}
