import { Router } from "express";
import { authStatusController, loginController, logoutController, registerController } from "../controllers/auth.controller";
import { passportAuthenticateJWT } from "../config/passport.config";

const authRoutes = Router()
.post("/register", registerController)
.post("/login", loginController)
.post("/logout", logoutController)
.get("/status", passportAuthenticateJWT, authStatusController);

export default authRoutes;