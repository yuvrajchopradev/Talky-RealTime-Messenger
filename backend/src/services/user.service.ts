import UserModel from "../models/user.model";

export const findByIdUserService = async (userId: string) => {
    return await UserModel.findById(userId);
}

export const getUsersService = async (userId: string) => {
    return await UserModel.find({
        _id: {
            $ne: userId,
        },
    });
}