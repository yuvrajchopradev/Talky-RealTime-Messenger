import { Server as HTTPServer } from "http";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import jwt from "jsonwebtoken";
import { validateChatParticipant } from "../services/chat.service";

interface AuthenticatedSocket extends Socket {
    userId?: string;
}


let io: Server | null = null;
const onlineUsers = new Map<string, string>();

export const initializeSockets = (httpServer: HTTPServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: Env.FRONTEND_ORIGIN,
            methods: ["GET", "POST"],
            credentials: true,
        }
    });

    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie) return next(new Error("Unauthorized"));

            const token = rawCookie?.split("=")[1]?.trim();
            if (!token) return next(new Error("Unauthorized"));

            const decodedToken = jwt.verify(token, Env.JWT_SECRET) as { userId: string };
            if (!decodedToken) return next(new Error("Unauthorized"));

            socket.userId = decodedToken.userId;
            next();
        } catch (error) {
            next(new Error("Internal Sever Error"));
        }
    });

    io.on("connection", (socket: AuthenticatedSocket) => {
        if (!socket.userId) {
            socket.disconnect();
            return;
        }
        const userId = socket.userId;
        const newSocketId = socket.id;

        console.log("socket connected", { userId, newSocketId });

        onlineUsers.set(userId, newSocketId);

        io?.emit("online:users", Array.from(onlineUsers.keys()));

        socket.join(`user:${userId}`);

        socket.on("chat:join", async (chatId: string, callback?: (err?: string) => void) => {
            try {
                await validateChatParticipant(chatId, userId);
                socket.join(`chat:${chatId}`);
                console.log(`User ${userId} joined chat room ${chatId}`);
                callback?.();
            } catch (error) {
                callback?.("Error joining chat");
            }
        });

        socket.on("chat:leave", (chatId: string) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                console.log(`User ${userId} left chat ${chatId}`);
            }
        });

        socket.on("disconnect", () => {
            if(onlineUsers.get(userId) === newSocketId) {
                if(userId) onlineUsers.delete(userId);
                io?.emit("online:users", Array.from(onlineUsers.keys()));
                console.log("socket disconnected", { userId, newSocketId });
            }
        });
    });
}

const getIO = () => {
    if(!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
}

export const emitNewChatToParticipants = (participantIds: string[] = [], chat: any) => {
    const io = getIO();
    for(const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:new", chat);
    }
}

export const emitNewMessageToChatRoom = (senderId: string, chatId: string, message: any) => {
    const io = getIO();
    const senderSocketId = onlineUsers.get(senderId?.toString());

    console.log("sender id: ", senderId);
    console.log("sender socket id: ", senderSocketId);
    console.log("all online users: ", Object.fromEntries(onlineUsers));

    if(senderSocketId) {
        io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
    }
    else {
        io.to(`chat:${chatId}`).emit("message:new", message);
    }
}

export const emitLastMessageToParticipants = (participantIds: string[] = [], chatId: string, lastMessage: any) => {
    const io = getIO();
    const payload = {chatId, lastMessage};

    for(const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:update", payload);
    }
}

export const emitChatAI = (
    {
        chatId,
        chunk = null,
        sender,
        done = false,
        message = null,
    } : {
        chatId: string,
        chunk?: string | null,
        sender?: any,
        done?: boolean,
        message?: any
    }
) => {
    const io = getIO();
    if(chunk?.trim() && !done) {
        io.to(`chat:${chatId}`).emit("chat:ai", {
            chatId,
            chunk,
            done,
            message: null,
            sender,
        });
        return;
    }

    if(done) {
        io.to(`chat:${chatId}`).emit("chat:ai", {
            chatId,
            chunk: null,
            done,
            message,
            sender,
        });
        return;
    }
}