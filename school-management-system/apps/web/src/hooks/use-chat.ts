"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient, useMutation } from "@tanstack/react-query";

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

export function useChat(currentUserId?: string) {
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
                        return [message, ...oldData]; // Assuming chronological append
                    }

                    if (oldData.messages) {
                        return { ...oldData, messages: [message, ...oldData.messages] };
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

                // A cleaner approach for the snippet is to just invalidate the conversations list to let the server re-sort and calculate unread
                queryClient.invalidateQueries({ queryKey: ["conversations"] });

                return oldData;
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

    const { mutate: sendMessageMutation } = useMutation({
        mutationFn: async ({
            conversationId,
            content,
            attachmentUrl,
        }: {
            conversationId: string;
            content: string;
            attachmentUrl?: string;
        }) => {
            return new Promise<void>((resolve) => {
                socketRef.current?.emit("send-message", {
                    conversationId,
                    content,
                    attachmentUrl,
                });
                resolve();
            });
        },
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["messages", variables.conversationId] });

            // Snapshot previous value
            const previousMessages = queryClient.getQueryData(["messages", variables.conversationId]);

            // Create optimistic message
            const optimisticMsg: IncomingMessage = {
                id: `temp-${Date.now()}`,
                conversationId: variables.conversationId,
                senderId: currentUserId || "optimistic-id",
                content: variables.content,
                attachmentUrl: variables.attachmentUrl,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                sender: {
                    id: currentUserId || "optimistic-id",
                    email: "",
                    role: "ADMIN"
                }
            };

            // Optimistically update
            queryClient.setQueryData(
                ["messages", variables.conversationId],
                (oldData: any) => {
                    if (!oldData) return { messages: [optimisticMsg] };
                    if (oldData.pages) {
                        const newPages = [...oldData.pages];
                        newPages[0] = {
                            ...newPages[0],
                            messages: [optimisticMsg, ...newPages[0].messages],
                        };
                        return { ...oldData, pages: newPages };
                    }
                    if (Array.isArray(oldData)) {
                        return [optimisticMsg, ...oldData];
                    }
                    if (oldData.messages) {
                        return { ...oldData, messages: [optimisticMsg, ...oldData.messages] };
                    }
                    return oldData;
                }
            );

            // Invalidate conversations to snap snippet to top
            queryClient.invalidateQueries({ queryKey: ["conversations"] });

            return { previousMessages };
        },
        onError: (err, variables, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(["messages", variables.conversationId], context.previousMessages);
            }
        },
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
    });

    const sendMessage = useCallback(
        (conversationId: string, content: string, attachmentUrl?: string) => {
            sendMessageMutation({ conversationId, content, attachmentUrl });
        },
        [sendMessageMutation]
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
