import { Router } from "express";
import { passportAuthenticateJWT } from "../config/passport.config";
import { getUsersController } from "../controllers/user.controller";

const userRoutes = Router()
.use(passportAuthenticateJWT)
.get("/all", getUsersController);

export default userRoutes;