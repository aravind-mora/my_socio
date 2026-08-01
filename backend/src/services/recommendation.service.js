import Service from "../models/Service.js";

export async function recommendServices(userId) {

    return await Service.find().sort({ createdAt: -1 }).limit(3);
}
