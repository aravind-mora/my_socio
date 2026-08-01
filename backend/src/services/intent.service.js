export function analyzeIntent(message) {
    const lower = message.toLowerCase();

    if (lower.includes("book")) return "BOOK";
    if (lower.includes("near")) return "NEARBY";
    if (lower.includes("cheap") || lower.includes("low price"))
        return "CHEAP";
    if (lower.includes("best") || lower.includes("top rated"))
        return "BEST";
    if (lower.includes("review")) return "REVIEWS";

    return "SEARCH";
}
