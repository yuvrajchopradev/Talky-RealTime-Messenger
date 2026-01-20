import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { SendMessageSchemaType } from "../validators/message.validator";
import cloudinary from "../config/cloudinary.config";
import { emitChatAI, emitLastMessageToParticipants, emitNewMessageToChatRoom } from "../lib/socket";
import {createGoogleGenerativeAI} from "@ai-sdk/google"
import UserModel from "../models/user.model";
import { Env } from "../config/env.config";
import { ModelMessage, streamText } from "ai";

const google = createGoogleGenerativeAI({
    apiKey: Env.GEMINI_API_KEY,
});

export const sendMessageService = async (userId: string, body: SendMessageSchemaType) => {
    const { chatId, content, image, replyToId } = body;

    const chat = await ChatModel.findOne({
        _id: chatId,
        participants: {
            $in: [userId],
        },
    });
    if (!chat) {
        throw new BadRequestException("Chat not found or you are not authorized to send message in this chat");
    }

    if (replyToId) {
        const replyMessage = await MessageModel.findOne({
            _id: replyToId,
            chatId,
        });
        if (!replyMessage) {
            throw new NotFoundException("Reply message not found");
        }
    }

    let imageURL;
    if (image) {
        // upload the image to cloudinary
        const uploadRes = await cloudinary.uploader.upload(image);
        imageURL = uploadRes.secure_url;
    }

    const newMessage = await MessageModel.create({
        chatId,
        sender: userId,
        content,
        image: imageURL,
        replyTo: new mongoose.Types.ObjectId(replyToId) || null,
    });
    await newMessage.populate([
        { path: "sender", select: "name avatar" },
        {
            path: "replyTo",
            select: "content image sender",
            populate: {
                path: "sender",
                select: "name avatar",
            },
        }
    ]);

    chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
    await chat.save();

    // websockets
    emitNewMessageToChatRoom(userId, chatId, newMessage);

    const allParticipants = chat.participants.map(id => id.toString());
    emitLastMessageToParticipants(allParticipants, chatId, newMessage);

    let aiResponse: any = null;
    if (chat.isAIChat) {
        aiResponse = await getAIResponse(chatId, userId);
        if(aiResponse) {
            chat.lastMessage = aiResponse._id as mongoose.Types.ObjectId;
            await chat.save();
        }
    }

    return { userMessage: newMessage, chat, aiResponse };
}

async function getAIResponse(chatId: string, userId: string) {
    const talkyAI = await UserModel.findOne({ isAI: true });
    if(!talkyAI) {
        throw new NotFoundException("AI not found");
    }

    const chatHistory = await getChatHistory(chatId);
    const formattedMessages: ModelMessage[] = chatHistory.map((message: any) => {
        const role = message.sender.isAI ? "assistant" : "user";
        const parts: any[] = [];

        if(message.image) {
            parts.push({
                type: "image",
                data: message.image,
                mediaType: "image/png",
                filename: "image.png",
            });

            if(!message.content) {
                parts.push({
                    type: "text",
                    text: "Describe what you see in the image",
                });
            }
        }

        if(message.content) {
            parts.push({
                type: "text",
                text: message.replyTo ? 
                `[Replying to: "${message.replyTo.content}"]\n${message.content}` : message.content,
            });
        }

        return {role, content: parts};
    });

    const result = await streamText({
        model: google("gemini-3-flash-preview"),
        messages: formattedMessages,
        system: "You are Talky AI, a helpful and friendly assistant. Respond only with text and attend to the last user message only.",
    });

    let fullRes = "";
    for await (const chunk of result.textStream) {
        emitChatAI({
            chatId,
            chunk,
            sender: talkyAI,
            done: false,
            message: null,
        });
        fullRes += chunk;
    }

    if(!fullRes) return "";

    const AIMessage = await MessageModel.create({
        chatId,
        sender: talkyAI._id,
        content: fullRes,
    });
    await AIMessage.populate("sender", "name avatar isAI");

    emitChatAI({
        chatId,
        chunk: null,
        sender: talkyAI,
        done: true,
        message: AIMessage,
    });

    emitLastMessageToParticipants([userId], chatId, AIMessage);

    return AIMessage;
}

async function getChatHistory(chatId: string) {
    const messages = await MessageModel.find({
        chatId,
    })
    .populate("sender", "isAI")
    .populate("replyTo", "content")
    .sort({ createdAt: -1})
    .limit(10)
    .lean();

    return messages.reverse();
}