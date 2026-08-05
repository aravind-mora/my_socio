import Service from "../models/Service.js";
import Review from "../models/Review.js";

/**
 * Build search context for the AI chatbot.
 * Uses a safe regex search (no text index needed — the Service model
 * doesn't have one, so $text would throw) and sorts by intent:
 *  CHEAP → price low→high · BEST → rating · default → price low→high
 */
export async function buildContext(userQuery, intent, userLocation) {
  const words = (userQuery || "")
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, ""))
    .filter((w) => w.length > 2);

  const or = [];
  if (words.length) {
    const rx = words.join("|");
    or.push({ title: { $regex: rx, $options: "i" } });
    or.push({ description: { $regex: rx, $options: "i" } });
    or.push({ category: { $regex: rx, $options: "i" } });
  }

  let query = or.length ? { $or: or } : {};

  // "Near me" — when the user shares coordinates
  if (
    intent === "NEARBY" &&
    userLocation &&
    userLocation.lat != null &&
    userLocation.lng != null
  ) {
    query = {
      ...query,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(userLocation.lng), Number(userLocation.lat)]
          },
          $maxDistance: 10000 // 10km
        }
      }
    };
  }

  let services = [];
  try {
    services = await Service.find(query).limit(20);
  } catch (e) {
    // if geo query fails (missing index etc), retry without it
    services = await Service.find(or.length ? { $or: or } : {})
      .limit(20)
      .catch(() => []);
  }

  if (!services.length) return { services: [], context: "" };

  // enrich with live review stats
  const enriched = [];
  for (const service of services) {
    const reviews = await Review.find({ service: service._id })
      .select("rating")
      .lean()
      .catch(() => []);
    const reviewCount = reviews.length;
    const avg = reviewCount
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 0;
    enriched.push({
      ...service.toObject(),
      averageRating: avg.toFixed(1),
      reviewCount
    });
  }

  // Sort per intent
  if (intent === "BEST") {
    enriched.sort((a, b) => b.averageRating - a.averageRating);
  } else {
    enriched.sort((a, b) => (a.price || 0) - (b.price || 0)); // low → high
  }

  const final = enriched.slice(0, 5);

  let context = "";
  final.forEach((s, i) => {
    const coord = s.location?.coordinates || [];
    const loc = coord.length >= 2
      ? `${coord[1].toFixed(2)}, ${coord[0].toFixed(2)}`
      : "unknown";
    context += `
Service ${i + 1}:
Title: ${s.title}
Category: ${s.category || ""}
Price: ₹${s.price}
Rating: ${s.averageRating} (${s.reviewCount} reviews)
Location: ${loc}
`;
  });

  return { services: final, context };
}
