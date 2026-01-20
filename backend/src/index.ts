import "dotenv/config";
import express, { Request, Response } from "express";
import cookiePaser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDB from "./config/db.config";
import { initializeSockets } from "./lib/socket";
import routes from "./routes";
import passport from "passport";
import "./config/passport.config";
import path from "path";

const app = express();
const server = http.createServer(app);

initializeSockets(server);

app.use(express.json({ limit: "10mb" }));
app.use(cookiePaser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
}));

app.use(passport.initialize());

app.get("/health", asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
        "message": "Server is healthy",
        "status": "OK"
    })
}));

app.use("/api", routes);

if(Env.NODE_ENV === "production") {
    const clientPath = path.resolve(__dirname, "../../frontend/dist");

    // serve static files
    app.use(express.static(clientPath));

    app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
        res.sendFile(path.join(clientPath, "index.html"));
    });
}

app.use(errorHandler);

server.listen(Env.PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});