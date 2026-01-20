import ChatBody from "@/components/chat/ChatBody";
import ChatFooter from "@/components/chat/ChatFooter";
import ChatHeader from "@/components/chat/ChatHeader";
import EmptyState from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import useChatId from "@/hooks/useChatId";
import { useSocket } from "@/hooks/useSocket";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useState } from "react";

export default function SingleChat() {
    const chatId = useChatId();
    const { fetchSingleChat, isSingleChatLoading, singleChat } = useChat();
    const { socket } = useSocket();
    const { user } = useAuth();

    const currentUserId = user?._id || null;
    const chat = singleChat?.chat;
    const messages = singleChat?.messages || [];

    const isAIChat = chat?.isAiChat || false;

    const [replyTo, setReplyTo] = useState<MessageType | null>(null);

    useEffect(() => {
        if (!chatId) return;
        fetchSingleChat(chatId);
    }, [fetchSingleChat, chatId]);

    useEffect(() => {
        if (!chatId || !socket) return;
        socket.emit("chat:join", chatId);

        return () => {
            socket.emit("chat:leave", chatId);
        }
    }, [chatId, socket]);

    if (isSingleChatLoading) {
        return (
            <div
                className="h-screen flex items-center justify-center" >
                <Spinner
                    className="w-11 h-11 text-primary!" />
            </div>
        );
    }

    if (!chat) {
        return (
            <div
                className="h-screen flex items-center justify-center" >
                <p className="text-lg">Chat Not Found</p>
            </div>
        );
    }

    return (
        <div
            className="relative h-svh flex flex-col overflow-hidden" >
            <ChatHeader
                chat={chat}
                currentUserId={currentUserId} />

            <div
            className="flex-1 overflow-y-auto bg-background" >
                {messages.length === 0 ? (
                    <EmptyState
                        title="Start a Conversation"
                        desciption="No Messages yet. Send your first message." />
                ) : (
                    <ChatBody
                        chatId={chatId}
                        messages={messages}
                        onReply={setReplyTo} />
                )}
            </div>

            <ChatFooter
                replyTo={replyTo}
                chatId={chatId}
                isAIChat={isAIChat}
                currentUserId={currentUserId}
                onCancelReply={() => setReplyTo(null)} />
        </div>
    );
}