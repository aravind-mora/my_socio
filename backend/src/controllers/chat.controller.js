import { generateAIResponse } from "../services/ai.service.js";
import { buildContext } from "../services/context.service.js";
import { analyzeIntent } from "../services/intent.service.js";

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

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
      intent
    );

    // If no services → smart AI reply
    if (!services.length) {
      const smartPrompt = `
You are SocioSphere AI assistant.

User asked:
"${cleanedMessage}"

There are currently no matching services.

Respond naturally and helpfully.
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
