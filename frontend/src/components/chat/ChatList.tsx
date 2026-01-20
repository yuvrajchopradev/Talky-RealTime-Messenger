import { useChat } from "@/hooks/useChat";
import { useEffect, useState } from "react";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./ChatListItem";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ChatListHeader from "./ChatListHeader";
import { useSocket } from "@/hooks/useSocket";
import type { ChatType, MessageType } from "@/types/chat.type";

export default function ChatList() {
    const { fetchChats, chats, isChatsLoading, addNewChat, updateChatLastMessage } = useChat();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const {socket} = useSocket();

    const { user } = useAuth();
    const currentUserId = user?._id || null;

    const filteredChats = chats?.filter((chat) => (
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) || chat.participants?.some(
            (p) => p._id !== currentUserId && 
            p.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    ));

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if(!socket) return;

        const handleNewChat = (newChat: ChatType) => {
            console.log("Received new chat", newChat);
            addNewChat(newChat);
        }

        socket.on("chat:new", handleNewChat);

        return () => {
            socket.off("chat:new", handleNewChat);
        }
    }, [addNewChat, socket]);

    useEffect(() => {
        if(!socket) return;

        const handleChatUpdate = (data: {chatId: string, lastMessage: MessageType}) => {
            console.log("Last message", data.lastMessage);
            updateChatLastMessage(data.chatId, data.lastMessage);
        }

        socket.on("chat:update", handleChatUpdate);

        return () => {
            socket.off("chat:update", handleChatUpdate);
        }
    }, [updateChatLastMessage, socket]);

    const onRoute = (id: string) => {
        navigate(`/chat/${id}`);
    }

    return (
        <div
        className="fixed inset-y-0 *:pb-20 lg:pb-0 lg:max-w-94.75 lg:block border-r border-border max-w-[calc(100%-40px)] w-full left-10 z-98" >
            <div className="flex-col">
                <ChatListHeader onSearch={setSearchQuery} />
                <div
                className="flex-1 h-[calc(100vh-100px)] overflow-y-auto" >
                    <div
                    className="px-2 pb-10 pt-1 space-y-1" >
                        {isChatsLoading ? (
                            <div
                            className="flex items-center justify-center" >
                                <Spinner className="w-7 h-7" />
                            </div>
                        ) : filteredChats?.length === 0 ? (
                            <div
                            className="flex items-center justify-center">
                                {searchQuery ? "No Chat Found" : "No Chats Created"}
                            </div>
                        ) : (
                            filteredChats?.map((chat) => (
                                <ChatListItem
                                key={chat._id}
                                chat={chat}
                                currentUserId={currentUserId}
                                onClick={() => onRoute(chat._id)} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}