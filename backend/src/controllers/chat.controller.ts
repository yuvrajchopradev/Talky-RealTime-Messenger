import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { chatIdSchema, createChatSchema } from "../validators/chat.validator";
import { HTTPSTATUS } from "../config/http.config";
import { createChatService, getSingleChatService, getUserChatsService } from "../services/chat.service";

export const createChatController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "Unauthorized",
        });
    }
    const userId = req.user._id;
    const body = createChatSchema.parse(req.body);

    const chat = await createChatService(userId, body);

    return res.status(HTTPSTATUS.CREATED).json({
        message: "Chat created or fetched successfully",
        chat,
    });
});

export const getUserChatsController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "Unauthorized",
        });
    }
    const userId = req.user._id;
    const chats = await getUserChatsService(userId);

    return res.status(HTTPSTATUS.OK).json({
        message: "User Chats fetched successfully",
        chats,
    });
});

export const getSingleChatController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "Unauthorized",
        });
    }
    const userId = req.user._id;
    const {id} = chatIdSchema.parse(req.params);

    const {chat, messages} = await getSingleChatService(id, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Single Chat fetched successfully",
        chat,
        messages,
    });
});