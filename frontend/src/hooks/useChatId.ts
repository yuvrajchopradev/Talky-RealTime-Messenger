import { useParams } from "react-router-dom"

export default function useChatId() {
    const params = useParams<{chatId?: string}>();
    const chatId = params.chatId || null;
    return chatId;
}