import { useChat } from "@/hooks/useChat";
import { useSocket } from "@/hooks/useSocket";
import type { MessageType } from "@/types/chat.type";
import { useEffect, useRef, useState } from "react";
import { ChatMessageBody } from "./ChatMessageBody";

interface ChatBodyProps {
    chatId: string | null;
    messages: MessageType[];
    onReply: (message: MessageType) => void;
}

export default function ChatBody({ chatId, messages, onReply }: ChatBodyProps) {
    const { socket } = useSocket();
    const { addNewMessage, addOrUpdateMessage } = useChat();
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const [_, setAIChunk] = useState<string>("");

    useEffect(() => {
        if (!socket || !chatId) return;

        const handleNewMessage = (message: MessageType) => addNewMessage(chatId, message);

        socket.on("message:new", handleNewMessage);

        return () => {
            socket.off("message:new", handleNewMessage);
        }
    }, [socket, addNewMessage, chatId]);

    useEffect(() => {
        if (!socket || !chatId) return;

        const handleAIStream = ({
            chatId: streamChatId,
            chunk,
            done,
            message,
        }: any) => {
            if (streamChatId !== chatId) return;

            const lastMessage = messages.at(-1);
            if (!lastMessage?._id && lastMessage?.streaming) return;

            if (chunk?.trim() && !done) {
                setAIChunk((prev) => {
                    const newChunk = prev + chunk;
                    addOrUpdateMessage(
                        chatId,
                        {
                            ...lastMessage,
                            content: newChunk,
                        } as MessageType,
                        lastMessage?._id
                    );
                    return newChunk;
                });
                return;
            }

            if (done) {
                console.log("AI full message: ", message);
                setAIChunk("");
            }
        }

        socket.on("chat:ai", handleAIStream);

        return () => {
            socket.off("chat:ai", handleAIStream);
        }
    }, [addOrUpdateMessage, chatId, messages, socket]);

    useEffect(() => {
        if(!messages.length) return;

        const lastMessage = messages[messages.length - 1];
        const isStreaming = lastMessage?.streaming;
    
        bottomRef.current?.scrollIntoView({
            behavior: isStreaming ? "auto" : "smooth",
        });
    }, [messages]);

    return (
        <div
            className="w-full max-w-6xl max-auto flex flex-col px-3 py-2" >
            {messages?.map((message) => (
                <ChatMessageBody
                    key={message._id}
                    message={message}
                    onReply={onReply} />
            ))}
            <br /> <br />
            <div ref={bottomRef} />
        </div>
    );
}