import Service from "../models/Service.js";
import Review from "../models/Review.js";

export async function buildContext(userQuery, intent, userLocation) {

  let query = {
    $text: { $search: userQuery }
  };

  // Nearby search
  if (intent === "NEARBY" && userLocation) {
    query = {
      ...query,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLocation.lng, userLocation.lat]
          },
          $maxDistance: 5000 // 5km
        }
      }
    };
  }

  let services = await Service.find(query).limit(10);

  if (!services.length) {
    return { services: [], context: "" };
  }

  const enriched = [];

  for (const service of services) {
    const reviews = await Review.find({ service: service._id });

    const reviewCount = reviews.length;
    const avg =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    enriched.push({
      ...service.toObject(),
      averageRating: avg.toFixed(1),
      reviewCount
    });
  }

  enriched.sort((a, b) => b.averageRating - a.averageRating);

  const final = enriched.slice(0, 5);

  let context = "";

  final.forEach((s, i) => {
    context += `
Service ${i + 1}:
Title: ${s.title}
Price: ₹${s.price}
Rating: ${s.averageRating}
Reviews: ${s.reviewCount}
Description: ${s.description}
`;
  });

  return { services: final, context };
}
