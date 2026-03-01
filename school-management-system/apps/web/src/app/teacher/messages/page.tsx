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

export default function TeacherMessagesPage() {
    const { user } = useAuthStore();
    const {
        isConnected,
        sendMessage: wsSendMessage,
        joinConversation,
        markAsRead: wsMarkAsRead,
        onMessage,
    } = useWebSocket();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] =
        useState<Conversation | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // New Message Dialog
    const [newMsgOpen, setNewMsgOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<UserInfo[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // ─── Fetch Conversations ──────────────────────────────────────────────────

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

    // ─── WebSocket: Listen for Global Messages ────────────────────────────────

    useEffect(() => {
        const unsubscribe = onMessage("__all__", () => {
            fetchConversations();
        });
        return unsubscribe;
    }, [onMessage, fetchConversations]);

    // ─── WebSocket: Listen for Active Conversation Messages ───────────────────

    useEffect(() => {
        if (!activeConversation) return;

        const unsubscribe = onMessage(
            activeConversation.id,
            (msg: IncomingMessage) => {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg as MessageData];
                });
            }
        );

        return unsubscribe;
    }, [activeConversation, onMessage]);

    // ─── Auto-scroll to Bottom ────────────────────────────────────────────────

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Select Conversation ──────────────────────────────────────────────────

    const selectConversation = useCallback(
        async (conv: Conversation) => {
            setActiveConversation(conv);
            setIsLoadingMessages(true);
            setShowMobileChat(true);

            joinConversation(conv.id);
            wsMarkAsRead(conv.id);

            // Mark as read on server
            try {
                await api.patch(`/messages/conversations/${conv.id}/read`);
            } catch { }

            // Fetch messages
            try {
                const res = await api.get(`/messages/conversations/${conv.id}`);
                setMessages(res.data.data.messages);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoadingMessages(false);
            }

            // Update unread count locally
            setConversations((prev) =>
                prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
            );
        },
        [joinConversation, wsMarkAsRead]
    );

    // ─── Send Message ─────────────────────────────────────────────────────────

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

                // Add to conversations if not already there
                setConversations((prev) => {
                    const exists = prev.find((c) => c.id === conv.id);
                    if (exists) return prev;
                    return [{ ...conv, unreadCount: 0 }, ...prev];
                });

                selectConversation({ ...conv, unreadCount: 0 });
            } catch (error) {
                console.error("Failed to start DM:", error);
            }
        },
        [selectConversation]
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

    // ─── Filtered Conversations ───────────────────────────────────────────────

    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;
        const name = getConversationDisplayName(conv).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
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
                            <h2 className="text-lg font-bold">Messages</h2>
                            <div
                                className={cn(
                                    "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                                    isConnected
                                        ? "bg-emerald-500/15 text-emerald-400"
                                        : "bg-red-500/15 text-red-400"
                                )}
                            >
                                {isConnected ? (
                                    <Wifi className="w-3 h-3" />
                                ) : (
                                    <WifiOff className="w-3 h-3" />
                                )}
                                {isConnected ? "Live" : "Offline"}
                            </div>
                        </div>
                        <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white rounded-xl"
                                >
                                    <Plus className="w-4 h-4" />
                                    New
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>New Message</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 pt-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users by name or email..."
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
                                                    No users found
                                                </p>
                                            )}
                                        {!isSearching &&
                                            userSearchResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => startDirectMessage(u.id)}
                                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors"
                                                >
                                                    <Avatar className="h-9 w-9">
                                                        {u.profilePicture && (
                                                            <AvatarImage src={u.profilePicture} />
                                                        )}
                                                        <AvatarFallback className="text-xs font-semibold bg-[hsl(var(--secondary))] text-white">
                                                            {getUserInitials(u)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {getUserDisplayName(u)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
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
                            placeholder="Search conversations..."
                            className="pl-9 bg-[hsl(var(--muted))]/50 border-transparent focus:border-[hsl(var(--secondary))] rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <ScrollArea className="flex-1">
                    {isLoadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No conversations yet
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Start a new message to begin chatting
                            </p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {filteredConversations.map((conv) => {
                                const isActive = activeConversation?.id === conv.id;
                                const avatarUser = getConversationAvatar(conv);
                                const ConvIcon = getConversationIcon(conv.type);
                                const lastMsg = conv.messages[0];
                                const hasUnread = conv.unreadCount > 0;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={cn(
                                            "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all text-left",
                                            isActive
                                                ? "bg-[hsl(var(--secondary))]/10 border border-[hsl(var(--secondary))]/20"
                                                : "hover:bg-[hsl(var(--muted))]/50"
                                        )}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-11 w-11">
                                                {avatarUser?.profilePicture && (
                                                    <AvatarImage
                                                        src={avatarUser.profilePicture}
                                                    />
                                                )}
                                                <AvatarFallback
                                                    className={cn(
                                                        "text-sm font-semibold",
                                                        conv.type === "DIRECT"
                                                            ? "bg-[hsl(var(--secondary))] text-white"
                                                            : "bg-violet-500/20 text-violet-400"
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
                                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[hsl(var(--secondary))] rounded-full border-2 border-[hsl(var(--card))] flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-white">
                                                        {conv.unreadCount > 9
                                                            ? "9+"
                                                            : conv.unreadCount}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-sm truncate",
                                                        hasUnread
                                                            ? "font-bold"
                                                            : "font-medium"
                                                    )}
                                                >
                                                    {getConversationDisplayName(conv)}
                                                </p>
                                                {lastMsg && (
                                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                        {formatMessageTime(lastMsg.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMsg && (
                                                <p
                                                    className={cn(
                                                        "text-xs truncate mt-0.5",
                                                        hasUnread
                                                            ? "text-foreground font-medium"
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
                    "flex-1 flex flex-col min-w-0",
                    !showMobileChat && "hidden md:flex"
                )}
            >
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
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
                                    <Avatar className="h-10 w-10">
                                        {avatarUser?.profilePicture && (
                                            <AvatarImage
                                                src={avatarUser.profilePicture}
                                            />
                                        )}
                                        <AvatarFallback
                                            className={cn(
                                                "text-sm font-semibold",
                                                activeConversation.type === "DIRECT"
                                                    ? "bg-[hsl(var(--secondary))] text-white"
                                                    : "bg-violet-500/20 text-violet-400"
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
                                <h3 className="text-sm font-bold truncate">
                                    {getConversationDisplayName(activeConversation)}
                                </h3>
                                {activeConversation.type === "DIRECT" && (
                                    <p className="text-xs text-muted-foreground">
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
                                    <p className="text-xs text-muted-foreground">
                                        {activeConversation.participants.length} members
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Message Feed */}
                        <ScrollArea className="flex-1" ref={messagesContainerRef}>
                            <div className="px-4 md:px-6 py-4 space-y-1">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            No messages yet. Say hello! 👋
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
                                            <div key={msg.id}>
                                                {showTimestamp && (
                                                    <div className="flex items-center justify-center my-4">
                                                        <span className="text-[10px] text-muted-foreground bg-[hsl(var(--muted))]/50 px-3 py-1 rounded-full">
                                                            {formatFullTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={cn(
                                                        "flex gap-2 max-w-[85%] md:max-w-[70%]",
                                                        isMe
                                                            ? "ml-auto flex-row-reverse"
                                                            : "mr-auto"
                                                    )}
                                                >
                                                    {!isMe && showAvatar ? (
                                                        <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                                                            {msg.sender.profilePicture && (
                                                                <AvatarImage
                                                                    src={
                                                                        msg.sender.profilePicture
                                                                    }
                                                                />
                                                            )}
                                                            <AvatarFallback className="text-[10px] font-semibold bg-[hsl(var(--muted))]">
                                                                {getUserInitials(msg.sender)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ) : !isMe ? (
                                                        <div className="w-7 flex-shrink-0" />
                                                    ) : null}
                                                    <div>
                                                        {!isMe && showAvatar && (
                                                            <p className="text-[11px] font-medium text-muted-foreground ml-1 mb-0.5">
                                                                {getUserDisplayName(msg.sender)}
                                                            </p>
                                                        )}
                                                        <div
                                                            className={cn(
                                                                "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words",
                                                                isMe
                                                                    ? "bg-[hsl(var(--secondary))] text-white rounded-br-md"
                                                                    : "bg-[hsl(var(--muted))] rounded-bl-md"
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
                                                                    "flex items-center gap-1.5 text-xs mt-1 px-2 py-1 rounded-lg",
                                                                    isMe
                                                                        ? "text-white/70 hover:text-white"
                                                                        : "text-muted-foreground hover:text-foreground"
                                                                )}
                                                            >
                                                                <Paperclip className="w-3 h-3" />
                                                                Attachment
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="px-4 md:px-6 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl text-muted-foreground hover:text-foreground flex-shrink-0"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <Input
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[hsl(var(--muted))]/50 border-transparent focus:border-[hsl(var(--secondary))] rounded-xl"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    className="rounded-xl bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white flex-shrink-0"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSending}
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--secondary))]/10 flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-[hsl(var(--secondary))]" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Welcome to Messages</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Select a conversation from the sidebar or start a new message
                            to begin chatting with admins, teachers, or students.
                        </p>
                        <Button
                            className="mt-4 gap-2 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white rounded-xl"
                            onClick={() => setNewMsgOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Start a Conversation
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
