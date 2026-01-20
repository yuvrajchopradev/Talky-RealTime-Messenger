import mongoose from "mongoose"
import { Env } from "./env.config";

const connectDB = async () => {
    try {
        await mongoose.connect(Env.MONGO_URI);
        console.log("Database Connected");
    } 
    catch (error) {
        console.error("Database Connection Error: ", error);
        process.exit(1);
    }
}

export default connectDB;