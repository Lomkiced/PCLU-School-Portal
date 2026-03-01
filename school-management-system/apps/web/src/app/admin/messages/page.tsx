"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useChat, IncomingMessage } from "@/hooks/use-chat";
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
    MoreVertical
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

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
            return "bg-red-500/15 text-red-400 border-red-500/20";
        case "TEACHER":
            return "bg-blue-500/15 text-blue-400 border-blue-500/20";
        case "STUDENT":
            return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
        case "PARENT":
            return "bg-amber-500/15 text-amber-400 border-amber-500/20";
        default:
            return "bg-gray-500/15 text-gray-400 border-gray-500/20";
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

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { isConnected, sendMessage, joinConversation, markAsRead } = useChat(user?.id);

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // New Message Dialog
    const [newMsgOpen, setNewMsgOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<UserInfo[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // ─── React Query: Fetch Conversations ─────────────────────────────────
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await api.get("/messages/conversations");
            return res.data.data as Conversation[];
        }
    });

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    // ─── React Query: Fetch Active Chat Messages ──────────────────────────
    const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
        queryKey: ["messages", activeConversationId],
        queryFn: async () => {
            if (!activeConversationId) return { messages: [] };
            const res = await api.get(`/messages/conversations/${activeConversationId}`);
            return res.data.data;
        },
        enabled: !!activeConversationId,
    });

    // Determine the array of messages to render
    // `messagesData` comes from REST API typically as `{ messages: MessageData[], nextCursor }`
    // Alternatively if WS injcts directly it could be structured as an array, so normalize it:
    let messages: MessageData[] = [];
    if (messagesData) {
        if (Array.isArray(messagesData)) {
            messages = messagesData;
        } else if (messagesData.pages && messagesData.pages.length > 0) {
            // If using useInfiniteQuery elsewhere or injected as pages
            messages = messagesData.pages.flatMap((p: any) => p.messages).reverse();
        } else if (messagesData.messages) {
            messages = messagesData.messages;
        }
    }

    // ─── Auto-scroll to Bottom ────────────────────────────────────────────────
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ─── Select Conversation ──────────────────────────────────────────────────
    const selectConversation = useCallback((conv: Conversation) => {
        setActiveConversationId(conv.id);
        setShowMobileChat(true);

        joinConversation(conv.id);
        markAsRead(conv.id);

        // Optimistically mark read in REST
        api.patch(`/messages/conversations/${conv.id}/read`).catch(console.error);
    }, [joinConversation, markAsRead]);

    // ─── Send Message ─────────────────────────────────────────────────────────
    const handleSendMessage = useCallback(async () => {
        if (!messageInput.trim() || !activeConversationId || isSending) return;

        const content = messageInput.trim();
        setMessageInput("");
        setIsSending(true);

        try {
            sendMessage(activeConversationId, content);
            // It might take a moment for the WS to broadcast it back. We rely on useChat's onMessage
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessageInput(content);
        } finally {
            setIsSending(false);
        }
    }, [messageInput, activeConversationId, isSending, sendMessage]);

    // ─── New Message: Search Users ────────────────────────────────────────────
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
                setUserSearchResults(res.data.data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [userSearchQuery]);

    // ─── New Message: Start DM ────────────────────────────────────────────────
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

                // Update react query cache if needed, or simply invalidate
                queryClient.invalidateQueries({ queryKey: ["conversations"] });

                selectConversation(conv);
            } catch (error: any) {
                console.error("Failed to start DM:", error);
                if (error.response?.data) {
                    console.error("Backend Error Response:", error.response.data);
                }
            }
        },
        [queryClient, selectConversation]
    );

    // ─── Get Display Name for Conversation ────────────────────────────────────
    const getConversationDisplayName = useCallback(
        (conv: Conversation) => {
            if (conv.title) return conv.title;
            if (conv.type === "DIRECT") {
                const otherParticipant = conv.participants.find(
                    (p) => p.userId !== user?.id
                );
                return otherParticipant
                    ? getUserDisplayName(otherParticipant.user)
                    : "Direct Message";
            }
            return "Group Chat";
        },
        [user?.id]
    );

    const getConversationAvatar = useCallback(
        (conv: Conversation) => {
            if (conv.type === "DIRECT") {
                const otherParticipant = conv.participants.find(
                    (p) => p.userId !== user?.id
                );
                return otherParticipant?.user || null;
            }
            return null;
        },
        [user?.id]
    );

    // ─── Filtered & Sorted Conversations ──────────────────────────────────────
    const processedConversations = [...conversations]
        .filter((conv) => {
            if (!searchQuery.trim()) return true;
            const name = getConversationDisplayName(conv).toLowerCase();
            return name.includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            const dateA = a.messages?.[0]?.createdAt || a.updatedAt || a.createdAt;
            const dateB = b.messages?.[0]?.createdAt || b.updatedAt || b.createdAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl">
            {/* ─── Left Sidebar (Inbox) ─────────────────────────────────────── */}
            <div
                className={cn(
                    "w-full md:w-[380px] lg:w-[400px] flex-shrink-0 flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]",
                    showMobileChat && "hidden md:flex"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-[hsl(var(--border))] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl tracking-tight font-bold">Command Center</h2>
                            <div
                                className={cn(
                                    "flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                    isConnected
                                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                        : "bg-red-500/15 text-red-500 border border-red-500/30"
                                )}
                            >
                                {isConnected ? (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-3 h-3" /> Offline
                                    </>
                                )}
                            </div>
                        </div>
                        <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-xl shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Note
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Start New Message</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 pt-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search directory by name or email..."
                                            className="pl-9"
                                            value={userSearchQuery}
                                            onChange={(e) =>
                                                setUserSearchQuery(e.target.value)
                                            }
                                            autoFocus
                                        />
                                    </div>
                                    <ScrollArea className="h-[300px]">
                                        {isSearching && (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                        {!isSearching &&
                                            userSearchResults.length === 0 &&
                                            userSearchQuery.length >= 2 && (
                                                <p className="text-center text-sm text-muted-foreground py-8">
                                                    No users found in directory
                                                </p>
                                            )}
                                        {!isSearching &&
                                            userSearchResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => startDirectMessage(u.id)}
                                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                                                >
                                                    <Avatar className="h-9 w-9 border border-[hsl(var(--border))]">
                                                        {u.profilePicture && (
                                                            <AvatarImage src={u.profilePicture} />
                                                        )}
                                                        <AvatarFallback className="text-xs font-semibold bg-[hsl(var(--primary))] text-white">
                                                            {getUserInitials(u)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-semibold truncate leading-tight">
                                                            {getUserDisplayName(u)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border shadow-sm",
                                                            getRoleBadgeColor(u.role)
                                                        )}
                                                    >
                                                        {u.role}
                                                    </span>
                                                </button>
                                            ))}
                                    </ScrollArea>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Find a conversation..."
                            className="pl-9 bg-[hsl(var(--muted))]/50 border-transparent focus:border-[hsl(var(--primary))] rounded-xl shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1 bg-[hsl(var(--background))]">
                    {isLoadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : processedConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-semibold text-muted-foreground">
                                Inbox Zero
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">
                                Your command center is quiet. Start a new message to coordinate.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {processedConversations.map((conv) => {
                                const isActive = activeConversationId === conv.id;
                                const avatarUser = getConversationAvatar(conv);
                                const ConvIcon = getConversationIcon(conv.type);
                                const lastMsg = conv.messages[0];
                                const hasUnread = conv.unreadCount > 0;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={cn(
                                            "flex items-center gap-3 w-full px-4 py-3.5 transition-all text-left border-b border-[hsl(var(--border))]/40 last:border-0",
                                            isActive
                                                ? "bg-[hsl(var(--primary))]/5 !border-l-[3px] !border-l-[hsl(var(--primary))] !pl-[13px]"
                                                : "hover:bg-[hsl(var(--muted))]/60 border-l-[3px] border-l-transparent"
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-11 w-11 border border-[hsl(var(--border))]/50">
                                                {avatarUser?.profilePicture && (
                                                    <AvatarImage
                                                        src={avatarUser.profilePicture}
                                                    />
                                                )}
                                                <AvatarFallback
                                                    className={cn(
                                                        "text-sm font-bold shadow-sm",
                                                        conv.type === "DIRECT"
                                                            ? "bg-[hsl(var(--primary))] text-white"
                                                            : "bg-violet-600/90 text-white"
                                                    )}
                                                >
                                                    {avatarUser ? (
                                                        getUserInitials(avatarUser)
                                                    ) : (
                                                        <ConvIcon className="w-5 h-5" />
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            {hasUnread && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[hsl(var(--card))] shadow-sm flex items-center justify-center animate-in zoom-in">
                                                    <span className="text-[9px] font-bold text-white leading-none pb-[1px]">
                                                        {conv.unreadCount > 9
                                                            ? "9+"
                                                            : conv.unreadCount}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-[15px] truncate tracking-tight",
                                                        hasUnread
                                                            ? "font-bold text-foreground"
                                                            : "font-semibold text-foreground/90"
                                                    )}
                                                >
                                                    {getConversationDisplayName(conv)}
                                                </p>
                                                {lastMsg && (
                                                    <span className="text-xs font-medium text-muted-foreground/70 whitespace-nowrap">
                                                        {formatMessageTime(lastMsg.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMsg && (
                                                <p
                                                    className={cn(
                                                        "text-[13px] truncate mt-0.5",
                                                        hasUnread
                                                            ? "text-foreground font-semibold"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {lastMsg.senderId === user?.id
                                                        ? "You: "
                                                        : ""}
                                                    {lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* ─── Right Pane (Active Chat) ─────────────────────────────────── */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 bg-[hsl(var(--background))]/50",
                    !showMobileChat && "hidden md:flex"
                )}
            >
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm z-10">
                            <button
                                onClick={() => setShowMobileChat(false)}
                                className="md:hidden p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            {(() => {
                                const avatarUser =
                                    getConversationAvatar(activeConversation);
                                const ConvIcon = getConversationIcon(
                                    activeConversation.type
                                );
                                return (
                                    <Avatar className="h-10 w-10 border border-[hsl(var(--border))]/50 shadow-sm">
                                        {avatarUser?.profilePicture && (
                                            <AvatarImage
                                                src={avatarUser.profilePicture}
                                            />
                                        )}
                                        <AvatarFallback
                                            className={cn(
                                                "text-sm font-bold",
                                                activeConversation.type === "DIRECT"
                                                    ? "bg-[hsl(var(--primary))] text-white"
                                                    : "bg-violet-600/90 text-white"
                                            )}
                                        >
                                            {avatarUser ? (
                                                getUserInitials(avatarUser)
                                            ) : (
                                                <ConvIcon className="w-5 h-5" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                );
                            })()}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold tracking-tight truncate">
                                    {getConversationDisplayName(activeConversation)}
                                </h3>
                                {activeConversation.type === "DIRECT" && (
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {(() => {
                                            const other =
                                                activeConversation.participants.find(
                                                    (p) => p.userId !== user?.id
                                                );
                                            return other
                                                ? `${other.user.role} · ${other.user.email}`
                                                : "";
                                        })()}
                                    </p>
                                )}
                                {activeConversation.type !== "DIRECT" && (
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {activeConversation.participants.length} members
                                    </p>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Message Feed */}
                        <ScrollArea className="flex-1" ref={messagesContainerRef}>
                            <div className="px-4 md:px-6 py-6 space-y-1.5">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4 transform -rotate-6 shadow-sm border border-[hsl(var(--primary))]/20">
                                            <MessageSquare className="w-8 h-8 text-[hsl(var(--primary))]" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground">Begin Communication</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                            Messages via the Command Hub are highly secure and delivered in real-time.
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMe = msg.senderId === user?.id;
                                        const prevMsg =
                                            index > 0 ? messages[index - 1] : null;
                                        const showAvatar =
                                            !prevMsg ||
                                            prevMsg.senderId !== msg.senderId;
                                        const showTimestamp =
                                            !prevMsg ||
                                            new Date(msg.createdAt).getTime() -
                                            new Date(prevMsg.createdAt).getTime() >
                                            300000; // 5 min gap

                                        return (
                                            <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                                                {showTimestamp && (
                                                    <div className="flex items-center justify-center my-5">
                                                        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase bg-[hsl(var(--muted))]/80 border border-[hsl(var(--border))]/50 px-3.5 py-1 rounded-full shadow-sm">
                                                            {formatFullTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={cn(
                                                        "flex gap-2.5 max-w-[85%] md:max-w-[75%]",
                                                        isMe
                                                            ? "ml-auto flex-row-reverse"
                                                            : "mr-auto"
                                                    )}
                                                >
                                                    {!isMe && showAvatar ? (
                                                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0 shadow-sm border border-[hsl(var(--border))]/50">
                                                            {msg.sender.profilePicture && (
                                                                <AvatarImage
                                                                    src={
                                                                        msg.sender.profilePicture
                                                                    }
                                                                />
                                                            )}
                                                            <AvatarFallback className="text-[11px] font-bold bg-[hsl(var(--muted))]">
                                                                {getUserInitials(msg.sender)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : !isMe ? (
                                                        <div className="w-8 flex-shrink-0" />
                                                    ) : null}
                                                    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                                        {!isMe && showAvatar && (
                                                            <div className="flex items-center gap-1.5 mb-1 pl-1">
                                                                <p className="text-[12px] font-bold text-foreground/80">
                                                                    {getUserDisplayName(msg.sender)}
                                                                </p>
                                                                {msg.sender.role === 'ADMIN' && (
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 rounded-sm">Admin</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div
                                                            className={cn(
                                                                "px-4 py-2.5 text-[14.5px] leading-relaxed break-words shadow-sm",
                                                                isMe
                                                                    ? "bg-[hsl(var(--primary))] text-white rounded-2xl rounded-tr-md shadow-[0_2px_10px_rgba(var(--primary),0.2)]"
                                                                    : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-foreground rounded-2xl rounded-tl-md"
                                                            )}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                        {msg.attachmentUrl && (
                                                            <a
                                                                href={msg.attachmentUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "flex items-center gap-1.5 text-xs mt-1.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all",
                                                                    isMe
                                                                        ? "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20"
                                                                        : "bg-background border-[hsl(var(--border))] text-muted-foreground hover:bg-[hsl(var(--muted))]"
                                                                )}
                                                            >
                                                                <Paperclip className="w-3.5 h-3.5" />
                                                                <span className="font-medium">Attached File</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} className="h-1" />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="px-4 md:px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <div className="flex items-end gap-3 max-w-4xl mx-auto">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl w-11 h-11 flex-shrink-0 text-muted-foreground hover:text-foreground border-[hsl(var(--border))]/50 shadow-sm"
                                    title="Attach document"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <div className="flex-1 relative">
                                    <textarea
                                        placeholder="Type your command or message..."
                                        className="w-full bg-[hsl(var(--muted))]/50 border border-transparent focus:border-[hsl(var(--primary))]/50 focus:bg-background rounded-2xl px-4 py-3 text-[15px] resize-none min-h-[44px] max-h-[120px] shadow-inner focus:shadow-md transition-all outline-none overflow-y-auto"
                                        rows={1}
                                        value={messageInput}
                                        onChange={(e) => {
                                            setMessageInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    size="icon"
                                    className={cn(
                                        "rounded-xl w-11 h-11 flex-shrink-0 shadow-md transition-all",
                                        messageInput.trim()
                                            ? "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] hover:-translate-y-0.5"
                                            : "bg-[hsl(var(--muted))] text-muted-foreground cursor-not-allowed"
                                    )}
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSending}
                                >
                                    {isSending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5 ml-0.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-transparent to-[hsl(var(--muted))]/30">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-[hsl(var(--primary))]/20 blur-2xl rounded-full" />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[hsl(var(--primary))] to-violet-600 flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
                                <MessageSquare className="w-10 h-10 text-white fill-white/20" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2 text-foreground">Global Command Center</h3>
                        <p className="text-[15px] text-muted-foreground max-w-md leading-relaxed mb-6">
                            You have full access to the Omnichannel Communication Hub. Search the directory to initiate a secure broadcast, or select a conversation to coordinate with staff and students.
                        </p>
                        <Button
                            size="lg"
                            className="gap-2.5 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(var(--primary),0.5)] font-semibold px-8"
                            onClick={() => setNewMsgOpen(true)}
                        >
                            <Search className="w-4 h-4" />
                            Search Directory
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
