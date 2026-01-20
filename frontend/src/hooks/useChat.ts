import { API } from "@/lib/axios-client";
import type { UserType } from "@/types/auth.type";
import type { ChatType, CreateChatType, CreateMessageType, MessageType } from "@/types/chat.type";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuth } from "./useAuth";
import { generateUUID } from "@/lib/helper";

interface ChatState {
    chats: ChatType[];
    users: UserType[];
    singleChat: {
        chat: ChatType;
        messages: MessageType[];
    } | null;

    isChatsLoading: boolean;
    isUsersLoading: boolean;
    isCreatingChat: boolean;
    isSingleChatLoading: boolean;
    isSendingMessage: boolean;

    fetchAllUsers: () => void;
    fetchChats: () => void;
    createChat: (payload: CreateChatType) => Promise<ChatType | null>;
    fetchSingleChat: (chatId: string) => void;
    addNewChat: (newChat: ChatType) => void;
    updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
    addNewMessage: (chatId: string, message: MessageType) => void;
    sendMessage: (payload: CreateMessageType, isAIChat?: boolean) => void;

    addOrUpdateMessage: (chatId: string, message: MessageType, tempId?: string) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
    chats: [],
    users: [],
    singleChat: null,

    isChatsLoading: false,
    isUsersLoading: false,
    isCreatingChat: false,
    isSingleChatLoading: false,
    isSendingMessage: false,

    fetchAllUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const { data } = await API.get("/user/all");
            set({ users: data.users });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    fetchChats: async () => {
        set({ isChatsLoading: true });
        try {
            const { data } = await API.get("/chat/all");
            set({ chats: data.chats });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch chats");
        } finally {
            set({ isChatsLoading: false });
        }
    },

    createChat: async (payload: CreateChatType) => {
        set({ isCreatingChat: true });
        try {
            const res = await API.post("/chat/create", { ...payload });
            get().addNewChat(res.data.chat);
            toast.success("Chat created successfully");
            return res.data.chat;
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create chats");
            return null;
        } finally {
            set({ isCreatingChat: false });
        }
    },

    fetchSingleChat: async (chatId: string) => {
        set({ isSingleChatLoading: true });
        try {
            const { data } = await API.get(`/chat/${chatId}`);
            set({ singleChat: data });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch single chat");
        } finally {
            set({ isSingleChatLoading: false });
        }
    },

    addNewChat: (newChat: ChatType) => {
        set((state) => {
            const existingChatIndex = state.chats.findIndex(
                (c) => c._id === newChat._id
            );
            if (existingChatIndex !== -1) {
                return {
                    chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)],
                }
            }
            else {
                return {
                    chats: [newChat, ...state.chats],
                }
            }
        });
    },

    updateChatLastMessage: (chatId: string, lastMessage: MessageType) => {
        set((state) => {
            const chat = state.chats.find((c) => c._id === chatId);
            if (!chat) return state;
            return {
                chats: [
                    { ...chat, lastMessage },
                    ...state.chats.filter((c) => c._id !== chatId),
                ],
            }
        });
    },

    addNewMessage: (chatId: string, message: MessageType) => {
        const chat = get().singleChat;
        if (chat?.chat._id === chatId) {
            set({
                singleChat: {
                    chat: chat.chat,
                    messages: [...chat.messages, message],
                }
            });
        }
    },

    sendMessage: async (payload: CreateMessageType, isAIChat?: boolean) => {
        set({ isSendingMessage: true });
        const { chatId, replyTo, image, content } = payload;
        const { user } = useAuth.getState();

        const chat = get().singleChat?.chat;
        const aiSender = chat?.participants.find((p) => p.isAI);

        if (!chatId || !user?._id) return;

        const tempUserId = generateUUID();
        const tempAIId = generateUUID();
        const tempMessage = {
            _id: tempUserId,
            content: content || "",
            chatId,
            image: image || null,
            sender: user,
            replyTo: replyTo || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: !isAIChat ? "Sending..." : "",
        }
        get().addOrUpdateMessage(chatId, tempMessage, tempUserId);

        if (isAIChat && aiSender) {
            const tempAIMessage = {
                _id: tempAIId,
                content: "",
                chatId,
                image: null,
                sender: aiSender,
                replyTo: null,
                streaming: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
            get().addOrUpdateMessage(chatId, tempAIMessage, tempAIId);
        }

        // set((state) => {
        //     if (state.singleChat?.chat?._id !== chatId) return state;
        //     return {
        //         singleChat: {
        //             ...state.singleChat,
        //             messages: [...state.singleChat.messages, tempMessage],
        //         }
        //     }
        // });

        try {
            const { data } = await API.post("/chat/message/send", {
                chatId,
                content,
                image,
                replyTo: replyTo?._id,
            });

            const { userMessage, aiResponse } = data;

            get().addOrUpdateMessage(chatId, userMessage, tempUserId);

            if(isAIChat && aiResponse) {
                get().addOrUpdateMessage(chatId, aiResponse, tempAIId);
            }

            set((state) => {
                if (!state.singleChat) return state;
                return {
                    singleChat: {
                        ...state.singleChat,
                        messages: state.singleChat.messages.map((message) => message._id === tempUserId ? userMessage : message),
                    }
                }
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to send message");
        } finally {
            set({ isSendingMessage: false });
        }
    },

    addOrUpdateMessage: (chatId: string, message: MessageType, tempId?: string) => {
        const singleChat = get().singleChat;
        if (!singleChat || singleChat.chat._id !== chatId) return;

        const messages = singleChat.messages;
        const messageIndex = tempId ? messages.findIndex((m) => m._id === tempId) : -1;

        let updatedMessages;
        if (messageIndex !== -1) {
            updatedMessages = messages.map((message, index) => index === messageIndex ? { ...message } : message);
        }
        else {
            updatedMessages = [...messages, message];
        }

        set({
            singleChat: {
                chat: singleChat.chat,
                messages: updatedMessages,
            }
        });
    }
}));