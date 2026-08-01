export const generateAIResponse = async (prompt) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    
    // Use the correct model name from the available models list
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API Error Detail:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Gemini API failed");
    }
    
    // Extract the response text
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected response format:", JSON.stringify(data, null, 2));
      throw new Error("Unexpected response format from Gemini API");
    }
  } catch (error) {
    console.error("Gemini Service Error:", error.message);
    throw error;
  }
};