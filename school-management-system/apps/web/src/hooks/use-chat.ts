"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Re-export the IncomingMessage interface from our base type definitions
export interface IncomingMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    attachmentUrl?: string | null;
    isDeleted: boolean;
    createdAt: string;
    sender: {
        id: string;
        email: string;
        role: string;
        profilePicture?: string | null;
        studentProfile?: { firstName: string; lastName: string } | null;
        teacherProfile?: { firstName: string; lastName: string } | null;
        adminProfile?: { firstName: string; lastName: string } | null;
        parentProfile?: { firstName: string; lastName: string } | null;
    };
}

export function useChat() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("accessToken")
                : null;

        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
            // Invalidate queries when disconnecting to ensure fresh data on reconnect
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        });

        socket.on("new-message", (message: IncomingMessage) => {
            // 1. Update the specific conversation's message history in React Query Cache
            queryClient.setQueryData(
                ["messages", message.conversationId],
                (oldData: any) => {
                    if (!oldData) return oldData;
                    // If the message is already in the cache, ignore it (deduplication)
                    if (oldData.pages) {
                        const isDuplicate = oldData.pages.some((page: any) =>
                            page.messages.some((m: any) => m.id === message.id)
                        );
                        if (isDuplicate) return oldData;

                        // Add to the first page (latest messages)
                        const newPages = [...oldData.pages];
                        newPages[0] = {
                            ...newPages[0],
                            messages: [message, ...newPages[0].messages],
                        };
                        return { ...oldData, pages: newPages };
                    }

                    // Fallback for non-paginated cache structure just in case
                    if (Array.isArray(oldData)) {
                        if (oldData.some((m) => m.id === message.id)) return oldData;
                        return [...oldData, message]; // Assuming chronological append
                    }

                    return oldData;
                }
            );

            // 2. Update the Conversations List snippet and unread count
            queryClient.setQueryData(["conversations"], (oldData: any) => {
                if (!oldData || !Array.isArray(oldData)) return oldData;

                const conversationIndex = oldData.findIndex(
                    (c) => c.id === message.conversationId
                );

                if (conversationIndex === -1) {
                    // Conversation doesn't exist in cache, invalidate to refetch the list
                    queryClient.invalidateQueries({ queryKey: ["conversations"] });
                    return oldData;
                }

                const updatedConversations = [...oldData];
                const convToUpdate = updatedConversations[conversationIndex];

                // If I am not the sender, increment the unread count
                // (Assuming we pass a 'currentUserId' down or checking our own state)
                // For simplicity here, we assume if we receive it via WS it's a new interaction
                const isSentByMe = false; // We would ideally check against our own token/ID here. We'll let the UI handle the isMe logic for unread count, or just refetch

                // A cleaner approach for the snippet is to just invalidate the conversations list to let the server re-sort and calculate unread
                queryClient.invalidateQueries({ queryKey: ["conversations"] });

                return updatedConversations;
            });
        });

        socket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [queryClient]);

    const sendMessage = useCallback(
        (conversationId: string, content: string, attachmentUrl?: string) => {
            socketRef.current?.emit("send-message", {
                conversationId,
                content,
                attachmentUrl,
            });
        },
        []
    );

    const joinConversation = useCallback((conversationId: string) => {
        socketRef.current?.emit("join-conversation", { conversationId });
    }, []);

    const markAsRead = useCallback((conversationId: string) => {
        socketRef.current?.emit("mark-read", { conversationId });
        // Optimistically clear the unread count in the conversations list cache
        queryClient.setQueryData(["conversations"], (oldData: any) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            return oldData.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c);
        });
    }, [queryClient]);

    return {
        socket: socketRef.current,
        isConnected,
        sendMessage,
        joinConversation,
        markAsRead,
    };
}
