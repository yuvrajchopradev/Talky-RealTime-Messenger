import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import { CreateChatSchemaType } from "../validators/chat.validator";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import UserModel from "../models/user.model";
import MessageModel from "../models/message.model";
import { emitNewChatToParticipants } from "../lib/socket";

export const createChatService = async (userId: string, body: CreateChatSchemaType) => {
    const { participantId, isGroup, participants, groupName } = body;

    let chat;
    let allParticipantIds: mongoose.Types.ObjectId[] = [];

    if (isGroup && participants?.length && groupName) {
        allParticipantIds = [
            new mongoose.Types.ObjectId(userId),
            ...participants.map(id => new mongoose.Types.ObjectId(id)),
        ];
        chat = await ChatModel.create({
            participants: allParticipantIds,
            isGroup,
            groupName,
            createdBy: userId,
        });
    }
    else if (participantId) {
        const otherUser = await UserModel.findById(participantId);
        if (!otherUser) {
            throw new NotFoundException("User not found");
        }

        allParticipantIds = [
            new mongoose.Types.ObjectId(userId),
            new mongoose.Types.ObjectId(participantId),
        ];

        const existingChat = await ChatModel.findOne({
            participants: {
                $all: allParticipantIds,
                $size: 2,
            }
        }).populate("participants", "name avatar isAI");

        if (existingChat) {
            return existingChat;
        }

        chat = await ChatModel.create({
            participants: allParticipantIds,
            isGroup: false,
            createdBy: userId,
        });
    }

    // implement sockets
    const populatedChat = await chat?.populate("participants", "name avatar isAI");
    const participantIdStrings = populatedChat?.participants?.map(p => p._id?.toString());
    emitNewChatToParticipants(participantIdStrings, populatedChat);

    return chat;
}

export const getUserChatsService = async (userId: string) => {
    const chats = await ChatModel.find({
        participants: {
            $in: [userId],
        },
    })
        .populate("participants", "name avatar isAI")
        .populate({
            path: "lastMessage",
            populate: {
                path: "sender",
                select: "name avatar",
            },
        })
        .sort({ updatedAt: -1 });

    return chats;
}

export const getSingleChatService = async (chatId: string, userId: string) => {
    const chat = await ChatModel.findOne({
        _id: chatId,
        participants: {
            $in: [userId],
        },
    }).populate("participants", "name avatar isAI");

    if(!chat) {
        throw new BadRequestException("Chat not found or you are not authorized to view this chat");
    }

    const messages = await MessageModel.find({chatId})
    .populate("sender", "name avatar isAI")
    .populate({
        path: "replyTo",
        select: "content image sender",
        populate: {
            path: "sender",
            select: "name avatar isAI",
        },
    })
    .sort({ createdAt: 1 });

    return {
        chat,
        messages,
    };
}

export const validateChatParticipant = async (chatId: string, userId: string) => {
    const chat = await ChatModel.findOne({
        _id: chatId,
        participants: {
            $in: [userId],
        },
    });

    if(!chat) {
        throw new BadRequestException("User not a participant of this chat");
    }

    return chat;
}