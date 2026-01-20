import "dotenv/config";
import connectDB from "../config/db.config";
import UserModel from "../models/user.model"

export const CreateTalkyAI = async () => {
    const existingAI = await UserModel.findOne({ isAI: true });
    if(existingAI) {
        await UserModel.deleteOne({ _id: existingAI._id });
    }

    const talkyAI = await UserModel.create({
        name: "Talky AI",
        isAI: true,
        avatar: "http://res.cloudinary.com/dp9vvlndo/image/upload/v1759925671/ai_logo_qqman8.png",
    });

    console.log("TalkyAI created");
    return talkyAI;
}

const seedTalkyAI = async () => {
    try {
        await connectDB();
        await CreateTalkyAI();
        console.log("TalkyAI seeded");
        process.exit(0);
    } catch (error) {
        console.log("seeding failed", error);
        process.exit(1);
    }
}

seedTalkyAI();