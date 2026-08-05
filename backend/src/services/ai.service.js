// Ordered list of fallback models. If one is overloaded (503) or
// unavailable, we try the next. Override the whole list via GEMINI_MODELS
// (comma-separated) in .env, e.g. GEMINI_MODELS=gemini-3.5-flash,gemini-flash-latest
const DEFAULT_MODELS = [
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash",
  "gemini-pro-latest",
];

const getModels = () => {
  const fromEnv = process.env.GEMINI_MODELS || process.env.GEMINI_MODEL;
  if (!fromEnv) return DEFAULT_MODELS;
  return fromEnv.split(",").map((m) => m.trim()).filter(Boolean);
};

const callGemini = async (model, prompt, apiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const data = await response.json();

  if (!response.ok) {
    // 429/503 = overloaded → signal caller to try the next model
    if (response.status === 429 || response.status === 503) {
      const err = new Error(data.error?.message || "Model busy");
      err.retryable = true;
      throw err;
    }
    throw new Error(data.error?.message || "Gemini API failed");
  }

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error("Unexpected response format from Gemini API");
};

export const generateAIResponse = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const models = getModels();
  let lastError = null;

  // Try each model in order (quickly, no long waits)
  for (const model of models) {
    try {
      return await callGemini(model, prompt, apiKey);
    } catch (err) {
      lastError = err;
      console.error(`Gemini model "${model}" failed (${err.retryable ? "busy" : "error"}):`, err.message);
      // Non-retryable errors (invalid key, model gone) — no point trying more models
      if (!err.retryable) break;
    }
  }

  throw lastError || new Error("Gemini API failed");
};
