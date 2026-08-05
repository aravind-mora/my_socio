import { generateAIResponse } from "../services/ai.service.js";
import { buildContext } from "../services/context.service.js";
import { analyzeIntent } from "../services/intent.service.js";

export const chatWithAI = async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const cleanedMessage = message.trim();
    const intent = analyzeIntent(cleanedMessage);

    const { services, context } = await buildContext(
      cleanedMessage,
      intent,
      location // { lat, lng } from the frontend's geolocation (optional)
    );

    // If no services → smart AI reply
    if (!services.length) {
      const smartPrompt = `
You are SocioSphere AI assistant.

User asked:
"${cleanedMessage}"

There are currently no matching services.

Respond naturally and helpfully.

FORMATTING RULES (important):
- Use clean Markdown: **bold** for key phrases, prices and names.
- Use bullet points (each on its own line starting with "- ") for lists.
- Keep it short, friendly and scannable. Use emojis sparingly.
`;

      const aiReply = await generateAIResponse(smartPrompt);

      return res.status(200).json({
        success: true,
        reply: aiReply,
      });
    }

    // Normal AI response
    const finalPrompt = `
Available services:
${context}

User question:
${cleanedMessage}

Respond naturally and intelligently.

FORMATTING RULES (important):
- Put each service NAME as a Markdown heading on its own line, e.g. "### 1. Test Service".
- Directly under each heading, one compact line with the details: Category, Price, Location.
- Use **bold** ONLY for the price (e.g. **₹500**).
- Do NOT bold the service name inside the details line (it already has its own heading).
- Keep it short, friendly and scannable. Use emojis sparingly.
`;

    const aiReply = await generateAIResponse(finalPrompt);

    return res.status(200).json({
      success: true,
      reply: aiReply,
    });

  } catch (error) {
    console.error("Chat Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "AI service error",
    });
  }
};
