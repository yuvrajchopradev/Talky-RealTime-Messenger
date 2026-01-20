import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { loginService, registerService } from "../services/auth.service";
import { clearJWTAuthCookie, setJWTAuthCookie } from "../utils/cookie";
import { HTTPSTATUS } from "../config/http.config";

export const registerController = asyncHandler(async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);
    const user = await registerService(body);
    const userId: string = user._id.toString();

    return setJWTAuthCookie({res, userId}).status(HTTPSTATUS.CREATED).json({
        message: "User created and logged in successfully",
        user,
    });
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);
    const user = await loginService(body);
    const userId: string = user._id.toString();

    return setJWTAuthCookie({res, userId}).status(HTTPSTATUS.OK).json({
        message: "User logged in successfully",
        user,
    });
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
    return clearJWTAuthCookie(res).status(HTTPSTATUS.OK).json({
        message: "User logged out successfully",
    });
});

export const authStatusController = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    return res.status(HTTPSTATUS.OK).json({
        message: "Authenticated User",
        user,
    });
});