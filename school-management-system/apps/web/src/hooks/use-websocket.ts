"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export function useWebSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<IncomingMessage | null>(null);
    const listenersRef = useRef<Map<string, Set<(msg: IncomingMessage) => void>>>(
        new Map()
    );

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
        });

        socket.on("new-message", (message: IncomingMessage) => {
            setLastMessage(message);

            // Notify all listeners for this conversation
            const convListeners = listenersRef.current.get(message.conversationId);
            if (convListeners) {
                convListeners.forEach((cb) => cb(message));
            }

            // Notify "all" listeners (for inbox updates)
            const allListeners = listenersRef.current.get("__all__");
            if (allListeners) {
                allListeners.forEach((cb) => cb(message));
            }
        });

        socket.on("connect_error", (error) => {
            console.error("WebSocket connection error:", error.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, []);

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
    }, []);

    const onMessage = useCallback(
        (
            conversationId: string | "__all__",
            callback: (msg: IncomingMessage) => void
        ) => {
            if (!listenersRef.current.has(conversationId)) {
                listenersRef.current.set(conversationId, new Set());
            }
            listenersRef.current.get(conversationId)!.add(callback);

            return () => {
                listenersRef.current.get(conversationId)?.delete(callback);
            };
        },
        []
    );

    return {
        socket: socketRef.current,
        isConnected,
        lastMessage,
        sendMessage,
        joinConversation,
        markAsRead,
        onMessage,
    };
}
