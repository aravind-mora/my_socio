import Notification from "../models/Notification.js";

export const sendNotification = async (io, userId, data) => {
    const notification = await Notification.create({
        user: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        meta: data.meta || {}
    });

    io.to(`user-${userId}`).emit("notification", notification);

    return notification;
};
