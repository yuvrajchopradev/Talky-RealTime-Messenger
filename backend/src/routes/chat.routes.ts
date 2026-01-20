import { Router } from "express";
import { passportAuthenticateJWT } from "../config/passport.config";
import { createChatController, getSingleChatController, getUserChatsController } from "../controllers/chat.controller";
import { sendMessageController } from "../controllers/message.controller";

const chatRoutes = Router()
.use(passportAuthenticateJWT)
.post("/create", createChatController)
.post("/message/send", sendMessageController)
.get("/all", getUserChatsController)
.get("/:id", getSingleChatController);

export default chatRoutes;