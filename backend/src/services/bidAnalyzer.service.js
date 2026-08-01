import Bid from "../models/Bid.js";

export async function analyzeBids(serviceRequestId) {
    const bids = await Bid.find({ serviceRequest: serviceRequestId });

    if (!bids.length) return null;

    const best = bids.sort((a, b) => a.amount - b.amount)[0];

    return best;
}
