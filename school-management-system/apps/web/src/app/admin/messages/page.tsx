"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Search, Paperclip, MoreVertical } from "lucide-react";

const mockConversations = [
    { id: "1", name: "Maria Santos", lastMessage: "Thank you for the update!", time: "2m ago", unread: 2, avatar: "MS", online: true },
    { id: "2", name: "Prof. Garcia", lastMessage: "I'll submit the grades by Friday.", time: "15m ago", unread: 0, avatar: "PG", online: true },
    { id: "3", name: "Juan Dela Cruz", lastMessage: "When is the enrollment deadline?", time: "1h ago", unread: 1, avatar: "JD", online: false },
    { id: "4", name: "Faculty Group Chat", lastMessage: "Meeting tomorrow at 2PM.", time: "3h ago", unread: 5, avatar: "FG", online: false },
    { id: "5", name: "Ana Garcia", lastMessage: "Can I request a schedule change?", time: "5h ago", unread: 0, avatar: "AG", online: false },
    { id: "6", name: "Pedro Reyes", lastMessage: "Payment confirmed.", time: "1d ago", unread: 0, avatar: "PR", online: false },
];

const mockMessages = [
    { id: "1", sender: "Maria Santos", body: "Good morning! I have a question about my enrollment.", time: "9:00 AM", isMine: false },
    { id: "2", sender: "You", body: "Good morning, Maria! What's your question?", time: "9:02 AM", isMine: true },
    { id: "3", sender: "Maria Santos", body: "I need to change my section from Section A to Section B. Is that still possible?", time: "9:05 AM", isMine: false },
    { id: "4", sender: "You", body: "Yes, that's still possible! Please go to the Registrar's Office with your Student ID and fill out a Change of Section form.", time: "9:08 AM", isMine: true },
    { id: "5", sender: "Maria Santos", body: "Thank you for the update!", time: "9:10 AM", isMine: false },
];

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
    const [message, setMessage] = useState("");

    return (
        <div className="flex h-[calc(100vh-8rem)] -m-6">
            {/* Conversations List */}
            <div className="w-80 border-r border-[hsl(var(--border))] flex flex-col bg-[hsl(var(--card))]">
                <div className="p-4 border-b border-[hsl(var(--border))]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                            placeholder="Search conversations..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mockConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                selectedConversation.id === conv.id
                                    ? "bg-[hsl(var(--primary)/0.08)]"
                                    : "hover:bg-[hsl(var(--muted)/0.5)]"
                            )}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold shrink-0">
                                    {conv.avatar}
                                </div>
                                {conv.online && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[hsl(var(--success))] border-2 border-[hsl(var(--card))]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold truncate">{conv.name}</p>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{conv.time}</span>
                                </div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{conv.lastMessage}</p>
                            </div>
                            {conv.unread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {conv.unread}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold">
                            {selectedConversation.avatar}
                        </div>
                        <div>
                            <p className="text-sm font-bold">{selectedConversation.name}</p>
                            <p className="text-xs text-[hsl(var(--success))]">
                                {selectedConversation.online ? "Online" : "Offline"}
                            </p>
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <MoreVertical className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {mockMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn("flex", msg.isMine ? "justify-end" : "justify-start")}
                        >
                            <div
                                className={cn(
                                    "max-w-[70%] rounded-2xl px-4 py-3",
                                    msg.isMine
                                        ? "bg-[hsl(var(--primary))] text-white rounded-br-sm"
                                        : "bg-[hsl(var(--muted))] rounded-bl-sm"
                                )}
                            >
                                <p className="text-sm leading-relaxed">{msg.body}</p>
                                <p
                                    className={cn(
                                        "text-[10px] mt-1",
                                        msg.isMine ? "text-white/60" : "text-[hsl(var(--muted-foreground))]"
                                    )}
                                >
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]">
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            onKeyDown={(e) => e.key === "Enter" && setMessage("")}
                        />
                        <button className="p-2.5 rounded-xl bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-md shadow-[hsl(var(--primary)/0.25)]">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
