import { useSocket } from "@/hooks/useSocket";
import type { ChatType } from "@/types/chat.type";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export const isUserOnline = (userId?: string) => {
    if(!userId) return false;
    const { onlineUsers } = useSocket.getState();
    return onlineUsers.includes(userId);
}

export const getOtherUserAndGroup = (chat: ChatType, currentUserId: string | null) => {
    const isGroup = chat?.isGroup;
    
    if(isGroup) {
        return {
            name: chat.groupName || "Un-Named Group",
            subHeading: `${chat.participants.length} members`,
            avatar: "",
            isGroup: true,
        }
    }

    const other = chat?.participants.find((p) => p._id !== currentUserId);
    const isOnline = isUserOnline(other?._id ?? "");

    const subHeading = other?.isAI ? "Assistant" : isOnline ? "Online" : "Offline";
    
    return {
        name: other?.name || "Unknown",
        subHeading,
        avatar: other?.avatar || "",
        isGroup: false,
        isOnline,
        isAI: other?.isAI || false,
    }
}

export const formatChatTime = (date: string | Date) => {
    if(!date) return "";
    const newDate = new Date(date);
    if(isNaN(newDate.getTime())) return "Invalid Date";

    if(isToday(newDate)) return format(newDate, "hh:mm a");
    if(isYesterday(newDate)) return "Yesterday";
    if(isThisWeek(newDate)) return format(newDate, "EEEE");

    return format(newDate, "M/d");
}

export const generateUUID = (): string => {
    return uuidv4();
}